// to exec, require command line args :
// node x.js <username> <pw> <list_of_users> <time_between_posts>
let exit_need_args = () => {
	console.log('too few args')
	console.log('node x.js <username> <pw> <list_of_users> <time_between_posts>')
}

// did  user  provide  cmd line  args? exit if missing
process.argv[2] && process.argv[3] && process.argv[4] ? {} : exit_need_args()

// requirements
var IgApiClient = require('instagram-private-api'),
Bluebird = require('bluebird');
const ig = new IgApiClient.IgApiClient();

// more requirements
var fs = require('fs')
, request = require('request')
, x = require('./x.js')
, funx = new x.funx()
, q = new x.q()
, child_process = require('child_process')
, id_to_text = {};

let main = () => {
	return new Promise(async function(resolve, reject) {
		console.log('removing previously existing data')
		child_process.execSync('rm -rf ' + __dirname + '/data/*');
		console.log('reading in file of users')
		var list_of_users = (await funx.readFile('/'+process.argv[4]))

		// get posts from each user, add them to queue
		var all_posts = [];
		for (let i = 0; i < list_of_users.length; i++) {
			let posts
			try {
				posts = (await funx.getPosts(list_of_users[i]))
			} catch (e) {
				console.log(e)
			}

			// add post to queue
			for (post in posts) {
				all_posts.push(posts[post])
			}
		}

		// TODO : build table of media_id -> text
		for (let i = 0; i < all_posts.length; i++) {

			id_to_text[all_posts[i].media_id] = all_posts[i].text
		}

		// console.log(id_to_text)
		// process.exit(0)


		for (let i = 0; i < all_posts.length; i++) {

			// build directory
			let image_dir = "/" + all_posts[i].owner_id,
					image_path = "/" + all_posts[i].media_id + ".jpg";


			if (!fs.existsSync(__dirname +  '/data')) { fs.mkdirSync(__dirname + '/data') }
			if (!fs.existsSync(__dirname + '/data' + image_dir)) { fs.mkdirSync(__dirname + '/data' + image_dir) }
			if (!fs.existsSync(__dirname + '/data' + image_dir + image_path)) {
				try {
					// try to download image
					// try to place/organize image in corresponding directory
					await funx.download(all_posts[i].display_url, __dirname + '/data' + image_dir + image_path).then((resolution, rejection) => {})

					// enqueue post
					q.enqueue('/data' + image_dir + image_path)
				} catch (e) {
					console.log(e)
				}
				console.log(i, ':', all_posts.length)
				i == all_posts.length-1 ? resolve() : {}
			} else {
				console.log('file exists')
				i == all_posts.length-1 ? resolve() : {}
			}
		}
	})
}


// login
async function login() {
  // basic login-procedure
  ig.state.generateDevice(process.argv[2]);
  ig.state.proxyUrl = process.env.IG_PROXY;
  await ig.account.login(process.argv[2], process.argv[3]);
}

main().then(async function(resolution, rejection) {

	// login to ig via private api
	await login()

	// define geolocation to associate w post
	const { latitude, longitude, searchQuery } = {
	    latitude: 38.9072,
	    longitude: -77.0369,
	    // not required
	    searchQuery: 'washington',
	};

	// define locations to pass as publish() param
	const locations = await ig.search.location(latitude, longitude, searchQuery);

	console.log('images scheduled to post :')
	console.log(q.supporting_array)

	// define mediaLocation to pass as publish() param
	const mediaLocation = locations[0];
	console.log('location', mediaLocation)

	// check if already_posted_list exists, if not create it
	// this file is used to track the posts that have already been made
	funx.file_exists_and_creation('already_posted_list')
	let already_posted_list = await funx.readFile('/already_posted_list')
	console.log('already posted', already_posted_list)


	// while there are still  images in queue to post, post each one
	// sleep after each post, sleep duration specified in cmd line arg
	while (q.supporting_array.length > 0) {
		let next_post = q.dequeue()
		// read already posted file into mem
		already_posted_list = await funx.readFile('/already_posted_list')

		// check if post  has been made already in 'already_made' list
		// if it already has been made, then skip posting and sleeping and go back to start of while loop
		if (!already_posted_list.includes(next_post)) {
			let caption = id_to_text[funx.extract_id(next_post)]
			// post hasn't been made
			try {
				const publishResult = await ig.publish.photo({
					// read the file into a Buffer
					file: await Bluebird.fromCallback(cb => fs.readFile(__dirname + next_post, cb)), location: mediaLocation, caption: caption, usertags: {},
				});
				// log post ID into 'alread_made' list
				fs.appendFileSync('already_posted_list', next_post + '\r\n');

				await funx.sleep(process.argv[5])
			} catch (e) {
				console.log(e)
			}
		}
	}
})

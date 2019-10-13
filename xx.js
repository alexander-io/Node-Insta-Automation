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
, observed_users = 0
, child_process = require('child_process');

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
	    latitude: 0.0,
	    longitude: 0.0,
	    // not required
	    searchQuery: 'place',
	};

	// define locations to pass as publish() param
	const locations = await ig.search.location(latitude, longitude, searchQuery);

	// define mediaLocation to pass as publish() param
	const mediaLocation = locations[0];

	console.log('images scheduled to post :')
	console.log(q.supporting_array)

	// while there are still  images in queue to post, post each one
	// sleep after each post, sleep duration specified in cmd line arg
	while (q.supporting_array.length > 0) {
		let next_post = q.dequeue()

		const publishResult = await ig.publish.photo({
    	// read the file into a Buffer
    	file: await Bluebird.fromCallback(cb => fs.readFile(__dirname + next_post, cb)), location: mediaLocation, caption: 'my caption', usertags: {},
		});

		await funx.sleep(process.argv[5])
	}
})

var IgApiClient = require('instagram-private-api'),
Bluebird = require('bluebird');
const ig = new IgApiClient.IgApiClient();

// process.exit(0)

// to exec, require command line args :
// node x.js <username> <pw> <list_of_users> <time_between_posts>
let exit_need_args = () => {
	console.log('too few args')
	console.log('node x.js <username> <pw> <list_of_users> <time_between_posts>')
}

// did  user  provide  cmd line  args? exit if missing
process.argv[2] && process.argv[3] && process.argv[4] ? {} : exit_need_args()

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

		// TODO
		// console.log(list_of_users)

		var all_posts = [];
		for (let i = 0; i < list_of_users.length; i++) {
			// TODO
			// console.log('request posts for user :', list_of_users[i])
			let posts
			try {
				posts = (await funx.getPosts(list_of_users[i]))
			} catch (e) {
				console.log(e)
			}

			for (post in posts) {
				all_posts.push(posts[post])
			}
		}

		// console.log(all_posts)
		// console.log('total number of posts ' + all_posts.length)

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
					console.log('enqueue')
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

let captions = {
	'pug.legendary' : [
		'\n#pugs #pug #pugsofinstagram #puglife #dog #puglove #dogsofinstagram #dogs #pugnation #pugsnotdrugs #puppy #cute #pugpuppy #pugworld #pugstagram #pugoftheday',
		'\n#puglovers #instapug #pugdog #dogstagram #puppiesofinstagram #puglover #love #like #pugloversclub #mops #pugbasement #puppies #puggle',
		'\n#pets #instadog #petsofinstagram #pugpuppies #puggy #follow #dogsofinsta #worldofpug #pugsofig #popularpugs #fawnpug #pugglesofinstagram #smilingpugs',
		'\n#dogoftheday #pugsrule #blackpug #pet #puglia #instagram #doglover #of #ilovemydog #carlino #ilovemypug #baby #dailypug #sophiathepugg #pugstyle #pugsoninstagram #dailydoseofpugs'
	],
	'dope.truck' : [
		"\nRate this truck 1 - "+ Math.ceil(Math.random()*1000%150) +"\n\nTag a friend that would drive this truck : @truckporn \n\n#trucks #f #truck #x #ford #chevy #truckporn #dodge #offroad #diesel #trucking #trucksofinstagram #liftedtrucks #lifted #duramax #ram #cars #trucklife",
		"\nRate this truck 1 - "+ Math.ceil(Math.random()*1000%150) +"\n\nTag a friend that would drive this truck : @truckporn \n\n#trucker #v #cummins #truckdaily #powerstroke #trucknation #gmc #dieseltrucks #s #truckdriver #truckerhat",
		"\nRate this truck 1 - "+ Math.ceil(Math.random()*1000%150) +"\n\nTag a friend that would drive this truck : @truckporn \n\n#truck #4x4 #liftedtrucks #truckporn #yota #chevy #dodge #ford #offroad"
	]
}

// login
async function login() {
  // basic login-procedure
  ig.state.generateDevice(process.argv[2]);
  ig.state.proxyUrl = process.env.IG_PROXY;
  await ig.account.login(process.argv[2], process.argv[3]);
}

main().then(async function(resolution, rejection) {
	// console.log('done')
	// TODO
	// process.exit(0)

	await login()
	console.log('finished login')

	const { latitude, longitude, searchQuery } = {
	    latitude: 0.0,
	    longitude: 0.0,
	    // not required
	    searchQuery: 'place',
	};


	const locations = await ig.search.location(latitude, longitude, searchQuery);


	const mediaLocation = locations[0];

	// process.exit(0)


	// TODO
	console.log('finished main')
	console.log(q.supporting_array)

	while (q.supporting_array.length > 0) {
		let next_post = q.dequeue()
		// TODO
		// upload image
		// console.log(next_post)
		const publishResult = await ig.publish.photo({
    	// read the file into a Buffer
    	file: await Bluebird.fromCallback(cb => fs.readFile(__dirname + next_post, cb)), location: mediaLocation, caption: 'my caption', usertags: {},
		});

		await funx.sleep(process.argv[5])
	}
})

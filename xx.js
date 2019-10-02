// to exec, require command line args :
// node x.js <username> <pw> <list_of_users> <time_between_posts>
let exit_need_args = () => {
	console.log('too few args')
	console.log('node x.js <username> <pw> <list_of_users> <time_between_posts>')
}

process.argv[2] && process.argv[3] && process.argv[4] ? {} : exit_need_args()

process.exit(0)

var Client = require('instagram-private-api').V1
, device = new Client.Device(process.argv[2])
, storage = new Client.CookieFileStorage(__dirname + '/cookies/' + process.argv[2] +  '.json')
, fs = require('fs')
, request = require('request')
, x = require('./x.js')
, funx = new x.funx()
, q = new x.q()
, observed_users = 0,
child_process = require('child_process');

let main = () => {
	return new Promise(async function(resolve, reject) {
		console.log('removing previously existing data')
		child_process.execSync('rm -rf ' + __dirname + '/data/*');
		console.log('reading in file of users')
		var list_of_users = (await funx.readFile('/'+process.argv[4]))
		console.log(list_of_users)
		var all_posts = [];
		for (let i = 0; i < list_of_users.length; i++) {
			console.log('request posts for user :', list_of_users[i])
			let posts
			try {
				posts = (await funx.getPosts(list_of_users[i]))
			} catch (e) {
				console.log(e)
			}
			// console.log(posts)
			console.log('merge posts of user :', list_of_users[i])
			for (post in posts) {
				all_posts.push(posts[post])
			}
		}
		console.log(all_posts)
		console.log('total number of posts ' + all_posts.length)
		console.log('done')
		process.exit(0)

		console.log('filtering out video posts...')
		all_posts.filter(post => post.is_video == false)
		console.log(all_posts)
		console.log(all_posts.length)
		for (let i = 0; i < all_posts.length; i++) {
			let image_dir = "/" + all_posts[i].user,
					image_path = "/" + all_posts[i].code + ".jpg";
			if (!fs.existsSync(__dirname +  '/data')) { fs.mkdirSync(__dirname + '/data') }
			if (!fs.existsSync(__dirname + '/data' + image_dir)) { fs.mkdirSync(__dirname + '/data' + image_dir) }
			if (!fs.existsSync(__dirname + '/data' + image_dir + image_path)) {
				try {
					await funx.download(all_posts[i].image, __dirname + '/data' + image_dir + image_path).then((resolution, rejection) => {})
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

main().then(async function(resolution, rejection) {
	console.log('eh')
	while (q.supporting_array.length > 0) {
		let next_post = q.dequeue()

		Client.Session.create(device, storage, process.argv[2], process.argv[3])
		.then(function(session) {
			console.log('posting', next_post)
			console.log('\tremaining queue length :', q.supporting_array.length)
			Client.Upload.photo(session, __dirname + next_post)
			.then(function(upload) {
				// upload instanceof Client.Upload
				// nothing more than just keeping upload id
				console.log(upload.params.uploadId);
				let captions_list = captions[process.argv[2]]
				let random_caption = captions_list[Math.floor(Math.random()*10%captions_list.length)]

				return Client.Media.configurePhoto(session, upload.params.uploadId, next_post + random_caption );
			})
			.then(function(medium) {
				// we configure medium, it is now visible with caption
				console.log(medium.params)
				q.enqueue(next_post)
			})
		})
		await funx.sleep(process.argv[5])
	}
})

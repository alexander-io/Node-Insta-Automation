
var Client = require('instagram-private-api').V1
, device = new Client.Device('sato.shi.shi')
, storage = new Client.CookieFileStorage(__dirname + '/cookies/someuser.json')
, fs = require('fs')
, request = require('request')
, x = require('./x.js')
, funx = new x.funx()
, q = new x.q()
, observed_users = 0,
child_process = require('child_process');

let main = () => {
	return new Promise(async function(resolve, reject) {
		child_process.execSync('rm -rf ' + __dirname + '/data/*');
		var list_of_users = (await funx.readFile('/users'))
		console.log(list_of_users)
		var all_posts = [];
		for (let i = 0; i < list_of_users.length; i++) {
			let posts = (await funx.getPosts(list_of_users[i]))
			for (post in posts) {
				all_posts.push(posts[post])
			}
		}
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


// (async function() {
// 	while (true) {
// 		await main()
// 		while (q.supporting_array.length > 0) {
// 			Client.Session.create(device, storage, 'sato.shi.shi', 'whyisthissodifficult')
// 			.then(function(session) {
// 				console.log('posting', next_post)
// 				console.log('\tremaining queue length :', q.supporting_array.length)
// 				Client.Upload.photo(session, __dirname + next_post)
// 				.then(function(upload) {
// 					// upload instanceof Client.Upload
// 					// nothing more than just keeping upload id
// 					console.log(upload.params.uploadId);
// 					return Client.Media.configurePhoto(session, upload.params.uploadId, 'truck');
// 				})
// 				.then(function(medium) {
// 					// we configure medium, it is now visible with caption
// 					console.log(medium.params)
// 				})
// 			})
// 			await funx.sleep(10000)
// 		}
// 	}
// })()

// x()
main().then(async function(resolution, rejection) {
	while (q.supporting_array.length > 0) {
		let next_post = q.dequeue()

		Client.Session.create(device, storage, 'dope.truck', 'whyisthissodifficult')
		.then(function(session) {
			console.log('posting', next_post)
			console.log('\tremaining queue length :', q.supporting_array.length)
			Client.Upload.photo(session, __dirname + next_post)
			.then(function(upload) {
				// upload instanceof Client.Upload
				// nothing more than just keeping upload id
				console.log(upload.params.uploadId);
				return Client.Media.configurePhoto(session, upload.params.uploadId, next_post);
			})
			.then(function(medium) {
				// we configure medium, it is now visible with caption
				console.log(medium.params)
				q.enqueue(next_post)
			})
		})
		await funx.sleep(1000000)
	}
})

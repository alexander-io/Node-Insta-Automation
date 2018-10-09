
var Client = require('instagram-private-api').V1;
var device = new Client.Device('sato.shi.shi');
var storage = new Client.CookieFileStorage(__dirname + '/cookies/someuser.json');
var x = require('./x.js');
var fs = require('fs');
var request = require('request');
var funx = new x.x();
var q = new x.q();
var num_users;

let main = () => {
	return new Promise(function(resolve, reject) {
		(async () => {
			num_users = (await funx.readFile('/users')).length;
			(await funx.readFile('/users')).map(async (user) => {
				let post = (await funx.getPosts(user))[0]
				let image_dir = "/" + post.user
				let image_path = "/" + post.code + ".jpg"
				if (!fs.existsSync(__dirname +  '/data')) { fs.mkdirSync(__dirname + '/data') }
				if (!fs.existsSync(__dirname + '/data' + image_dir)) { fs.mkdirSync(__dirname + '/data' + image_dir) }
				await funx.download(post.image, __dirname + '/data' + image_dir + image_path, function() {
					console.log('downloaded')
					q.enqueue('/data' + image_dir + image_path)
					if (q.supporting_array.length == num_users) {
						resolve()
					}
				})
			})
		})()
	})
}


main().then(function(resolution, rejection) {
	let  number_of_posts_made = 0;
	while (number_of_posts_made < num_users) {
		setTimeout(function() {
			Client.Session.create(device, storage, 'sato.shi.shi', 'whyisthissodifficult')
				.then(function(session) {
					Client.Upload.photo(session, __dirname + q.dequeue())
					.then(function(upload) {
						number_of_posts_made++;
						return Client.Media.configurePhoto(session, upload.params.uploadId, 'akward caption');
					})
				})
		}, 1000 * (number_of_posts_made*10))
		number_of_posts_made++
	}
})

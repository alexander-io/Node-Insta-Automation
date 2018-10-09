
var Client = require('instagram-private-api').V1
, device = new Client.Device('sato.shi.shi')
, storage = new Client.CookieFileStorage(__dirname + '/cookies/someuser.json')
, fs = require('fs')
, request = require('request')
, x = require('./x.js')
, funx = new x.funx()
, q = new x.q()
, num_users
, observed_users = 0;

let main = () => {
	return new Promise(async function(resolve, reject) {
		num_users = (await funx.readFile('/users')).length;
		(await funx.readFile('/users')).map(async (user) => {
			let post = (await funx.getPosts(user))[0] ,
					image_dir = "/" + post.user ,
					image_path = "/" + post.code + ".jpg";

			if (!fs.existsSync(__dirname +  '/data')) { fs.mkdirSync(__dirname + '/data') }
			if (!fs.existsSync(__dirname + '/data' + image_dir)) { fs.mkdirSync(__dirname + '/data' + image_dir) }
			if (!fs.existsSync(__dirname + '/data' + image_dir + image_path)) {
				await funx.download(post.image, __dirname + '/data' + image_dir + image_path, function() {
					// download complete
					q.enqueue('/data' + image_dir + image_path)
					observed_users++;
					observed_users == num_users ? resolve() : {}
				})
			} else {
				console.log('file exists')
				observed_users++;
			}
		})
	})
}

main().then(function(resolution, rejection) {
	let  number_of_posts_made = 0;
	while (number_of_posts_made < q.supporting_array.length) {
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

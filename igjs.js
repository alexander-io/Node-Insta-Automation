var fs = require('fs'), readline = require('readline')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

function getPosts(user) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = 'https://allorigins.me/get?url=' + encodeURIComponent('https://instagram.com/' + user + '/')

    xhr.open("GET", url);
    xhr.onload = () => resolve(formatPosts(xhr.responseText, user));
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
  });
}

function formatPosts(rawPosts, username) {
  let result = [];
  rawPosts = JSON.parse(rawPosts)
  rawPosts = JSON.parse(rawPosts.contents.split('window._sharedData = ')[1].split('\;\<\/script>')[0]).entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges
  rawPosts.forEach(function (item) {
    result.push({
      user : username,
      image: item.node.display_url,
      dimensions: item.node.dimensions,
      likes: item.node.edge_liked_by.count,
      video: item.node.is_video,
      code: item.node.shortcode,
      url: 'https://instagram.com/p/' + item.node.shortcode,
      timestamp: item.node.taken_at_timestamp
    })
  })
  return result;
}

let readFile = (path_to_file) => {
  return new Promise((resolve, reject) => {
    let result = [],
    line_reader = readline.createInterface({
      input : fs.createReadStream(__dirname + path_to_file)
    })
    line_reader.on('line', (line) => {
      result.push(line)
    })
    line_reader.on('close', () => {
      resolve(result)
    })
  })
}

// v0.0.4
(async () => {
  (await readFile('/users')).map(async (user) => {
    console.log((await getPosts(user))[0])
  })
})()

// v0.0.1
// readFile('/./readme').then((resolution, rejection) => {
//   resolution.map((user) => {
//     getPosts(user).then((resolution, rejection) => {
//       console.log(resolution[0]);
//     })
//   })
// })

// v0.0.2
// readFile('/./readme').then((resolution, rejection) => {
//   console.log('reading')
//   resolution.map((user) => {
//     (async () => {
//       let posts =  await getPosts(user)
//       console.log(posts[0])
//     })()
//   })
// })

// v0.0.3
// (async () => {
//   let list_of_users = await readFile('/./readme')
//   list_of_users.map(async (user) => {
//     let posts = await getPosts(user)
//     console.log(posts[0])
//   })
// })()

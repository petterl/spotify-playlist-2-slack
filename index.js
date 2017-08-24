var fs = require('fs');
var redis = require('redis');
var slack = require('slack-notify')(process.env.SLACK_URL);

// ------------------

var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID, 
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});
var spotifyUser = process.env.SPOTIFY_USERNAME;
var spotifyPlaylistId = process.env.SPOTIFY_PLAYLIST;
var redisUrl = process.env.REDISTOGO_URL;
var runWebServer = process.env.VCAP_APP || false;

// ------------------
var lastDate;
var redisClient;

if (redisUrl) {
  var rtg = require('url').parse(redisUrl);
  redisClient = redis.createClient(rtg.port, rtg.hostname);
  redisClient.auth(rtg.auth.split(":")[1]);
  
  redisClient.on('error', function (err) {
    console.log("Redis - Error " + err);
  });
  redisClient.get("lastDate", function(err, value) {
    if (!err) {
      lastDate = new Date(value);
    }
  });
} else {
  fs.readFile('./last_date.txt', {encoding: 'UTF-8'}, function(err, date){
     lastDate = date ? new Date(date) : void 0;
  });
}

var start = false;
function grantClient() {
  spotifyApi.clientCredentialsGrant()
    .then(function(data) {
      console.log('Spotify - got new access token, valid for', data.body.expires_in, 'seconds');

      spotifyApi.setAccessToken(data.body.access_token);
      start = true;
      
      setTimeout(grantClient, (data.body.expires_in*1000) - 1000);
    }, function(err) {
      console.log('Spotify - Error retrieving an access token using:', process.env.SPOTIFY_CLIENT_SECRET, err);
      process.exit(1);
    });
}

function writeLastDate(date) {
  lastDate = date;

  if (redisUrl) {
      redisClient.set('lastDate', date);
  } else {
     fs.writeFile('./last_date.txt', date, function() {});
  }
}

var playlistName;
var playlistUrl;
function fetchPlaylistInfo() {
  if (!start) {
    setTimeout(fetchPlaylistInfo, 1000);
  }
  console.log('Spotify - Fetch playlist info');
  spotifyApi.getPlaylist(spotifyUser, spotifyPlaylistId, {fields: 'name,external_urls.spotify'})
    .then(function(data) {
      playlistName = data.body.name;
      playlistUrl = data.body.external_urls.spotify;
      console.log('Spotify - Playlist:', playlistName, "at", playlistUrl);
    }, function(err) {
      console.log('Spotify - Error retrieving playlist info:', err);
    });
}

function fetchPlaylistTracks(offset) {
  if (!start || playlistUrl === undefined) {
    return;
  }

  if (offset === undefined) {
    offset = 0;
  }

  console.log('Playlist last known song added at:', lastDate);
  doFetchPlaylistTracks(offset);
}

var user_cache = {};
function get_user(id) {
  if (user_cache[id]) {
    return user_cache[id];
  }
  spotifyApi.getUser(id)
    .then(function(data) {
      user_cache[id] = data.body.display_name ? data.body.display_name : id;
      return user_cache[id];
    }, function(err) {
      console.log('Spotify - could not fetch displayname for: ', id, err);
    });
}

function doFetchPlaylistTracks(offset) {
  spotifyApi.getPlaylistTracks(spotifyUser, spotifyPlaylistId, { offset: offset,
      fields: 'total,items(added_by.id,added_at,track(name,artists.name,album.name))'})
    .then(function(data) {
      var date = 0;
      for (var i in data.body.items) {
        date = new Date(data.body.items[i].added_at);
        if((lastDate === undefined) || (date > lastDate)) {
          console.log(data.body.items[i])
          post(playlistName, playlistUrl, 
            (data.body.items[i].added_by === undefined) ? get_user(data.body.items[i].added_by.id) : 'Unknown',
            data.body.items[i].track.name,
            data.body.items[i].track.artists);
        }
      }
      if((lastDate === undefined) || (date > lastDate)) {
        console.log('Spotify - last date in playlist', date, "saving...");
        writeLastDate(date);
      }
      if(data.body.total >= (offset + 100)) {
        doFetchPlaylistTracks(offset + 100);
      }
    }, function(err) {
      console.log('Spotify - Error retrieving playlist at offset:', offset, err);
    });
}

slack.onError = function (err) {
  console.log('Slack - Error:', err);
};

var slacker = slack.extend({
  username: 'spotify-playlist',
  icon_url: 'http://icons.iconarchive.com/icons/xenatt/the-circle/256/App-Spotify-icon.png',
  unfurl_media : false
});

function post(list_name, list_url, added_by, trackname, artists) {
  var text = 'New track added by ' + added_by + ' - *' + trackname+'* by '+artists[0].name+' in list <'+list_url+'|'+list_name+'>';
  console.log(text);
  slacker({text: text});
}

function startWebServer() {
  var http = require('http');
  var host = process.env.VCAP_APP_HOST || 'localhost';
  var port = process.env.VCAP_APP_PORT || 1337;

  http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('No functions and features at this place...' + process.version);
  }).listen(port, null);
  
  console.log('Server running to provide incoming network connetion for Bluemix at http://' + host + ':' + port + '/');

  // set the current date as the initial date to avoid writing the whole song history to the slack channel
  var now = new Date();
  writeLastDate(now);
}

if(runWebServer) {
  startWebServer();
}
grantClient();
setTimeout(fetchPlaylistInfo, 1000);
setInterval(fetchPlaylistTracks, 1000 * 10);

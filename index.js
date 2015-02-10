var fs = require('fs');
var redis = require('redis');
var SpotifyWebApi = require('spotify-web-api-node');
var slack = require('slack-notify')(process.env.SLACK_URL);

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

var lastDate;

var rtg = require('url').parse(process.env.REDISTOGO_URL);
var client = redis.createClient(rtg.port, rtg.hostname);
client.auth(rtg.auth.split(':')[1]);

client.on('error', function (err) {
  console.log('Redis - Error:' + err);
});

client.get('lastDate', function(err, value) {
  if (err) {
    console.log('Redis - Error getting lastDate:', err)
  }

  lastDate = new Date(value);
});

var start = false;
function grantClient() {
  spotifyApi.clientCredentialsGrant()
    .then(function(data) {
      console.log('Spotify - got new access token, valid for', data.expires_in, 'seconds');

      spotifyApi.setAccessToken(data.access_token);
      start = true;
      
      setTimeout(grantClient, data.expires_in * 1000);
    }, function(err) {
      console.log('Spotify - Error retrieving an access token:', err);
      process.exit(1);
    });
}

function writeLastDate() {
  lastDate = date;

  if (!process.env.REDISTOGO_URL) {
    lastDate = new Date(fs.readFileSync('./last_date.txt').toString() );
    fs.writeFile('./last_date.txt', date, function() {});
  }

  client.set('lastDate', date);
}

function fetchPlaylist() {
  if (!start) {
    return;
  }

  console.log('Playlist last fetched at:', lastDate);
  spotifyApi.getPlaylist(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST, {fields: 'tracks.items(added_by.id,added_at,track(name,artists.name,album.name)),name,external_urls.spotify'})
    .then(function(data) {
      for (var i in data.tracks.items) {
        var date = new Date(data.tracks.items[i].added_at);
        if((lastDate === undefined) || (date > lastDate)) {
          post(data.name, 
            data.external_urls.spotify, 
            data.tracks.items[i].added_by ? data.tracks.items[i].added_by.id : 'Unknown',
            data.tracks.items[i].track.name,
            data.tracks.items[i].track.artists);

          writeLastDate(data.tracks.items[i].added_at);
        }
      }
    }, function(err) {
      console.log('Spotify - Error retrieving playlists:', err);
    });
  };
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
  var text = 'New track added by ' + added_by + ' - *' + trackname+'* with '+artists[0].name+' in list <'+list_url+'|'+list_name+'>';
  console.log(text);

  slacker({
    text: text
  });
}

grantClient();
setInterval(fetchPlaylist, 1000 * 10);

var SpotifyWebApi = require('spotify-web-api-node');
var credentianls = {clientId:process.env.SPOTIFY_CLIENT_ID, clientSecret:process.env.SPOTIFY_CLIENT_SECRET};
var spotifyApi = new SpotifyWebApi(credentianls);
var spotifyUser = process.env.SPOTIFY_USERNAME;
var spotifyPlaylistId = process.env.SPOTIFY_PLAYLIST;

var slack = require('slack-notify')(process.env.SLACK_URL);

var fs = require('fs');

var start = false;
function grantClient() {
	spotifyApi.clientCredentialsGrant()
  	.then(function(data) {
        console.log('Got new access token, valid for', data['expires_in'], 'seconds');
	    spotifyApi.setAccessToken(data['access_token']);
	    start = true;
	    setTimeout(grantClient, data['expires_in']*1000);
	  }, function(err) {
	        console.log('Something went wrong when retrieving an access token', err);
	        process.exit(1);
	  });
}


var fetchPlaylist = function() {
	var lastDate;
	var writeLastDate;
	if (process.env.REDISTOGO_URL) {
		var rtg   = require("url").parse(process.env.REDISTOGO_URL);
		redis = require("redis").createClient(rtg.port, rtg.hostname);
		redis.auth(rtg.auth.split(":")[1]);
		lastDate = new Date(redis.get("lastDate"));
		writeLastDate = function(date) {
			redis.set('lastDate', date, function(err, reply){
				if (err){
					console.error('Error setting new value to redis\n-----------------------------');
					console.error(err);
					process.exit(1);
				}
			})
		};

	} else {
		lastDate = new Date(fs.readFileSync('./last_date.txt').toString() );
		writeLastDate = function(date) {
			fs.writeFile("./last_date.txt", lastDate, function() {});
		}

	}

	return function() {
		if (!start) return;
		spotifyApi.getPlaylist(spotifyUser, spotifyPlaylistId, {fields: 'tracks.items(added_by.id,added_at,track(name,artists.name,album.name)),name,external_urls.spotify'})
		  .then(function(data) {
		    for (var i in data.tracks.items) {
		   	  var date = new Date(data.tracks.items[i].added_at);
		   	  if((lastDate == undefined) || (date > lastDate)) {
		   	  	post(data.name, 
		   	  		data.external_urls.spotify, 
		   	  		data.tracks.items[i].added_by ? data.tracks.items[i].added_by.id : "Unknown",
		   	  		data.tracks.items[i].track.name,
		   	  		data.tracks.items[i].track.artists);
		   	  	lastDate = new Date(data.tracks.items[i].added_at);
		   	  	writeLastDate(lastDate);
		   	  }
		   }
		  }, function(err) {
		    console.log('Something went wrong!', err);
		  });
	}
};

slack.onError = function (err) {
  console.log('API error:', err);
};
var spotify = slack.extend({
  username: 'spotify-playlist',
  icon_url: 'http://icons.iconarchive.com/icons/xenatt/the-circle/256/App-Spotify-icon.png',
  unfurl_media : false
});

function post(list_name, list_url, added_by, trackname, artists) {
	var text = 'New track added by ' + added_by + ' - *' + trackname+'* with '+artists[0].name+' in list <'+list_url+'|'+list_name+'>';
	console.log(text);
	spotify({text: text});
}

grantClient();
setInterval(fetchPlaylist(), 1000 * 10);

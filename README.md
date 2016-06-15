# spotify-playlist-2-slack
========================

[![Code Climate](https://codeclimate.com/github/petterl/spotify-playlist-2-slack/badges/gpa.svg)](https://codeclimate.com/github/petterl/spotify-playlist-2-slack)

Show new playlist entries in slack channel

## Configuration

You need to set these environment variables in heroku or as environ variables for foreman:

```
SLACK_URL=https://hooks.slack.com/services/*/*/*

SPOTIFY_CLIENT_ID=ClientID
SPOTIFY_CLIENT_SECRET=ClientSecret
SPOTIFY_USERNAME=SpotifyUsername
SPOTIFY_PLAYLIST=PlaylistId
VCAP_APP=true
```

If you want to store last fetched datestamp in redistogo (like on heroku) instead of local file set:
```
REDISTOGO_URL=URL
```

If you run on bluemix you can start the webserver by setting:
```
VCAP_APP=true
```

## License

MIT. Copyright &copy; 2015 [Petter Sandholdt](https://github.com/petterl)

## Deploy to Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Deploy to Bluemix
[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/petterl/spotify-playlist-2-slack)

## Authors

Main author: Petter Sandholdt

Many thanks for help by: 
petschni
matiassingers
prlakhani
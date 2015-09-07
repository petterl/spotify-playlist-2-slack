spotify-playlist-2-slack
========================

Show new playlist entries in slack channel

## Configuration

You need to set these environment variables in heroku or as environ variables for foreman:

```
SLACK_URL=https://hooks.slack.com/services/*/*/*

SPOTIFY_CLIENT_ID=ClientID
SPOTIFY_CLIENT_SECRET=ClientSecret
SPOTIFY_USERNAME=SpotifyUsername
SPOTIFY_PLAYLIST=PlaylistId
```

If you want to store last fecthed datestamp in redistogo (like on heroku) instead of local file set:
```
REDISTOGO_URL=URL
```

## License

MIT. Copyright &copy; 2015 [Petter Sandholdt](https://github.com/petterl)

## Deploy to Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Deploy to Bluemix
[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/petschni/spotify-playlist-2-slack)

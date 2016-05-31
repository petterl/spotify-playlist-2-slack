# spotify-playlist-2-slack [![Build Status](http://img.shields.io/travis/petterl/spotify-playlist-2-slack.svg?style=flat-square)](https://travis-ci.org/petterl/spotify-playlist-2-slack)
> show new playlist entries in Slack channel

## Configuration

You need to set these environment variables in heroku or as environ variables for foreman:

```
SLACK_URL*=https://yourslackdomain.slack.com/services/hooks/incoming-webhook?token=SomeSecretToken

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

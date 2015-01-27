# spotify-playlist-2-slack
Show new playlist entries in slack channel

# config
You need to set these environment variables:


SLACK_URL=<Inbound WebHook URL>
SPOTIFY_CLIENT_ID=<Developer client ID>
SPOTIFY_CLIENT_SECRET=<developer client secret>
SPOTIFY_USERNAME=<Playlist username>
SPOTIFY_PLAYLIST=<Playlist Id>



If you want to store last fecthed datestamp in redistogo (like on heroku) instead of local file set:
REDISTOGO_URL=<URL>

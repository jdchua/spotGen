var express       = require("express"),
    app           = express(),
    SpotifyWebApi = require('spotify-web-api-node');
var bodyParser = require("body-parser");

var scopes = ['user-read-private', 'user-read-email', "playlist-modify-public", "playlist-modify-private"],
//   redirectUri = 'https://singleplaylist-jeremiahchua.c9users.io/callback',
  redirectUri = 'https://spotgen.herokuapp.com/callback',
  clientId = '2f611dfa341b4b1caab7acb66ed7f351',
  state = '123';
  
      
var spotifyApi = new SpotifyWebApi({
  clientId: '2f611dfa341b4b1caab7acb66ed7f351',
  clientSecret: '605457ee518d4220acaef7f428187c1e',
//   redirectUri: 'https://singleplaylist-jeremiahchua.c9users.io/callback',
  redirectUri: 'https://spotgen.herokuapp.com/callback',
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static("public"));


var name = [];
var playlistName = [];
var count = 0;



app.get("/", function(req, res){
    res.render("index");
    name = [];
    playlistName = [];
    count = 0;
});


app.get("/callback", function(req,res) {
    var code = req.query.code;
    var userID;
    var playlistID;
    var songs;
    var lastCreated;

    if (count === 0) {
        spotifyApi.authorizationCodeGrant(code).then(function(data) {
            spotifyApi.setAccessToken(data.body['access_token']);
            return spotifyApi.getMe();
        }).then(function(data) {
            userID = data.body.id;
            // console.log("userID: " + userID);
            return spotifyApi.createPlaylist(data.body.id, playlistName[0]);
        }).then(function(data) {
            playlistID = data.body.id;
            // console.log("createdPlaylistID: " + playlistID);
            // console.log(name);
            return spotifyApi.searchArtists(name);
        }).then(function(data) {
            var id = data.body.artists.items[0].id;
            // console.log("artistID: " + id);
            return id;
        }).then(function(data){
            return spotifyApi.getArtistTopTracks(data, "us");
        }).then(function(data){
            songs = [];
            for(var i = 0; i < data.body.tracks.length; i++) {
             songs.push(data.body.tracks[i].uri);
            }
            return spotifyApi.addTracksToPlaylist(playlistID, songs);  
        }).catch(function(err) {
            console.log('Something went wrong!', err);
        });
        count++;
    } else if (count > 0) {
        spotifyApi.authorizationCodeGrant(code).then(function(data) {
            spotifyApi.setAccessToken(data.body['access_token']);
            return spotifyApi.getMe();
        }).then(function(data) {
            userID = data.body.id;
            return spotifyApi.getUserPlaylists(userID);
        }).then(function(data) {
            lastCreated = data.body.items[0].id;
            name.shift();
            // console.log(name);
            return spotifyApi.searchArtists(name);
        }).then(function(data) {
            var id = data.body.artists.items[0].id;
            // console.log("artistID: " + id);
            return id;
        }).then(function(data) {
            return spotifyApi.getArtistTopTracks(data, "us");
        }).then(function(data) {
            songs = [];
            for(var i = 0; i < data.body.tracks.length; i++) {
             songs.push(data.body.tracks[i].uri);
            }
            return spotifyApi.addTracksToPlaylist(lastCreated, songs);  
        }).catch(function(err) {
            console.log('Something went wrong!', err);
        });
    }
    
    res.redirect("/add");
});

app.get("/add", function(req, res){
   var artist = name[name.length - 1];
   res.render("add", {
       artist: artist,
   });
});


app.post("/", function(req, res) {
    
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
    name.push(req.body.name);
    playlistName.push(req.body.playlist);
  
})

app.post("/add", function(req, res) {
    name.push(req.body.name);
})


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("spotGen is running!");
})

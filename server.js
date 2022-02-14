var express = require('express'); // the server
var http = require('http');
var bodyParser = require('body-parser'); // parses json
var passport = require('passport'); // auth
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //global hack
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
app.use(cors()); // middleware handling browser calls
app.use(bodyParser.json()); // defining it as a json parser
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize()); // handling basic auth and jwt

var router = express.Router(); // for use with express

function getJSONObject(req) { // for movie requirement for hw2
    var json = {
        status: "No status",
        msg: "No msg",
        headers : "No Headers", // if no headers, returns this
        query: "No Query",
        key: process.env.UNIQUE_KEY,
        body : "No Body" // if no body, returns this
    };

    if (req.body != null) { // getting body if not null
        json.body = req.body;
    }
    if (req.headers != null) { // getting header if not null
        json.headers = req.headers;
    }

    return json; // returning the object
}

const includedMethods = ['PUT', 'POST', 'DELETE', 'GET'];

// using middleware in order to handle only the methods we have included
router.use((req, res, next) => {
    if (includedMethods.indexOf(req.method) == -1) {
        res.send("Error: HTTP method not supported!");
        return;
    }
    next();
});


router.route('/post')
    .post(authController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            var o = getJSONObject(req);
            res.json(o);
        }
    );

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

// taking care of the post method for signup
router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.'}); // returning a response if no user or password
    } else {
        var newUser = {
            username: req.body.username, // setting the username and password from parser
            password: req.body.password
        };
        // save the user
        db.save(newUser); //no duplicate checking
        res.json({success: true, msg: 'Successful created new user.'}); // http responds with success message
    }
});

// taking care of the post method for signin
router.post('/signin', function(req, res) {

        var user = db.findOne(req.body.username);
         // if no user or wrong password, post a 401
        if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        }
        else {
            // check if password matches
            if (req.body.password == user.password)  {
                var userToken = { id : user.id, username: user.username }; // jwt token creation
                var token = jwt.sign(userToken, process.env.SECRET_KEY); // sign with secret key
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        };
});


router.route('/movies')
    .delete(authController.isAuthenticated, function(req, res){
        console.log(req.body);
        res.status(200);
        if(req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObject(req);
        o.status = 200;
        o.msg = "Movie Deleted";
        o.query = req.query;
        res.json(o);
    }
    )
    .put(authJwtController.isAuthenticated, function(req, res){
        console.log(req.body);
        res.status(200);
        if(req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObject(req);
        o.status = 200;
        o.msg = "Movie Updated";
        o.query = req.query;
        res.json(o);
    }
    )
    .get(function(req, res){
        res = res.status(200);
        if(req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObject(req);
        o.status = 200;
        o.msg = "GET movies";
        o.query = req.query;
        res.json(o);
    }
    )
    .post(function(req, res){
        res.status(200);
        if(req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObject(req);
        o.status = 200;
        o.msg = "Movie Saved";
        o.query = req.query;
        res.json(o);
    }
    );




app.use('/', router);
app.listen(process.env.PORT || 8080);

module.exports = app; // for testing
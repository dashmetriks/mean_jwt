// server.js

// set up ========================
var express = require('express');
var app = express(); // create our app w/ express
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');
var user = require('./routes/user');
var events = require('./routes/events');
var invites = require('./routes/invites');
var invitepage = require('./routes/invitepage');


var cors = require('cors')
var mongoose = require('mongoose'); // mongoose for mongodb
var autoIncrement = require('mongoose-auto-increment');
var async = require("async");

var morgan = require('morgan'); // log requests to the console (express4)
var bodyParser = require('body-parser'); // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');
var Invite = require('./app/models/invites');
var Event = require('./app/models/events');
var Player = require('./app/models/players');
var Comments = require('./app/models/comments');
var crypto = require('crypto');
var client = require('twilio')(config.twilio_sid, config.twilio_token);


var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.username,
        pass: config.password
    }
});

function randomValueHex(len) {
    return crypto.randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len); // return required number of characters
}


var apiRoutes = express.Router();

// configuration =================
app.set('superSecret', config.secret);

io.on('connection', function(client) {

    client.on('join', function(data) {
        console.log(data);
        client.emit('messages', 'Hello from server');
    });

});


mongoose.connect('mongodb://localhost:27017/test'); // connect to mongoDB database on modulus.io

app.use(express.static('../public')); // set the static files location /public/img will be /img for users
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // parse application/vnd.api+json as json
app.use(methodOverride());
app.use(cors())
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectID;


apiRoutes.use(function(req, res, next) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token !== "null") {
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});


app.post('/register', user.register);
app.post('/authenticate', user.authenticate);
apiRoutes.get('/userget', user.userget);
apiRoutes.post('/passwordsave', user.passwordsave);
apiRoutes.post('/usersave', user.usersave);

apiRoutes.post('/new_event', events.new_event);
apiRoutes.delete('/events/:event_id', events.delete_event);
apiRoutes.post('/eventsave/:event_id', events.eventsave);
apiRoutes.get('/my_event_list2',  events.my_event_list2);

app.post('/adduserevent2/:event_id/:ustatus/:invite_code', invitepage.adduserevent2);

apiRoutes.post('/addcomment/:event_id/',  invitepage.addcomment);

apiRoutes.get('/geteventdata/:event_id', invitepage.geteventdata); 
app.get('/geteventinviteanon/:invite_code', invitepage.geteventinviteanon); 

app.get('/invites/:invite_code', invitepage.getinvite);
apiRoutes.get('/geteventinvite/:invite_code', invitepage.geteventinvite);
apiRoutes.get('/invited/:event_id', invites.invitedlist);

apiRoutes.post('/addinvite/:event_id/', invites.addinvite); 


app.use('/api', apiRoutes);
app.use(function(req, res) {
    res.sendfile(path.resolve('../public/index.html')); // load the single view file (angular will handle the page changes on the front-end)
});
// listen (start app with node server.js) ======================================
//app.listen(config.port_endpoint);
server.listen(config.port_endpoint);
console.log("App listening on port " + config.port_endpoint);

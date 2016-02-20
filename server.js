// server.js

// set up ========================
var express = require('express');
var app = express(); // create our app w/ express
var mongoose = require('mongoose'); // mongoose for mongodb
var autoIncrement = require('mongoose-auto-increment');

var morgan = require('morgan'); // log requests to the console (express4)
var bodyParser = require('body-parser'); // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');
var crypto = require('crypto');

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'slatterytom@gmail.com', // Your email id
        pass: 'butt3rCup' // Your password
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

mongoose.connect('mongodb://localhost:27017/test'); // connect to mongoDB database on modulus.io

app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // parse application/vnd.api+json as json
app.use(methodOverride());

var Schema = mongoose.Schema,
        ObjectId = Schema.ObjectID;

var Person = new Schema({
    username: {
        type: String,
        required: true,
        trim: true
    }
});
var Person = mongoose.model('Person', Person);


var Invite = new Schema({
    event_id: String,
    inviter: String,
    invited: String,
    invited_email: String,
    invited_username: String,
    invite_code: String,
    invite_status: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

var Invite = mongoose.model('Invite', Invite);


var Player = new Schema({
    event_id: String,
    invite_id: String,
    username: String,
    in_or_out: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

var Player = mongoose.model('Player', Player);

var Comments = new Schema({
    event_id: String,
    username: String,
    text: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

var Comments = mongoose.model('Comments', Comments);

var TodoSchema = new Schema({
    text: String,
    persons: [Person.username],
});

autoIncrement.initialize(mongoose.connection);
TodoSchema.plugin(autoIncrement.plugin, 'Todo');
var Todo = mongoose.model('Todo', TodoSchema);

var EventSchema = new Schema({
    event_title: String,
    event_creator: String,
    event_start: String,
    event_end: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

autoIncrement.initialize(mongoose.connection);
EventSchema.plugin(autoIncrement.plugin, 'Event');
var Event = mongoose.model('Event', EventSchema);

apiRoutes.use(function (req, res, next) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token !== "null") {
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
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

        console.log("nooooooo tookeennnnn");
        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});

apiRoutes.get('/usersget', function (req, res) {
    User.find({}, function (err, users) {
        res.json(users);
    });
});

app.get('/setup', function (req, res) {

    // create a sample user
    var nick = new User({
        name: 'woot8',
        password: '77jump'
    });

    // save the sample user
    nick.save(function (err) {
        if (err)
            throw err;

        console.log('User saved successfully');
        res.json({
            success: true
        });
    });
});

app.post('/register', function (req, res) {
    console.log("registers now");
    // find the user
    User.findOne({
        name: req.body.name
    }, function (err, user) {

        if (err)
            throw err;

        if (!user) {
            var newuser = new User({
                name: req.body.name,
                password: req.body.password
            });

            // save the sample user
            newuser.save(function (err) {
                if (err)
                    throw err;

                console.log('User saved successfully');
                res.json({
                    success: true
                });
            });


        } else if (user) {
            res.json({
                success: false,
                message: 'User already exists.'
            });

            console.log('User already exists');
        }

    });
});

app.post('/authenticate', function (req, res) {

    // find the user
    User.findOne({
        name: req.body.name
    }, function (err, user) {

        if (err)
            throw err;

        if (!user) {
            res.json({
                success: false,
                message: 'Authentication failed. User not found.'
            });
        } else if (user) {

            // check if password matches
            if (user.password != req.body.password) {
                res.json({
                    success: false,
                    message: 'Authentication failed. Wrong password.'
                });
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresInMinutes: 1440 // expires in 24 hours
                });

                console.log(user._id);

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }

    });
});

app.get('/adduser/:username', function (req, res) {
    var person_data = {
        username: req.params.username
    };

    var person = new Person(person_data);

    person.save(function (error, data) {
        if (error) {
            res.json(error);
        } else {
            res.json(data);
        }
    });
});

apiRoutes.get('/adduserevent/:event_id/:ustatus', function (req, res) {
    Player.findOne({
        event_id: req.params.event_id,
        username: req.decoded.name
    }, function (error, players) {
        /*
         if (error) {
         res.json(error);
         } else if (players == null) {
         */
        if (error)
            res.json(error);
        if (players == null) {
            Player.create({
                event_id: req.params.event_id,
                username: req.decoded.name,
                in_or_out: req.params.ustatus
            },
            function (err, result) {
                if (err)
                    throw err;
            });
        } else {
            update_invite_status(players["invite_id"], req.params.ustatus );
            Player.update({
                event_id: req.params.event_id,
                username: req.decoded.name
            }, {
                $set: {
                    in_or_out: req.params.ustatus
                }
            },
            function (err, result) {
                if (err)
                    throw err;
            });
        }
        Player.find({
            event_id: req.params.event_id,
            in_or_out: 'Yes'
        },
        function (err, players_yes) {
            if (err)
                res.send(err)
            Player.find({
                event_id: req.params.event_id,
                in_or_out: 'No'
            },
            function (err, players_no) {
                if (err)
                    res.send(err)
                res.json({
                    'players_yes': players_yes,
                    'players_no': players_no
                });
            });
        });
    });
});


apiRoutes.post('/addinvite/:event_id/', function (req, res) {

    Invite.create({
        event_id: req.params.event_id,
        inviter: req.decoded.name,
        invited: req.body.text,
        invited_email: req.body.email,
        invite_code: randomValueHex(8),
        invite_status: "Sent"
    },
    function (err, new_invite) {
        transporter.sendMail({
            from: 'slatterytom@gmail.com',
            //to: req.body.email, 
            to: 'slatterytom@gmail.com',
            subject: 'hello',
            html: 'hello world html! You are invited to http://localhost:8080/invite/' + new_invite.invite_code,
            text: 'hello world asd!'
        });
        transporter.close();

        if (err)
            throw err;
        Invite.find({
            event_id: req.params.event_id
        },
        function (err, invites) {
            if (err)
                res.send(err)
            // console.log('wooooot');
            // console.log(invites);
            res.json(invites); // return all todos in JSON format
        });
    });
});

apiRoutes.post('/addcomment/:event_id/', function (req, res) {
    Player.findOne({
        event_id: req.params.event_id
    }, function (error, todos) {
        if (error) {
            res.json(error);
        } else if (todos == null) {
        } else {

            Comments.create({
                event_id: req.params.event_id,
                username: req.decoded.name,
                text: req.body.text
            },
            function (err, result) {
                if (err)
                    throw err;
                Comments.find({
                    event_id: req.params.event_id
                },
                null, {
                    sort: {
                        "created_at": -1
                    }
                },
                function (err, comments) {
                    if (err)
                        res.send(err)
                    res.json({
                        'comments': comments,
                    });
                });
            });
        }
        ;
    });
});

apiRoutes.get('/getcomments/:event_id', function (req, res) {
    console.log('heeeeeeeeeee');
    Comments.find({
        event_id: req.params.event_id
    },
    null, {
        sort: {
            "created_at": -1
        }
    },
    function (err, comments) {
        if (err)
            res.send(err)
        Player.find({
            event_id: req.params.event_id,
            in_or_out: 'Yes'
        },
        function (err, players_yes) {
            if (err)
                res.send(err)
            Player.find({
                event_id: req.params.event_id,
                in_or_out: 'No'
            },
            function (err, players_no) {
                if (err) res.send(err)
                Event.find({
                    _id: req.params.event_id
                },
                function (err, events) {
                    if (err) res.send(err)
                    res.json({
                        'logged_in_userid': req.decoded._id ,
                        'event': events,
                        'players_yes': players_yes,
                        'players_no': players_no,
                        'comments': comments,
                    });
                });
            });
        });
    });
});

app.get('/invites/:invite_code', function (req, res) {
    console.log(req.params.invite_code);


    // use mongoose to get all todos in the database

    Invite.findOne({
    invite_code: req.params.invite_code
},
        function (err, invites) {
            if (err) res.send(err)
          if (invites["invite_status"] == "Opened" || invites["invite_status"] == "Sent") {
            update_invite_status(invites["_id"], "Opened" );
          }
            console.log(invites);
            res.json(invites); 
        });
});

apiRoutes.get('/invited/:event_id', function (req, res) {
    console.log('invite list ------');
    Invite.find({
        event_id: req.params.event_id
    },
    null, {
        sort: {
            "created_at": -1
        }
    },
    function (err, invites) {
        if (err) res.send(err)
                Event.find({
                    _id: req.params.event_id
                },
                function (err, events) {
                    if (err) res.send(err)
        console.log(invites);
      //  res.json(invites); 
                    res.json({
                        'logged_in_userid': req.decoded._id ,
                        'event': events,
                        'invites': invites
                    });
    });
    });
});

apiRoutes.get('/events/:event_id', function (req, res) {

    Event.find({
        _id: req.params.event_id
    },
    function (err, events) {
        if (err)
            res.send(err)
        res.json(events); 
    });
});

function update_invite_status(invite_id, ustatus) {
    Invite.update({
        _id: invite_id
    }, {
        $set: {
            invite_status: ustatus
        }
    },
    function (err, result) {
        if (err) throw err;
        console.log(result);
    });
}
function add_invite_username(invite_id, username) {
    Invite.update({
        _id: invite_id
    }, {
        $set: {
            invited_username: username
        }
    },
    function (err, result) {
        if (err) throw err;
    });
}

apiRoutes.get('/change_invite_status/:invite_code', function (req, res) {
    Invite.findOne({
        invite_code: req.params.invite_code
    }, function (error, invites) {
        if (error) res.json(error);
        update_invite_status(invites["_id"], "Accepted" );
        add_invite_username(invites["_id"], req.decoded.name  );
        console.log("find one invite");
        console.log(invites["_id"]);
            Player.create({
                event_id: invites["event_id"], 
                invite_id: invites["_id"], 
                username: req.decoded.name,
                in_or_out: "Accepted"
            },
            function (err, result) {
                if (err) throw err;
                res.json(result);
            });
    });
});

apiRoutes.get('/event_list', function (req, res) {
    Event.find(function (err, events) {
        if (err)
            res.send(err)
        res.json(events);
    });
});

// create todo and send back all todos after creation
apiRoutes.post('/events', function (req, res) {

    console.log("po po");
    // create a todo, information comes from AJAX request from Angular
    Event.create({
        event_title: req.body.text,
        event_creator: req.decoded._id 

    }, function (err, todo) {
        if (err)
            res.send(err);

        // get and return all the todos after you create another
        Event.find(function (err, events) {
            if (err)
                res.send(err)
            console.log("now now");
            console.log(events);

            res.json(events);
        });
    });

});

// delete a todo
app.delete('/api/todos/:todo_id', function (req, res) {
    Todo.remove({
        _id: req.params.todo_id
    }, function (err, todo) {
        if (err)
            res.send(err);

        // get and return all the todos after you create another
        Todo.find(function (err, todos) {
            if (err)
                res.send(err)
            res.json(todos);
        });
    });
});


app.use('/api', apiRoutes);
app.use(function (req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");

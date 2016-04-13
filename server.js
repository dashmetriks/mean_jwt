// server.js

// set up ========================
var express = require('express');
var app = express(); // create our app w/ express
var mongoose = require('mongoose'); // mongoose for mongodb
var autoIncrement = require('mongoose-auto-increment');
var async = require("async");

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
    invited_phone: String,
    invited_type: String,
    invited_username: String,
    invite_code: String,
    date_opened: Date,
    date_accepted: Date,
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
    invite_code: String,
    username: String,
    user_id: String,
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
    user_id: String,
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
    event_image: {
        type: String,
        default: "0"
    },
    event_creator_username: String,
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

app.post('/adduserevent2/:event_id/:ustatus/:invite_code', function (req, res) {
console.log(req.body)
    Player.findOne({
        event_id: req.params.event_id,
        invite_code: req.params.invite_code
    }, function (error, players) {
        if (error) res.json(error);
        if (players == null) {
    Invite.findOne({
        invite_code: req.params.invite_code
    },
    function (err, invites) {
        if (err) res.send(err)

            Player.create({
                event_id: req.params.event_id,
                invite_code: req.params.invite_code,
                //username: invites.invited,
                username: req.body.username,
                in_or_out: req.params.ustatus
            },
            function (err, result) {
                if (err)
                    throw err;
                //       res.json(result);
            });
                    Comments.create({
                        event_id: req.params.event_id,
                        username: req.body.username,
                //        user_id: req.decoded._id,
                        text: req.body.comment
                    },
                    function (err, result) {
                        if (err)
                            throw err;
    });
    });
        } else {
            update_invite_status(players["invite_id"], req.params.ustatus);
            Player.update({
                event_id: req.params.event_id,
           //     username: req.decoded.name
            }, {
                $set: {
                    in_or_out: req.params.ustatus
                }
            },
            function (err, result) {
                if (err)
                    throw err;
                //        res.json(result);
            });
        }
      //  get_event_data(req.params.event_id, req.decoded._id, function (data) {
 get_event_data(req.params.event_id, "10000", function (data) {
            res.json(data);
        })
    });
});

apiRoutes.get('/adduserevent/:event_id/:ustatus', function (req, res) {
    Player.findOne({
        event_id: req.params.event_id,
        username: req.decoded.name
    }, function (error, players) {
        if (error)
            res.json(error);
        if (players == null) {
            Player.create({
                event_id: req.params.event_id,
                username: req.decoded.name,
                user_id: req.decoded._id,
                in_or_out: req.params.ustatus
            },
            function (err, result) {
                if (err)
                    throw err;
                //       res.json(result);
            });
        } else {
            update_invite_status(players["invite_id"], req.params.ustatus);
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
                //        res.json(result);
            });
        }
        get_event_data(req.params.event_id, req.decoded._id, function (data) {
            res.json(data);
        })
    });
});


apiRoutes.post('/addinvite/:event_id/', function (req, res) {

    Invite.create({
        event_id: req.params.event_id,
        inviter: req.decoded.name,
        invited: req.body.text,
        invited_email: req.body.email,
        invited_phone: req.body.phone,
        invited_type: req.body.type,
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
        null, {
            sort: {
                "created_at": -1
            }
        },
        function (err, invites) {
            if (err)
                res.send(err)
            // console.log('wooooot');
            // console.log(invites);
            res.json({'invites': invites}); // return all todos in JSON format
        });
    });
});
apiRoutes.post('/addcomment/:event_id/', function (req, res) {
    async.series([
        function (callback) {
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
                        user_id: req.decoded._id,
                        text: req.body.text
                    },
                    function (err, result) {
                        if (err)
                            throw err;
                        console.log("wooot1")
                        callback(null, 'one');
                    });
                }
                ;
            });
        },
        function (callback) {
            get_event_data(req.params.event_id, req.decoded._id, function (data) {
                res.json(data);
            })
            callback();
        }
    ], function (error) {
        if (error) {
            //handle readFile error or processFile error here
        }
    });
});
function get_event_data(event_id, user_id, callback) {

    var pushY = {};
    Comments.find({event_id: event_id}, null, {sort: {"created_at": -1}},
    function (err, comments) {
        if (err)
            res.send(err)
        Player.find({event_id: event_id, in_or_out: 'Yes'},
        function (err, players_yes) {
            if (err)
                res.send(err)
        Player.find({event_id: event_id, invite_code: user_id},
        function (err, is_member) {
            if (err)
                res.send(err)
            Player.find({event_id: event_id, in_or_out: 'No'},
            function (err, players_no) {
                if (err)
                    res.send(err)
            Player.find({event_id: event_id, in_or_out: 'Maybe'},
            function (err, players_maybe) {
                if (err)
                    res.send(err)
                Event.find({_id: event_id},
                function (err, events) {
                    if (err)
                        res.send(err)
                    Player.find({event_id: event_id},
                    function (err, players_list) {
                        if (err)
                            res.send(err)
                        async.each(players_list, function (events, callback) {
                            User.findOne({_id: events.user_id},
                            function (err, user_list) {
                                if (err)
                                    res.send(err)
                                //pushY[events.user_id] = (user_list.fname + user_list.password.substring(0, 1)).toString()
                                callback();
                            });
                        }, function (err) {
                        
                        console.log("woooooooeeee")
                        console.log(players_yes)
                            var data = ({
                              //  'user_list': [pushY],

                                'logged_in_userid': user_id,
                                'event': events,
                                'players_list': players_list,
                                'is_member': is_member,
                                'players_yes': players_yes,
                                'players_no': players_no,
                                'players_maybe': players_maybe,
                                'comments': comments,
                            });
                            return callback(data);
                        });
                    });
                });
            });
            });
            });
        });
    });
}

apiRoutes.get('/geteventdata/:event_id', function (req, res) {
 get_event_data(req.params.event_id, req.decoded._id, function (data) {
            res.json(data);
        })
});

app.get('/geteventinvite/:invite_code', function (req, res) {
    Invite.findOne({
        invite_code: req.params.invite_code
    },
    function (err, invites) {
        if (err)
            res.send(err)
 get_event_data(invites.event_id, req.params.invite_code, function (data) {
            res.json(data);
        })
    });
});

apiRoutes.get('/geteventdata1/:event_id', function (req, res) {
    var pushY = {};
    Comments.find({event_id: req.params.event_id}, null, {sort: {"created_at": -1}},
    function (err, comments) {
        if (err)
            res.send(err)
        Player.find({event_id: req.params.event_id, in_or_out: 'Yes'},
        function (err, players_yes) {
            if (err)
                res.send(err)
            Player.find({event_id: req.params.event_id, in_or_out: 'No'},
            function (err, players_no) {
                if (err)
                    res.send(err)
                Event.find({_id: req.params.event_id},
                function (err, events) {
                    if (err)
                        res.send(err)
                    Player.find({event_id: req.params.event_id},
                    function (err, players_list) {
                        if (err)
                            res.send(err)

                        async.each(players_list, function (events, callback) {
                            User.findOne({_id: events.user_id},
                            function (err, user_list) {
                                if (err)
                                    res.send(err)
                                console.log(user_list)
                                pushY[events.user_id] = (user_list.fname + user_list.password.substring(0, 1)).toString()
                                callback();
                            });
                        }, function (err) {
                            //     res.json({ 'my_events': player_data,
                            //               'event_yes': [pushY] ,
                            //              'event_no': [pushN] 
                            //           });
                            //  });


                            res.json({
                                'user_list': [pushY],
                                'logged_in_userid': req.decoded._id,
                                'logged_in_username': req.decoded.name,
                                'event': events,
                                'players_list': players_list,
                                'players_yes': players_yes,
                                'players_no': players_no,
                                'comments': comments,
                            });
                        });
                    });
                });
            });
        });
    });
});
apiRoutes.post('/eventsave/:event_id', function (req, res) {
    Event.update({
        _id: req.params.event_id
    }, {
        $set: {
            event_title: req.body.text,
            event_start: req.body.event_start,
            event_image: req.body.image
        }
    },
    function (err, result) {
        if (err)
            throw err;
        console.log(req.body.text);
        console.log(result);
        res.json(result);
    });
});

app.get('/invites/:invite_code', function (req, res) {
    Invite.findOne({
        invite_code: req.params.invite_code
    },
    function (err, invites) {
        if (err)
            res.send(err)
        if (invites["invite_status"] == "Opened" || invites["invite_status"] == "Sent") {
            update_invite_status(invites["_id"], "Opened");
        }
        console.log(invites);
        res.json(invites);
    });
});

apiRoutes.get('/invitedetail/:invite_id', function (req, res) {
    Invite.findOne({
        _id: req.params.invite_id
    },
    function (err, invites) {
        if (err)
            res.send(err)
    //    }
        console.log(invites);
        res.json({'invite_detail': [invites]});
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
        if (err)
            res.send(err)
        Event.find({
            _id: req.params.event_id
        },
        function (err, events) {
            if (err)
                res.send(err)
            console.log(invites);
            //  res.json(invites); 
            res.json({
                'logged_in_userid': req.decoded._id,
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
            invite_status: ustatus,
            date_opened: new Date() 
        }
    },
    function (err, result) {
        if (err)
            throw err;
        console.log(result);
    });
}

function update_invite_status_accepted(invite_id, ustatus) {
    Invite.update({
        _id: invite_id
    }, {
        $set: {
            invite_status: ustatus,
            date_accepted: new Date() 
        }
    },
    function (err, result) {
        if (err)
            throw err;
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
        if (err)
            throw err;
    });
}

apiRoutes.get('/change_invite_status/:invite_code', function (req, res) {
    Invite.findOne({
        invite_code: req.params.invite_code
    }, function (error, invites) {
        if (error)
            res.json(error);
        update_invite_status_accepted(invites["_id"], "Accepted");
        add_invite_username(invites["_id"], req.decoded.name);
        console.log("find one invite");
        console.log(invites["_id"]);
        Player.create({
            event_id: invites["event_id"],
            invite_id: invites["_id"],
            username: req.decoded.name,
            user_id: req.decoded._id,
            in_or_out: "Accepted"
        },
        function (err, result) {
            if (err)
                throw err;
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
apiRoutes.get('/userget', function (req, res) {
    User.find({_id: req.decoded._id},
    function (err, users) {
        if (err)
            res.send(err)
        res.json({
            'user': users,
        });
        console.log(users);
    });
});
apiRoutes.post('/usersave', function (req, res) {
    User.update({
        _id: req.decoded._id
    }, {
        $set: {
            fname: req.body.fname,
            lname: req.body.lname
        }
    },
    function (err, result) {
        if (err)
            throw err;
        console.log(req.body.text);
        console.log(result);
        res.json(result);
    });
});
apiRoutes.get('/my_event_list2', function (req, res) {
    var player_data = []
    var player_data2 = []
    var player_no_count = []
    var pushY = {};
    var pushN = {};
    var invites_cnt = {};
    Player.find({user_id: req.decoded._id},
    null, {
        sort: {
            "event_id": -1
        }
    },
    function (err, records) {
        /*
         Player.count({
         event_id: events.event_id,
         in_or_out: 'No'
         },
         function (err, players_no) {
         if (err) res.send(err)
         player_no.push(players_no);
         });
         */
        async.each(records, function (events, callback) {
            Event.findOne({_id: events.event_id},
            function (err, events) {
                if (err)
                    res.send(err)
                player_data.push(events);
            });
            Player.count({event_id: events.event_id, in_or_out: 'No'},
            function (err, players_no) {
                if (err)
                    res.send(err)
                Player.count({event_id: events.event_id, in_or_out: 'Yes'},
                function (err, players_yes) {
                    if (err)
                        res.send(err)
                Invite.count({event_id: events.event_id},
                function (err, invite_count) {
                    if (err)
                        res.send(err)
                    pushN[events.event_id] = players_no
                    pushY[events.event_id] = players_yes
                    invites_cnt[events.event_id] = invite_count
                    callback();
                });
            });
            });
        }, function (err) {
            console.log(player_data);
            res.json({'my_events': player_data,
                'event_yes': [pushY],
                'event_no': [pushN],
                'invites': [invites_cnt]
            });
        });
    });
});
apiRoutes.get('/my_event_list', function (req, res) {
    Event.find({
        event_creator: req.decoded._id
    },
    null, {
        sort: {
            "created_at": -1
        }
    },
    function (err, events) {
        if (err)
            res.send(err)
        res.json({
            'my_events': events,
        });
    });
});
// create todo and send back all todos after creation
apiRoutes.post('/new_event', function (req, res) {

    console.log("po po");
    // create a todo, information comes from AJAX request from Angular
    Event.create({
        event_title: req.body.text,
        event_start: req.body.event_start,
        event_creator: req.decoded._id,
        event_creator_username: req.decoded.name

    }, function (err, event_created) {
        if (err)
            res.send(err);
            console.log("now now");
            console.log(event_created);
            Player.create({
                event_id: event_created._id ,
                username: req.decoded.name,
                user_id: req.decoded._id,
                in_or_out: 'Yes' 
            },
            function (err, result) {
                if (err)
                    throw err;
            });
        // get and return all the todos after you create another
        Event.find(function (err, events) {
            if (err)
                res.send(err)
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

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
    event_creator: String,
    inviter: String,
    invited: String,
    invited_email: String,
    invited_phone: String,
    invited_type: String,
    invited_username: String,
    accepted_displayname: String,
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
    displayname: String,
    email_notice: Boolean,
    phone_notice: Boolean,
    notice_rsvp: String,
    notice_comments: String,
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
    displayname: String,
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
    event_creator_displayname: String,
    event_start: String,
    event_location: String,
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
        username: 'slatterytom@gmail.com',
        password: '77jump'
    });

    // save the sample user
    nick.save(function (err) {
        if (err)
            throw err;

        res.json({
            success: true
        });
    });
});

app.post('/register', function (req, res) {
    // find the user
    User.findOne({
        username: req.body.name
    }, function (err, user) {

        if (err)
            throw err;

        if (!user) {
            var newuser = new User({
                username: req.body.name,
                password: req.body.password
            });

            // save the sample user
            newuser.save(function (err) {
                if (err)
                    throw err;

                res.json({
                    success: true
                });
            });


        } else if (user) {
            res.json({
                success: false,
                message: 'User already exists.'
            });

        }

    });
});

app.post('/authenticate', function (req, res) {

    // find the user
    User.findOne({
        username: req.body.name
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
    var new_user_id
    console.log(req.body)
    Player.findOne({
        event_id: req.params.event_id,
        invite_code: req.params.invite_code
    }, function (error, players) {
        if (error)
            res.json(error);
        if (players == null) {
            Invite.findOne({
                invite_code: req.params.invite_code
            },
            function (err, invites) {
                if (err)
                    res.send(err)

                update_invite_status_displayname(invites["_id"], req.params.ustatus, req.body.displayname,req.body.username);
                //  if (req.body.create_account == 'YES') {
                User.findOne({
                    username: req.body.username
                }, function (err, user) {
                    if (err)
                        throw err;
                    if (!user) {
                        User.create({
                            username: req.body.username,
                            displayname: req.body.displayname,
                            password: '77jump'
                        },
                        function (err, usernew) {
                            if (err)
                                throw err;
                            new_user_id = usernew._id

                            transporter.sendMail({
                                from: 'slatterytom@gmail.com',
                                to: 'slatterytom@gmail.com',
                                subject: req.body.username + '- click here to complete reg',
                                html: 'Login here  <a href="http://localhost:8080/login/"> login </a> ' + req.body.username,
                            });
                            transporter.close();


                            Player.create({
                                event_id: req.params.event_id,
                                invite_code: req.params.invite_code,
                                notice_rsvp: req.body.rsvp,
                                user_id: usernew._id,
                                notice_comments: req.body.comment_alert,
                                username: req.body.username,
                                displayname: req.body.displayname,
                                in_or_out: req.params.ustatus
                            },
                            function (err, result) {
                                if (err)
                                    throw err;
                            });
                        });
                    } else { // !user
                        Player.create({
                            event_id: req.params.event_id,
                            invite_code: req.params.invite_code,
                            notice_rsvp: req.body.rsvp,
                            user_id: user._id,
                            notice_comments: req.body.comment_alert,
                            username: req.body.username,
                            displayname: req.body.displayname,
                            in_or_out: req.params.ustatus
                        },
                        function (err, result) {
                            if (err)
                                throw err;
                        });
                    }
                });

                if (req.body.comment != "undefined") {
                    Comments.create({
                        event_id: req.params.event_id,
                        displayname: req.body.displayname,
                        text: req.body.comment
                    },
                    function (err, result) {
                        if (err)
                            throw err;
                    });
                    get_event_data(req.params.event_id, "10000", function (data) {
                        send_email_alert_comment(req.params.event_id, req.params.invite_code, req.params.ustatus, req.body.comment, req.body.username, data)
                        res.json(data);
                    })
                } else {
                    get_event_data(req.params.event_id, "10000", function (data) {
                        send_email_alert_rsvp(req.params.event_id, req.params.invite_code, req.params.ustatus, "", req.body.username, data)
                        res.json(data);
                    })

                }
            });
        } else { // player == null
            if (req.params.ustatus != 'none') {
                update_invite_status(players["invite_id"], req.params.ustatus);
                Player.update({
                    event_id: req.params.event_id,
                    invite_code: req.params.invite_code
                }, {
                    $set: {
                        notice_rsvp: req.body.rsvp,
                        notice_comments: req.body.comment_alert,
                        username: req.body.username,
                        displayname: req.body.displayname,
                        in_or_out: req.params.ustatus
                    }
                },
                function (err, result) {
                    if (err)
                        throw err;
                });
            }  // req.params.ustatus != 'none'
            if (req.body.comment != "undefined") {
                Comments.create({
                    event_id: req.params.event_id,
                    displayname: req.body.displayname,
                    text: req.body.comment
                },
                function (err, result) {
                    if (err)
                        throw err;
                });
                get_event_data(req.params.event_id, "10000", function (data) {
                    send_email_alert_comment(req.params.event_id, req.params.invite_code, req.params.ustatus, req.body.comment, req.body.username, data)
                    res.json(data);
                })
            } else { // req.body.comment != "undefined"
                get_event_data(req.params.event_id, "10000", function (data) {
                    send_email_alert_rsvp(req.params.event_id, req.params.invite_code, req.params.ustatus, "", req.body.username, data)
                    res.json(data);
                })
            }
        } // else   players = null
    });
});


function send_email_alert_rsvp(event_id, invite_code, ustatus, comment, username, event_data) {
    console.log("dfasfdsa 55555555")
    Player.find({event_id: event_id, notice_rsvp: 'YES'},
    function (err, players_list) {
        if (err)
            res.send(err)
        async.each(players_list, function (players, callback) {
            if (invite_code == players.invite_code) {
                var email_subject = 'you posted an rsvp ' + username + ' for event ' + event_data.event[0]["event_title"]
                var email_html = 'you posted as ' + username + 'a rsvp ' + ustatus + '<br> <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length
            } else {
                var email_subject = 'New rsvp posted by ' + username + ' for event ' + event_data.event[0]["event_title"]
                var email_html = username + ' rsvp ' + ustatus + '<br> <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length
            }
            transporter.sendMail({
                from: 'slatterytom@gmail.com',
                to: players.email,
                subject: email_subject,
                html: email_html,
                text: 'hello world asd!'
            });
            transporter.close();
        });
    });
}

function send_email_alert_comment(event_id, invite_code, ustatus, comment, username, event_data) {

    if (ustatus == 'none') {
        Player.find({event_id: event_id, notice_comments: 'YES'},
        function (err, players_list) {
            if (err)
                res.send(err)
            async.each(players_list, function (players, callback) {
                if (invite_code == players.invite_code) {
                    var email_subject = 'you posted comment posted as for event ' + event_data.event[0]["event_title"]
                    var email_html = 'you posted a comment as ' + username + '<br>"' + comment + '"<br> for event <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                } else {
                    var email_subject = 'New rsvp posted by ' + username + ' for event ' + event_data.event[0]["event_title"]
                    var email_html = username + ' posted a new comment ' + comment + '<br> <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                }
                transporter.sendMail({
                    from: 'slatterytom@gmail.com',
                    to: players.email,
                    subject: email_subject,
                    html: email_html,
                    text: 'hello world asd!'
                });
                transporter.close();
            });
        });


    } else {

        Player.find({$and: [{event_id: event_id}, {notice_comments: 'NO'}, {notice_rsvp: 'YES'}]},
        function (err, players_list) {
            if (err)
                res.send(err)
            async.each(players_list, function (players, callback) {
                if (invite_code == players.invite_code) {
                    var email_subject = 'you rsvpd ' + ustatus + ' for event ' + event_data.event[0]["event_title"]
                    var email_html = 'you rsvpd ' + ustatus + ' as ' + username + '<br>for event <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                } else {
                    var email_subject = username + " rsvp'd " + ustatus + ' for event ' + event_data.event[0]["event_title"]
                    var email_html = username + " rsvp'd " + ustatus + '<br>for event <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                }
                transporter.sendMail({
                    from: 'slatterytom@gmail.com',
                    to: players.email,
                    subject: email_subject,
                    html: email_html,
                    text: 'hello world asd!'
                });
                transporter.close();
            });
        });

        Player.find({$and: [{event_id: event_id}, {notice_comments: 'YES'}, {notice_rsvp: 'NO'}]},
        function (err, players_list) {
            if (err)
                res.send(err)
            async.each(players_list, function (players, callback) {
                if (invite_code == players.invite_code) {
                    var email_subject = 'you posted comment posted as for event ' + event_data.event[0]["event_title"]
                    var email_html = 'you posted a comment as ' + username + '<br>"' + comment + '"<br> for event <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                } else {
                    var email_subject = 'New rsvp posted by ' + username + ' for event ' + event_data.event[0]["event_title"]
                    var email_html = username + ' posted a new comment ' + comment + '<br> <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                }
                transporter.sendMail({
                    from: 'slatterytom@gmail.com',
                    to: players.email,
                    subject: email_subject,
                    html: email_html,
                    text: 'hello world asd!'
                });
                transporter.close();
            });
        });

        Player.find({$and: [{event_id: event_id}, {notice_comments: 'YES'}, {notice_rsvp: 'YES'}]},
        function (err, players_list) {
            if (err)
                res.send(err)
            async.each(players_list, function (players, callback) {
                if (invite_code == players.invite_code) {
                    var email_subject = 'You posted a comment and rsvpd for event ' + event_data.event[0]["event_title"]
                    var email_html = 'You rsvpd <b>' + ustatus + ' </b> as username <b>' + username + '</b><br><br><b>Comment -</b> "' + comment + '"<br><br>For event <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br><br>' + 'Number of Yeses-' + event_data.players_yes.length + '<br>' + 'Number of Nos-' + event_data.players_no.length

                } else {
                    var email_subject = 'New comment and rsvp posted by ' + username + ' for event ' + event_data.event[0]["event_title"]
                    var email_html = username + ' rsvpd ' + ustatus + ' and posted a new comment-"' + comment + '"<br> for event <a href="http://localhost:8080/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                }
                transporter.sendMail({
                    from: 'slatterytom@gmail.com',
                    to: players.email,
                    subject: email_subject,
                    html: email_html,
                    text: 'hello world asd!'
                });
                transporter.close();
            });
        });
    }
}

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

    Event.find({
        _id: req.params.event_id
    },
    function (err, events) {
        if (err)
            throw err;
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
            console.log(events[0]["event_title"])
            transporter.sendMail({
                from: 'slatterytom@gmail.com',
                to: 'slatterytom@gmail.com',
                subject: 'You are invited to the event ' + events[0]["event_title"] + ' at ' + events[0]["event_start"],
                html: 'You are invited to the event <a href="http://localhost:8080/invite/' + new_invite.invite_code + '">' + events[0]["event_title"] + '</a>' + ' at ' + events[0]["event_start"],
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
                res.json({'invites': invites}); // return all todos in JSON format
            });
        }); //d8d88d
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
                        displayname: req.decoded.displayname,
                        user_id: req.decoded._id,
                        text: req.body.text
                    },
                    function (err, result) {
                        if (err)
                            throw err;
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
        if (invites["invite_status"] == "Opened" || invites["invite_status"] == "Sent") {
            update_invite_status(invites["_id"], "Opened");
        }
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
        res.json({'invite_detail': [invites]});
    });
});

apiRoutes.get('/invited/:event_id', function (req, res) {
    Invite.find({event_id: req.params.event_id},
    null, {
        sort: {
            "created_at": -1
        }
    },
    function (err, invites) {
        if (err)
            res.send(err)
        Event.find({_id: req.params.event_id},
        function (err, events) {
            if (err)
                res.send(err)
            Invite.findOne({event_id: req.params.event_id, event_creator: 'Yes'},
            function (err, invite_creator) {
                if (err)
                    res.send(err)
                res.json({
                    'logged_in_userid': req.decoded._id,
                    'invite_creator': invite_creator,
                    'event': events,
                    'invites': invites
                });
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
    });
}

function update_invite_status_displayname(invite_id, ustatus, displayname, username) {
    Invite.update({
        _id: invite_id
    }, {
        $set: {
            invite_status: ustatus,
            invited_email: username,
            accepted_displayname: displayname,
            date_opened: new Date()
        }
    },
    function (err, result) {
        if (err)
            throw err;
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
    });
});
apiRoutes.post('/usersave', function (req, res) {
    User.update({
        _id: req.decoded._id
    }, {
        $set: {
            username: req.body.username,
            displayname: req.body.displayname
        }
    },
    function (err, users) {
        if (err)
            throw err;
        //res.json(result);
        res.json({
            'user': users,
        });
    });
});
apiRoutes.get('/my_event_list2', function (req, res) {
    var player_data = []
    var player_data2 = []
    var player_data3 = []
    var player_no_count = []
    var pushY = {};
    var pushN = {};
    var pushList = {};
    var invites_cnt = {};
    Player.find({user_id: req.decoded._id}, null, {sort: {"created_at": -1}},
  //  null, {
   //     sort: {
    //        "event_id": -1
  //      }
   // },
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
            function (err, events2) {
                if (err)
                    res.send(err)
                player_data.push(events2);
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
                        //            Player.find({event_id: events.event_id},
                        Player.find({user_id: req.decoded._id, event_id: events.event_id},
                        function (err, players_list) {
                            if (err)
                                res.send(err)
                            // player_data3.push(players_list);
                            pushList[events.event_id] = players_list
                            pushN[events.event_id] = players_no
                            pushY[events.event_id] = players_yes
                            invites_cnt[events.event_id] = invite_count
                            callback();
                        });
                    });
                });
            });
        }, function (err) {
       console.log(player_data)
            res.json({'my_events': player_data,
                'event_yes': [pushY],
                'event_invites': [pushList],
                //  'event_invites': player_data3,
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

    console.log("fasdfadsfdsf")
    console.log(req.body)
    // create a todo, information comes from AJAX request from Angular
    Event.create({
        event_title: req.body.text,
        event_start: req.body.event_start,
        event_location: req.body.event_location,
        event_creator: req.decoded._id,
        event_creator_displayname: req.decoded.displayname

    }, function (err, event_created) {
        if (err)
            res.send(err);
        Invite.create({
            event_id: event_created._id,
            inviter: req.decoded.username,
            invited: req.decoded.displayname,
            invited_email: req.decoded.username,
            //     invited_email: req.body.email,
            //    invited_phone: req.body.phone,
            //     invited_type: req.body.type,
            invite_code: randomValueHex(8),
            event_creator: "Yes",
            invite_status: "Yes"
        },
        function (err, new_invite) {
            Player.create({
                event_id: event_created._id,
                displayname: req.decoded.displayname,
                invite_code: new_invite.invite_code,
                username: req.decoded.username,
                notice_rsvp: 'YES',
                notice_comments: 'YES',
                user_id: req.decoded._id,
                in_or_out: 'Yes'
            },
            function (err, result) {
                if (err)
                    throw err;
                transporter.sendMail({
                    from: 'slatterytom@gmail.com',
                    to: 'slatterytom@gmail.com',
                    subject: 'You created the event ' + event_created.event_title + ' at ' + event_created.event_start,
                    html: 'You are invited to the event <a href="http://localhost:8080/invite/' + new_invite.invite_code + '">' + event_created.event_title + '</a>' + ' at ' + event_created.event_start,
                    text: 'hello world asd!'
                });
                transporter.close();
                if (err)
                    throw err;
                /*
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
                 res.json({'invites': invites}); // return all todos in JSON format
                 });
                 */
            }); //d8d88d
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

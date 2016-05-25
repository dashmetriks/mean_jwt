var config = require('../config');
var express = require('express');
var async = require("async");
var User = require('../app/models/user');
var Invite = require('../app/models/invites');
var Event = require('../app/models/events');
var Player = require('../app/models/players');
var Comments = require('../app/models/comments');
var crypto = require('crypto');
var app = express(); // create our app w/ express
var server = require('http').createServer(app);
var io = require('socket.io')(server);
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

exports.getinvite = function(req, res){
//app.get('/invites/:invite_code', function(req, res) {
    Invite.findOne({
            invite_code: req.params.invite_code
        },
        function(err, invites) {
            if (err)
                res.send(err)
            if (invites) {
                if (invites["invite_status"] == "Opened" || invites["invite_status"] == "Sent") {
                    update_invite_status(invites["_id"], "Opened");
                }
                res.json(invites);
            } else {
                return res.status(403).send({
                    success: false,
                    message: 'No Invite for that code.'
                });
            }
        });
}

exports.adduserevent2 = function(req, res){

//app.post('/adduserevent2/:event_id/:ustatus/:invite_code', function(req, res) {
    var new_user_id
    console.log(req.body)
    Player.findOne({
        event_id: req.params.event_id,
        invite_code: req.params.invite_code
    }, function(error, players) {
        if (error)
            res.json(error);
        if (players == null) {
            Invite.findOne({
                    invite_code: req.params.invite_code
                },
                function(err, invites) {
                    if (err)
                        res.send(err)

                    update_invite_status_displayname(invites["_id"], req.params.ustatus, req.body.displayname, req.body.username);

                    Player.create({
                            event_id: req.params.event_id,
                            invite_code: req.params.invite_code,
                            notice_rsvp: req.body.rsvp,
                            //         user_id: usernew._id,
                            notice_comments: req.body.comment_alert,
                            username: req.body.username,
                            displayname: req.body.displayname,
                            in_or_out: req.params.ustatus
                        },
                        function(err, result) {
                            if (err)
                                throw err;
                        });
                    if (req.body.comment != "undefined") {
                        Comments.create({
                                event_id: req.params.event_id,
                                displayname: req.body.displayname,
                                text: req.body.comment
                            },
                            function(err, result) {
                                if (err)
                                    throw err;
                            });
                        get_ev(req.params.event_id, "10000", function(data) {
                            send_email_alert_comment(req.params.event_id, req.params.invite_code, req.params.ustatus, req.body.comment, req.body.displayname, data)
                            res.json(data);
                        })
                    } else {
                        get_ev(req.params.event_id, "10000", function(data) {
                            send_email_alert_rsvp(req.params.event_id, req.params.invite_code, req.params.ustatus, "", req.body.displayname, data)
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
                    function(err, result) {
                        if (err)
                            throw err;
                    });
            } // req.params.ustatus != 'none'
            if (req.body.comment != "undefined") {
                Comments.create({
                        event_id: req.params.event_id,
                        displayname: req.body.displayname,
                        text: req.body.comment
                    },
                    function(err, result) {
                        if (err)
                            throw err;
                    });
                get_event_data(req.params.event_id, "10000", function(data) {
                    send_email_alert_comment(req.params.event_id, req.params.invite_code, req.params.ustatus, req.body.comment, req.body.displayname, data)
                    res.json(data);
                })
            } else { // req.body.comment != "undefined"
                get_event_data(req.params.event_id, "10000", function(data) {
                    send_email_alert_rsvp(req.params.event_id, req.params.invite_code, req.params.ustatus, "", req.body.displayname, data)
                    res.json(data);
                })
            }
            io.sockets.emit("getinvite", req.params.invite_code);
        } // else   players = null
    });
}


exports.addcomment = function(req, res){
    async.series([
        function(callback) {
            Player.findOne({
                event_id: req.params.event_id
            }, function(error, comments) {
                if (error) {
                    res.json(error);
                } else if (comments == null) {} else {
                    Comments.create({
                            event_id: req.params.event_id,
                            displayname: req.decoded._doc.displayname,
                            user_id: req.decoded._doc._id,
                            text: req.body.text
                        },
                        function(err, result) {
                            if (err)
                                throw err;
                            callback(null, 'one');
                        });
                };
            });
        },
        function(callback) {
            get_event_data(req.params.event_id, req.decoded._doc._id, function(data) {
                res.json(data);
            })
            callback();
        }
    ], function(error) {
        if (error) {
            //handle readFile error or processFile error here
        }
    });
}

exports.geteventinvite = function(req, res){
    Invite.findOne({
            invite_code: req.params.invite_code
        },
        function(err, invites) {
            if (err)
                res.send(err)
            if (invites) {
                if (invites["invite_status"] == "Opened" || invites["invite_status"] == "Sent") {
                    update_invite_status(invites["_id"], "Opened");
                }
                get_event_data(invites.event_id, req.params.invite_code, function(data) {
                    res.json(data);
                })
            } else {
                return res.status(404).send({
                    success: false,
                    message: 'No Invite for that code.'
                });
            }
        });
}

exports.geteventdata = function(req, res){
    get_event_data(req.params.event_id, req.decoded._doc._id, function(data) {
        res.json(data);
    })
}

exports.geteventinviteanon = function(req, res){
    Invite.findOne({
            invite_code: req.params.invite_code
        },
        function(err, invites) {
            if (err)
                res.send(err)
            if (invites) {
                if (invites["invite_status"] == "Opened" || invites["invite_status"] == "Sent") {
                    update_invite_status(invites["_id"], "Opened");
                }
                get_event_data(invites.event_id, req.params.invite_code, function(data) {
                    res.json(data);
                })
            } else {
                return res.status(403).send({
                    success: false,
                    message: 'No Invite for that code.'
                });
            }
        });
}


function get_event_data(event_id, user_id, callback) {
    var pushY = {};
    Comments.find({
            event_id: event_id
        }, null, {
            sort: {
                "created_at": -1
            }
        },
        function(err, comments) {
            if (err)
                res.send(err)
            Player.find({
                    event_id: event_id,
                    in_or_out: 'Yes'
                },
                function(err, players_yes) {
                    if (err)
                        res.send(err)
                    Player.find({
                            event_id: event_id,
                            invite_code: user_id
                        },
                        function(err, is_member) {
                            if (err)
                                res.send(err)
                            Player.find({
                                    event_id: event_id,
                                    in_or_out: 'No'
                                },
                                function(err, players_no) {
                                    if (err)
                                        res.send(err)
                                    Player.find({
                                            event_id: event_id,
                                            in_or_out: 'Maybe'
                                        },
                                        function(err, players_maybe) {
                                            if (err)
                                                res.send(err)
                                            Event.find({
                                                    _id: event_id
                                                },
                                                function(err, events) {
                                                    if (err)
                                                        res.send(err)
                                                    Player.find({
                                                            event_id: event_id
                                                        },
                                                        function(err, players_list) {
                                                            if (err)
                                                                res.send(err)
                                                            async.each(players_list, function(events, callback) {
                                                                User.findOne({
                                                                        _id: events.user_id
                                                                    },
                                                                    function(err, user_list) {
                                                                        if (err)
                                                                            res.send(err)
                                                                            //pushY[events.user_id] = (user_list.fname + user_list.password.substring(0, 1)).toString()
                                                                        callback();
                                                                    });
                                                            }, function(err) {

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


function send_email_alert_rsvp(event_id, invite_code, ustatus, comment, displayname, event_data) {
    console.log("dfasfdsa 55555555")
    Player.find({
            event_id: event_id,
            notice_rsvp: 'YES'
        },
        function(err, players_list) {
            if (err)
                res.send(err)
            async.each(players_list, function(players, callback) {
                if (invite_code == players.invite_code) {
                    var email_subject = 'you posted an rsvp as ' + displayname + ' for event ' + event_data.event[0]["event_title"]
                    var email_html = 'you posted as ' + displayname + 'a rsvp ' + ustatus + '<br> <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length
                } else {
                    var email_subject = 'New rsvp posted by ' + displayname + ' for event ' + event_data.event[0]["event_title"]
                    var email_html = displayname + " rsvp'd " + ustatus + '<br> <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length
                }
                transporter.sendMail({
                    from: config.username,
                    to: players.username,
                    subject: email_subject,
                    html: email_html,
                });
                transporter.close();
            });
        });
}

function send_email_alert_comment(event_id, invite_code, ustatus, comment, displayname, event_data) {

    if (ustatus == 'none') {
        Player.find({
                event_id: event_id,
                notice_comments: 'YES'
            },
            function(err, players_list) {
                if (err)
                    res.send(err)
                async.each(players_list, function(players, callback) {
                    if (invite_code == players.invite_code) {
                        var email_subject = 'you posted comment for event ' + event_data.event[0]["event_title"]
                        var email_html = 'you posted a comment as ' + displayname + '<br>"' + comment + '"<br> for event <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                    } else {
                        var email_subject = 'New comment posted by ' + displayname + ' for event ' + event_data.event[0]["event_title"]
                        var email_html = displayname + ' posted a new comment ' + comment + '<br> <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                    }
                    transporter.sendMail({
                        from: config.username,
                        to: players.username,
                        subject: email_subject,
                        html: email_html,
                        text: 'hello world asd!'
                    });
                    transporter.close();
                });
            });


    } else {

        Player.find({
                $and: [{
                    event_id: event_id
                }, {
                    notice_comments: 'NO'
                }, {
                    notice_rsvp: 'YES'
                }]
            },
            function(err, players_list) {
                if (err)
                    res.send(err)
                async.each(players_list, function(players, callback) {
                    if (invite_code == players.invite_code) {
                        var email_subject = 'you rsvpd ' + ustatus + ' for event ' + event_data.event[0]["event_title"]
                        var email_html = 'you rsvpd ' + ustatus + ' as ' + displayname + '<br>for event <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                    } else {
                        var email_subject = displayname + " rsvp'd " + ustatus + ' for event ' + event_data.event[0]["event_title"]
                        var email_html = displayname + " rsvp'd " + ustatus + '<br>for event <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                    }
                    transporter.sendMail({
                        from: config.username,
                        to: players.username,
                        subject: email_subject,
                        html: email_html,
                    });
                    transporter.close();
                });
            });

        Player.find({
                $and: [{
                    event_id: event_id
                }, {
                    notice_comments: 'YES'
                }, {
                    notice_rsvp: 'NO'
                }]
            },
            function(err, players_list) {
                if (err)
                    res.send(err)
                async.each(players_list, function(players, callback) {
                    if (invite_code == players.invite_code) {
                        var email_subject = 'you posted comment posted as for event ' + event_data.event[0]["event_title"]
                        var email_html = 'you posted a comment as ' + displayname + '<br>"' + comment + '"<br> for event <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                    } else {
                        var email_subject = 'New rsvp posted by ' + displayname + ' for event ' + event_data.event[0]["event_title"]
                        var email_html = displayname + ' posted a new comment ' + comment + '<br> <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                    }
                    transporter.sendMail({
                        from: config.username,
                        to: players.username,
                        subject: email_subject,
                        html: email_html,
                    });
                    transporter.close();
                });
            });

        Player.find({
                $and: [{
                    event_id: event_id
                }, {
                    notice_comments: 'YES'
                }, {
                    notice_rsvp: 'YES'
                }]
            },
            function(err, players_list) {
                if (err)
                    res.send(err)
                async.each(players_list, function(players, callback) {
                    if (invite_code == players.invite_code) {
                        var email_subject = 'You posted a comment and rsvpd for event ' + event_data.event[0]["event_title"]
                        var email_html = 'You rsvpd <b>' + ustatus + ' </b> as displayname <b>' + displayname + '</b><br><br><b>Comment -</b> "' + comment + '"<br><br>For event <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br><br>' + 'Number of Yeses-' + event_data.players_yes.length + '<br>' + 'Number of Nos-' + event_data.players_no.length

                    } else {
                        var email_subject = 'New comment and rsvp posted by ' + displayname + ' for event ' + event_data.event[0]["event_title"]
                        var email_html = displayname + ' rsvpd ' + ustatus + ' and posted a new comment-"' + comment + '"<br> for event <a href="' + config.endpoint + '/invite/' + players.invite_code + '">' + event_data.event[0]["event_title"] + '</a>' + ' at ' + event_data.event[0]["event_start"] + '<br>' + 'number of yeses-' + event_data.players_yes.length + '<br>' + 'number of nos-' + event_data.players_no.length

                    }
                    transporter.sendMail({
                        from: config.username,
                        to: players.username,
                        subject: email_subject,
                        html: email_html,
                        text: 'hello world asd!'
                    });
                    transporter.close();
                });
            });
    }
}

function update_invite_status(invite_id, ustatus) {
    Invite.update({
            _id: invite_id
        }, {
            $set: {
                invite_status: ustatus,
                date_opened: new Date()
            }
        },
        function(err, result) {
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
        function(err, result) {
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
        function(err, result) {
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
        function(err, result) {
            if (err)
                throw err;
        });
}


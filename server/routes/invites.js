var Invite = require('../app/models/invites');
var config = require('../config');
var crypto = require('crypto');
var Event = require('../app/models/events');

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



exports.invitedlist = function(req, res){
    Invite.find({
            event_id: req.params.event_id
        },
        null, {
            sort: {
                "created_at": -1
            }
        },
        function(err, invites) {
            if (err)
                res.send(err)
            Event.find({
                    _id: req.params.event_id
                },
                function(err, events) {
                    if (err)
                        res.send(err)
                    Invite.findOne({
                            event_id: req.params.event_id,
                            event_creator: 'Yes'
                        },
                        function(err, invite_creator) {
                            if (err)
                                res.send(err)
                            res.json({
                                'logged_in_userid': req.decoded._doc._id,
                                'invite_creator': invite_creator,
                                'event': events,
                                'invites': invites
                            });
                        });
                });
        });
}

exports.addinvite = function(req, res){

    Event.find({
            _id: req.params.event_id
        },
        function(err, events) {
            if (err)
                throw err;
            Invite.create({
                    event_id: req.params.event_id,
                    inviter: req.decoded._doc.username,
                    invited: req.body.text,
                    invited_email: req.body.email,
                    invited_phone: req.body.phone,
                    invited_type: req.body.type,
                    invite_code: randomValueHex(8),
                    invite_status: "Sent"
                },
                function(err, new_invite) {
                    console.log(events[0]["event_title"])
                    transporter.sendMail({
                        from: config.username,
                        to: req.body.email,
                        subject: 'You are invited to the event ' + events[0]["event_title"] + ' at ' + events[0]["event_start"],
                        html: 'You are invited to the event <a href="' + config.endpoint + '/invite/' + new_invite.invite_code + '">' + events[0]["event_title"] + '</a>' + ' at ' + events[0]["event_start"],
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
                        function(err, invites) {
                            if (err)
                                res.send(err)
                            res.json({
                                'invites': invites
                            });
                        });
                }); //d8d88d
        });
}

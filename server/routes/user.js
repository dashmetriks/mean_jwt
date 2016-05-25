var jwt = require('jsonwebtoken');
var User = require('../app/models/user');
var express = require('express');
var app = express(); // create our app w/ express
var config = require('../config');

app.set('superSecret', config.secret);

exports.register = function(req, res){
    User.findOne({
        username: req.body.name
    }, function(err, user) {

        if (err)
            throw err;

        if (!user) {
            var newuser = new User({
                username: req.body.name,
                password: req.body.password
            });
            newuser.save(function(err) {
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
}

exports.authenticate = function(req, res){

    User.findOne({
        username: req.body.name
    }, function(err, user) {

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
                    user_displayname: user.displayname,
                    token: token
                });
            }

        }

    });
}

exports.usersave = function(req, res){
    User.update({
            _id: req.decoded._doc._id
        }, {
            $set: {
                username: req.body.username,
                displayname: req.body.displayname
            }
        },
        function(err, users) {
            if (err)
                throw err;
            //res.json(result);
            res.json({
                'user': users,
            });
        });
}

exports.passwordsave = function(req, res){
    User.update({
            _id: req.decoded._doc._id
        }, {
            $set: {
                password: req.body.password
            }
        },
        function(err, users) {
            if (err)
                throw err;
            //res.json(result);
            res.json({
                'user': users,
            });
        });
}

exports.userget = function(req, res){
console.log("asdfasfdasfads")
console.log(req.decoded._doc._id)
    User.find({
            _id: req.decoded._doc._id
        },
        function(err, users) {
            if (err)
                res.send(err)
            res.json({
                'user': users,
            });
        });
}


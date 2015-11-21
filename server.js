// server.js

// set up ========================
var express = require('express');
var app = express(); // create our app w/ express
var mongoose = require('mongoose'); // mongoose for mongodb
var morgan = require('morgan'); // log requests to the console (express4)
var bodyParser = require('body-parser'); // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');

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

var Todo = mongoose.model('Todo', {
    text: String,
    persons: [Person.username]
});

apiRoutes.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
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

apiRoutes.get('/usersget', function(req, res) {
    User.find({}, function(err, users) {
        res.json(users);
    });
});

app.get('/setup', function(req, res) {

    // create a sample user
    var nick = new User({
        name: 'woot8',
        password: '77jump'
    });

    // save the sample user
    nick.save(function(err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({
            success: true
        });
    });
});

app.post('/authenticate', function(req, res) {

    // find the user
    User.findOne({
        name: req.body.name
    }, function(err, user) {

        if (err) throw err;

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

app.get('/adduser/:username', function(req, res) {
    var person_data = {
        username: req.params.username
    };

    var person = new Person(person_data);

    person.save(function(error, data) {
        if (error) {
            res.json(error);
        } else {
            res.json(data);
        }
    });
});

apiRoutes.get('/adduserevent/:event_id/:ustatus', function(req, res) {
    Todo.findOne({
        _id: req.params.event_id,
        "persons.username._id": req.decoded._id
    }, function(error, todos) {
        if (error) {
            res.json(error);
        } else if (todos == null) {
            res.json('no such todo!')
        } else {
            console.log(todos);
            console.log('wttttttfffff');
            Todo.update(
               { 
                 "text": "12345677"
               },
               { 
               $set: { 
                 "persons.0.userstatus": req.params.ustatus 
               }
             },
             function (err, result) {
      if (err) throw err;
      console.log(result);
      console.log('errrrrrrr');
          
           });

           // todos.save(function(err, data) {
            //    if (err)
             //       res.send(err);
            Todo.find({
                _id: req.params.event_id
            }, function(err, todos) {
                    if (err)
                        res.send(err)
                    res.json(todos);
                });
          //  });
        }
    });
});

app.get('/api/events/:event_id', function(req, res) {

    // use mongoose to get all todos in the database
    Todo.find({ _id: req.params.event_id },
          function(err, todos) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)

        res.json(todos); // return all todos in JSON format
    });
});

app.get('/api/todos', function(req, res) {

    // use mongoose to get all todos in the database
    Todo.find(function(err, todos) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)

        res.json(todos); // return all todos in JSON format
    });
});

// create todo and send back all todos after creation
app.post('/api/todos', function(req, res) {

    // create a todo, information comes from AJAX request from Angular
    Todo.create({
        text: req.body.text,

        done: false
    }, function(err, todo) {
        if (err)
            res.send(err);

        // get and return all the todos after you create another
        Todo.find(function(err, todos) {
            if (err)
                res.send(err)
            res.json(todos);
        });
    });

});

// delete a todo
app.delete('/api/todos/:todo_id', function(req, res) {
    Todo.remove({
        _id: req.params.todo_id
    }, function(err, todo) {
        if (err)
            res.send(err);

        // get and return all the todos after you create another
        Todo.find(function(err, todos) {
            if (err)
                res.send(err)
            res.json(todos);
        });
    });
});


app.use('/api', apiRoutes);
//apiRoutes.use(function(req, res) {
 //   res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
//});

// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");

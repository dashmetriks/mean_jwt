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

function randomValueHex (len) {
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len);   // return required number of characters
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
   invite_code: String,
   invite_status: String,
   created_at: {type: Date, default: Date.now}
});

var Invite = mongoose.model('Invite', Invite);
var Player = new Schema({
   event_id: String,
   username: String,
   in_or_out: String,
   created_at: {type: Date, default: Date.now}
});

var Player = mongoose.model('Player', Player);

var Comments = new Schema({
   event_id: String,
   username: String,
   text: String,
   created_at: {type: Date, default: Date.now}
});

var Comments = mongoose.model('Comments', Comments);

var TodoSchema = new Schema({
    text: String,
    persons: [Person.username],
    //comments: [Person.username]
   // comments:  [
    //                {
     //                   username: String,
      //                  text: String,
       //                 created_at: {type: Date, default: Date.now}
        //            }
         //       ]   
});

autoIncrement.initialize(mongoose.connection);
TodoSchema.plugin(autoIncrement.plugin, 'Todo');

var Todo = mongoose.model('Todo', TodoSchema);

apiRoutes.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token !== "null") {

console.log("weeeeee are heeeeer tookeennnnn");
console.log(token);
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

console.log("nooooooo tookeennnnn");
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

app.post('/register', function(req, res) {
console.log("registers now");
    // find the user
    User.findOne({
        name: req.body.name
    }, function(err, user) {

        if (err) throw err;

        if (!user) {
          var newuser = new User({
              name: req.body.name,
              password: req.body.password
          });

          // save the sample user
          newuser.save(function(err) {
              if (err) throw err;

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
    Player.findOne({
        event_id: req.params.event_id,
        username: req.decoded.name 
    }, function(error, players) {
        if (error) {
            res.json(error);
        } else if (players == null) {
    console.log("we are herererererererer");
            Player.create( { 
               event_id: req.params.event_id,
               username: req.decoded.name, 
               in_or_out: req.params.ustatus} , 
      /*      Todo.update(
               { _id: req.params.event_id }, 
               {
                $push: {
                    persons: {
                        $each: [{ username: req.decoded, userstatus: req.params.ustatus }]
                        }
                    }
                },
*/
                function(err, result) {
                    if (err) throw err;
                    console.log(result);
                });
        } else {
            Player.update({
                    event_id: req.params.event_id,
                    username: req.decoded.name 
                }, {
                    $set: {
                        in_or_out: req.params.ustatus 
                      //  "persons.$.userstatus": req.params.ustatus
                    }
                },
                function(err, result) {
                    if (err) throw err;
                    console.log(result);
                });
        }
    Player.find({ event_id: req.params.event_id , in_or_out: 'Yes' },
        function(err, players_yes) {
            if (err) res.send(err)
    Player.find({ event_id: req.params.event_id , in_or_out: 'No' },
        function(err, players_no) {
            if (err) res.send(err)
    //       res.json(todos); // return all todos in JSON format
            res.json({
                'players_yes': players_yes,
                'players_no': players_no
        //        'comments': comments,
            });            
    });
    });
//        Player.find({
 //           event_id: req.params.event_id
  //      }, function(err, players) {
   //         if (err)
    //            res.send(err)
     //       res.json(players);
     //   });
    });
});


apiRoutes.post('/addinvite/:event_id/', function(req, res) {
            Invite.create( { 
               event_id: req.params.event_id,
               inviter: req.decoded.name, 
               invited: req.body.text,
               invite_code: randomValueHex(8),
               invite_status: "open"} , 
                function(err, result) {
                    if (err) throw err;
    });
});

apiRoutes.post('/addcomment/:event_id/', function(req, res) {
    Player.findOne({
       event_id: req.params.event_id
    }, function(error, todos) {
        if (error) {
            res.json(error);
        } else if (todos == null) {
        } else {

            Comments.create( { 
               event_id: req.params.event_id,
               username: req.decoded.name, 
               text: req.body.text} , 
                function(err, result) {
                    if (err) throw err;
Comments.find({ event_id: req.params.event_id },
null,
{ sort:{ "created_at" : -1  } },
 function(err, comments) {
            if (err) res.send(err)
            res.json({
                'comments': comments,
            });            
        });
                });
        };
    });
});

app.get('/getcomments/:event_id', function(req, res) {

Comments.find({ event_id: req.params.event_id },
null,
{ sort:{ "created_at" : -1  } },
 function(err, comments) {
            if (err) res.send(err)
    Player.find({ event_id: req.params.event_id , in_or_out: 'Yes' },
        function(err, players_yes) {
            if (err) res.send(err)
    Player.find({ event_id: req.params.event_id , in_or_out: 'No' },
        function(err, players_no) {
            if (err) res.send(err)
    //       res.json(todos); // return all todos in JSON format
            res.json({
                'players_yes': players_yes,
                'players_no': players_no,
                'comments': comments,
            });            
    });
    });
    });
});

app.get('/invites/:invite_code', function(req, res) {
  console.log('invite code ------');
  console.log(req.params.invite_code);


    // use mongoose to get all todos in the database
    Invite.find({ invite_code: req.params.invite_code },
        function(err, invites) {
            if (err) res.send(err)
           console.log(invites);
           res.json(invites); // return all todos in JSON format
    });
});
apiRoutes.get('/events/:event_id', function(req, res) {
  console.log('event id');
  console.log(req.params.event_id);


    // use mongoose to get all todos in the database
    Todo.find({ _id: req.params.event_id },
        function(err, todos) {
            if (err) res.send(err)
           res.json(todos); // return all todos in JSON format
    });
});

apiRoutes.get('/todos', function(req, res) {

  console.log(' ee are here');
    // use mongoose to get all todos in the database
    Todo.find(function(err, todos) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)

        res.json(todos); // return all todos in JSON format
    });
});

// create todo and send back all todos after creation
apiRoutes.post('/todos', function(req, res) {

console.log ("po po");
    // create a todo, information comes from AJAX request from Angular
    Todo.create({
        text: req.body.text
    }, function(err, todo) {
        if (err)
            res.send(err);

        // get and return all the todos after you create another
        Todo.find(function(err, todos) {
            if (err)
                res.send(err)
            console.log("now now");
            console.log(todos);
    
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
app.use(function(req, res) {
   res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");

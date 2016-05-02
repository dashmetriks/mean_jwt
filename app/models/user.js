// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('User', new Schema({ 
    name: String, 
    fname: String, 
    email: String, 
    lname: String, 
    password: String, 
    admin: Boolean 
}));
*/

module.exports = mongoose.model('User', new Schema({
    username: String,
    displayname: String,
    password: String,
    admin: Boolean
}));

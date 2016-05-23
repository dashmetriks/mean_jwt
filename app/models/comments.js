var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Comments', new Schema({
    event_id: String,
    displayname: String,
    user_id: String,
    text: String,
    created_at: {
        type: Date,
        default: Date.now
    }
}));

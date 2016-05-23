var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Event', new Schema({
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
}));

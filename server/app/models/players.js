var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Player', new Schema({
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
}));

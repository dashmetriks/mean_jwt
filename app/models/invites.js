var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Invite', new Schema({
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
}));

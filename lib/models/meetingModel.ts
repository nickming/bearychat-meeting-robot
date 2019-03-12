import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const MeetingSchema = new Schema({
    location: {
        type: String
    },
    topic: {
        type: String,
    },
    member_ids: {
        type: String
    },
    start_date: {
        type: Number
    },
    uid: {
        type: String
    },
    team_id: {
        type: String
    },
    member_names: {
        type: String
    },
    creator_name: {
        type: String
    },
    is_notify: {
        type: Boolean,
        default: false
    }
})
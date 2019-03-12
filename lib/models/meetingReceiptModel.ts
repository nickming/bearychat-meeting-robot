import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const MeetingReceiptSchema = new Schema({
    meeting_id: {
        type: String
    },

    uid: {
        type: String,
    },

    is_confirm: {
        type: Boolean,
        default: false
    }
})

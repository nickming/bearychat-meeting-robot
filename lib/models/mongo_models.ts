import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const MeetingSchema = new Schema({
    location: {
        type: String
    },
    topic: {
        type: String,
    },
    memberIds: {
        type: [String]
    },
    startDate: {
        type: Number
    },
    uid: {
        type: String
    },
    teamId: {
        type: String
    },
    memberNames: {
        type: [String]
    },
    userName: {
        type: String
    },
    hadNotify: {
        type: Boolean,
        default: false
    },
    vid: {
        type: String
    },
    channelName: {
        type: String
    },
    extra: {
        type: String
    }
})

export const MemberReceiptSchema = new Schema({
    meetingId: {
        type: String
    },

    uid: {
        type: String,
    },

    hadConfirm: {
        type: Boolean,
        default: false
    }
})
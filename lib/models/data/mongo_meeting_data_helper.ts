
import * as mongoose from 'mongoose';
import { MeetingSchema, MemberReceiptSchema } from '../mongo_models';

const Meeting = mongoose.model('Meeting', MeetingSchema)
const MemberReceipt = mongoose.model('MeetingReceipt', MemberReceiptSchema)

export class MongoMeetingDataHelper implements BaseMeetingInterface {
    queryMeetingById(meetingId: string): Promise<any> {
        return Meeting.findById(meetingId)
            .then(meeting => {
                return meeting
            })
    }
    queryNeedNotifyMeeting(): Promise<any[]> {
        let now = Math.round(new Date().getTime() / 1000);
        return Meeting.find({
            'hadNotify': false,
            'startDate': { "$gt": now, "$lte": now + 5 * 60 }
        })
            .then(meetings => {
                return meetings;
            })
    }

    queryDeletableMeeting(teamId: string, uid: string): Promise<any[]> {
        const nowTs = Math.round(new Date().getTime() / 1000);
        return Meeting.find({
            'uid': uid,
            'teamId': teamId,
            'startDate': { '$let': nowTs }
        })
            .then(meetings => {
                return meetings
            })
    }
    queryManageMeeting(teamId: string, uid: string): Promise<any[]> {
        return Meeting.find({
            'teamId': teamId,
            'memberIds': [uid]
        })
            .sort({
                'startDate': -1,
                'hadNofity': -1
            })
            .then(meetings => {
                return meetings
            })
    }
    saveMeeting(meeting: any): Promise<any> {
        return new Meeting(meeting).save()
    }
    saveMemberReceipt(uid: string, meetingId: string) {
        return new MemberReceipt({
            'uid': uid,
            'meetingId': meetingId,
            'hadConfirm': false
        }).save()
    }


    updateMemberReceiptConfirm(meetingId: string): Promise<any> {
        return MemberReceipt.findOne({
            'hadConfirm': false,
            'meetingId': meetingId
        }).then(meeting => {
            return meeting
        })
    }

    updateMeetingConfirm(meetingId: string) {
        Meeting.findOneAndUpdate({ 'meetingId': meetingId },
            { 'hadNotify': true })
    }


    deleteMeetingById(meetingId: string) {
        MemberReceipt.deleteMany({
            'meetingId': meetingId
        })
            .then(() => {
                Meeting.deleteOne({
                    'meetingId': meetingId
                })
            })
    }
}
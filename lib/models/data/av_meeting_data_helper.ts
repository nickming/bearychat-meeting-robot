import * as AV from 'leancloud-storage';
import { Meeting, MemberReceipt } from '../av_models';

export class AVMeetingDataHelper implements BaseMeetingInterface {

    queryMeetingById(meetingId: string): Promise<any> {
        return new AV.Query(Meeting).get(meetingId)
    }

    queryNeedNotifyMeeting(): Promise<any[]> {
        let now = Math.round(new Date().getTime() / 1000);
        return new AV.Query(Meeting).equalTo('hadNotify', false)
            .greaterThanOrEqualTo('startDate', now)
            .lessThanOrEqualTo('startDate', now + 5 * 60)
            .find()
    }
    queryDeletableMeeting(teamId: string, uid: string): Promise<any[]> {
        const nowTs = Math.round(new Date().getTime() / 1000);
        return new AV.Query(Meeting)
            .equalTo('uid', uid)
            .equalTo('teamId', teamId)
            .greaterThanOrEqualTo('startDate', nowTs)
            .find()
    }
    queryManageMeeting(teamId: string, uid: string): Promise<any[]> {
        return new AV.Query(Meeting)
            .contains('memberIds', uid)
            .equalTo('teamId', teamId)
            .ascending('startDate')
            .ascending('hadNotify')
            .find()
    }
    saveMeeting(meeting: any): Promise<any> {
        return new Meeting().save(meeting);
    }
    saveMemberReceipt(uid: string, meetingId: string) {
        return new MemberReceipt()
            .save({
                meetingId: meetingId,
                uid: uid,
                hadConfirm: false
            })
    }
    updateMemberReceiptConfirm(meetingId: string): Promise<any> {
        return new AV.Query(MemberReceipt)
            .equalTo('meetingId', meetingId)
            .equalTo('hadConfirm', false)
            .first()
            .then((receipt: any) => {
                receipt.set('hadConfirm', true)
                return receipt.save()
            })
    }
    updateMeetingConfirm(meetingId: string) {
        this.queryMeetingById(meetingId)
            .then(meeting => {
                meeting.set('hadNotify', true);
                return meeting.save()
            })
    }

    deleteMeetingById(meetingId: string) {
        return new AV.Query(MemberReceipt)
            .equalTo('meetingId', meetingId)
            .find()
            .then(receipts => {
                let objects = new Array<any>();
                receipts.forEach(item => {
                    objects.push(item)
                })
                return AV.Object.destroyAll(objects)
            })
            .then(() => {
                return new AV.Query(Meeting)
                    .get(meetingId)
            })
            .then((meeting: any) => {
                return meeting.destroy()
            })
    }
}
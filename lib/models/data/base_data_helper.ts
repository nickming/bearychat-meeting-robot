interface BaseMeetingInterface {

    queryMeetingById(meetingId: string): Promise<any>

    queryNeedNotifyMeeting(): Promise<Array<any>>

    queryDeletableMeeting(teamId: string, uid: string): Promise<Array<any>>

    queryManageMeeting(teamId: string, uid: string): Promise<Array<any>>

    saveMeeting(meeting: any): Promise<any>

    saveMemberReceipt(uid: string, meetingId: string)

    updateMemberReceiptConfirm(meetingId: string): Promise<any>

    updateMeetingConfirm(meetingId: string)

    deleteMeetingById(meetingId: string)

}
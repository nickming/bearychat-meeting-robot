import { Request, Response, response } from 'express';
import { Form } from '../models/base/action';
import { BearyChatHelper } from '../utils/bearychat_helper';
import { BEARYCHAT_INIT_URL, ActionType, BEARYCHAT_RESULT_URL } from '../utils/constants';
import { INIT_STATE_FORM, CREATE_STATE_FORM, ERROR_FORM, generateMeetingResultForm, generateCreateSuccessForm, generateDeleteMeetingForm, generateManageMeetingForm, convertDateToString, DELETE_MEETING_SUCCESS_FORM, ERROR_PARAMS_FORM, MEETING_WAS_DELETED } from '../utils/formUtils';
import { Meeting, MemberReceipt } from '../models/av_models';
import * as AV from 'leancloud-storage';

const TOKEN = '3610cd4bfd53071dae303c5532f79eea'

export class MeetingController {

    bearyChatHelper: BearyChatHelper = new BearyChatHelper();

    constructor() {
        this.meetingNotifyLoop();
    }

    private meetingNotifyLoop() {
        setInterval(async () => {
            let now = Math.round(new Date().getTime() / 1000);
            let meetings = await new AV.Query(Meeting).equalTo('hadNotify', false)
                .greaterThanOrEqualTo('startDate', now)
                .lessThanOrEqualTo('startDate', now + 5 * 60)
                .find()
            this.notifyMeetingIsComing(meetings);
        }, 1 * 60 * 1000);
    }

    handleBearyChatWebHook(req: Request, res: Response): void {
        const vchannel: string = req.body['vchannel']
        const token: string = req.body['token']
        this.bearyChatHelper.sendMessageToBearyChat(token, vchannel,
            '欢迎使用会议助手小机器人!', BEARYCHAT_INIT_URL)
            .then(_ => {
                response.status(200).send({
                    message: 'send success!'
                })
            })
            .catch(err => {
                response.status(1001).send({
                    message: `can not send message to bearychat:${err}`
                })
            });
    }

    handleInitFormRequest(req: Request, res: Response): void {
        this.sendForm(INIT_STATE_FORM, res);
    }

    handleDynamicMeetingData(req: Request, res: Response): void {
        const action: string = req.body['action']
        switch (action) {
            case ActionType.CREATE: {
                this.sendForm(CREATE_STATE_FORM, res);
                break
            }
            case ActionType.MANAGE: {
                this.handleManageMeetingFormRequest(req, res);
                break
            }
            case ActionType.BACK: {
                this.sendForm(INIT_STATE_FORM, res);
                break
            }
            case ActionType.DELETE: {
                this.handleDeleteMeetingFormRequest(req, res);
                break
            }
            case ActionType.CREATE_MEETING: {
                this.createMeetingFromRequest(req, res);
                break
            }
            case ActionType.DELETE_MEETING: {
                this.deleteMeetingFromRequest(req, res);
                break
            }
            default: {
                this.sendForm(ERROR_FORM, res);
                break
            }
        }
    }

    handleShowMeetingResult(req: Request, res: Response, isGet: boolean): any {
        const meetingId = req.query['meeting_id'];
        const uid = req.query['user_id'];
        let topic = ""
        if (isGet) {
            new AV.Query(MemberReceipt)
                .equalTo('meetingId', meetingId)
                .equalTo('uid', uid)
                .first()
                .then(receipt => {
                    return receipt.get('hadConfirm')
                })
                .then(confirm => {
                    return new AV.Query(Meeting)
                        .get(meetingId)
                        .then(value => {
                            const form = generateMeetingResultForm(value, confirm)
                            res.status(200).json(form)
                        })
                })
                .catch(err => {
                    res.status(200).json(MEETING_WAS_DELETED)
                    console.log(`can not show result:${err}`);
                })
        } else {
            new AV.Query(MemberReceipt)
                .equalTo('meetingId', meetingId)
                .equalTo('hadConfirm', false)
                .first()
                .then((receipt: any) => {
                    receipt.set('hadConfirm', true)
                    return receipt.save()
                })
                .then(() => {
                    return new AV.Query(Meeting).get(meetingId)
                })
                .then(value => {
                    const form = generateMeetingResultForm(value, true)
                    res.status(200).json(form)
                    let uid = value.get('uid')
                    topic = value.get('topic')
                    return this.bearyChatHelper.getVidByMemberId(TOKEN, uid)
                })
                .then(vid => {
                    return this.bearyChatHelper.getMemberNameByUid(TOKEN, uid)
                        .then(name => {
                            this.bearyChatHelper.sendMessageToBearyChat(TOKEN, vid, `**${name}**已确定参加会议:${topic}`)
                        })
                })
                .catch(err => {
                    res.status(200).json(MEETING_WAS_DELETED)
                    console.log(`can not show result:${err}`);
                })
        }
    }

    private handleDeleteMeetingFormRequest(req: Request, res: Response) {
        const uid: string = req.query['user_id'];
        const nowTs = Math.round(new Date().getTime() / 1000);
        new AV.Query(Meeting)
            .equalTo('uid', uid)
            .greaterThanOrEqualTo('startDate', nowTs)
            .find()
            .then(meetings => {
                return generateDeleteMeetingForm(meetings)
            })
            .then(form => {
                res.status(200).json(form)
            })
            .catch(err => {
                res.status(200).json(ERROR_FORM)
            })
    }

    private handleManageMeetingFormRequest(req: Request, res: Response) {
        const uid: string = req.query['user_id'];
        new AV.Query(Meeting)
            .contains('memberIds', uid)
            .ascending('startDate')
            .ascending('hadNotify')
            .find()
            .then(meetings => {
                return generateManageMeetingForm(meetings)
            })
            .then(form => {
                res.status(200).json(form)
            })
            .catch(err => {
                res.status(200).json(ERROR_FORM)
            })
    }


    private createMeetingFromRequest(request: Request, response: Response) {
        const user_id: string = request.query['user_id'];
        const token: string = request.query['token'];
        const team_id: string = request.query['team_id'];

        const topic: string = request.body.data['topic']
        const location: string = request.body.data['location']
        const date: string = request.body.data['date']
        const members: Array<string> = request.body.data['members']

        if (topic == null || location == null || date == null || members == null) {
            response.status(200).json(ERROR_PARAMS_FORM)
            return
        }

        //如果创建者不在会议里，则添加进去
        if (members.find(id => id == user_id) == null) {
            members.push(user_id)
        }
        let meetingData = {
            location: location,
            topic: topic,
            memberIds: members,
            startDate: date,
            uid: user_id,
            teamId: team_id,
        }
        this.bearyChatHelper.getMemberNameByUid(token, user_id)
            .then(creator => {
                meetingData['userName'] = creator
                return this.bearyChatHelper.getMemberNamesByUids(token, members)
            })
            .then(names => {
                meetingData['memberNames'] = names
                return meetingData
            })
            .then(data => {
                return new Meeting().save(data)
            })
            .then((value) => {
                const meetingId = value.id;
                console.log(`save a new meeting ${meetingId}`)
                this.sendMessageToTargetMembers(token, members, meetingId)
                response.status(200).json(generateCreateSuccessForm(value))
            })
            .catch((reason) => {
                console.log(`save meeting error:${reason}`)
                response.status(200).json(ERROR_FORM);
            })
    }

    private deleteMeetingFromRequest(request: Request, response: Response) {
        const meetingId: string = request.body.data['meeting_id'];
        const uid: string = request.query['user_id']
        if (meetingId == null) {
            response.status(200).json(ERROR_FORM)
            return
        }
        new AV.Query(MemberReceipt)
            .equalTo('meetingId', meetingId)
            .equalTo('uid', uid)
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
            .then(success => {
                response.status(200).json(DELETE_MEETING_SUCCESS_FORM)
            }, error => {
                response.status(200).json(ERROR_FORM);
            })
    }

    private sendMessageToTargetMembers(token: string, members: Array<string>, meetingId: any) {
        members.forEach((uid) => {
            this.bearyChatHelper.getVidByMemberId(token, uid)
                .then(vid => {
                    this.bearyChatHelper.sendMessageToBearyChat(token, vid, "您有到一条会议消息请确认!", BEARYCHAT_RESULT_URL + `?meeting_id=${meetingId}`)
                })
                .then(() => {
                    new MemberReceipt().save({
                        meetingId: meetingId,
                        uid: uid,
                        hadConfirm: false
                    })
                })
                .then(receipt => {
                    console.log(`create meeting receipt:${(receipt as any).uid}`)
                })
                .catch(err => {
                    console.log(`can not send message to:${uid}`);
                })
        })
    }

    private sendForm(form: Form, response: Response) {
        response.status(200).json(form)
    }

    private notifyMeetingIsComing(meeting: Array<any>) {
        meeting.forEach(element => {
            if (element.get('hadNotify') == true) return
            let uids = element.get('memberIds') as Array<string>
            uids.forEach(uid => {
                this.bearyChatHelper.getVidByMemberId(TOKEN, uid)
                    .then(vid => {
                        const date = element.get('startDate')
                        const topic = element.get('topic')
                        const names = element.get('memberNames')
                        this.bearyChatHelper.sendMessageToBearyChat(TOKEN, vid, `您有一条会议即将在 **${convertDateToString(date)}** 开始 - 主题: **${topic}** - 与会成员: **${names}**`)
                    })
                    .then(success => {
                        new AV.Query(Meeting).get(element.id)
                            .then((meeting: any) => {
                                meeting.set('hadNotify', true);
                                return meeting.save()
                            })
                    }, onError => {
                        console.log(`can not notify${onError}`);
                    })

            })
        })
    }
}
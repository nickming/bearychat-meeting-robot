import * as mongoose from 'mongoose';
import { MeetingSchema } from '../models/meetingModel';
import { Request, Response, response } from 'express';
import { Form } from '../models/base/action';
import { BearyChatHelper } from '../utils/bearychatHelper';
import { BEARYCHAT_INIT_URL, ActionType, BEARYCHAT_RESULT_URL } from '../utils/constants';
import { INIT_STATE_FORM, CREATE_STATE_FORM, ERROR_FORM, CREATE_MEETING_SUCCESS_FORM, generateMeetingResultForm, generateCreateSuccessForm, generateDeleteMeetingForm, generateManageMeetingForm, convertDateToString, DELETE_MEETING_SUCCESS_FORM, ERROR_PARAMS_FORM, MEETING_WAS_DELETED } from '../utils/formUtils';
import { MeetingReceiptSchema } from '../models/meetingReceiptModel';

const Meeting = mongoose.model('Meeting', MeetingSchema)
const MeetingReceipt = mongoose.model('MeetingReceipt', MeetingReceiptSchema)
const TOKEN = '3610cd4bfd53071dae303c5532f79eea'

export class MeetingController {

    bearyChatHelper: BearyChatHelper = new BearyChatHelper();

    constructor() {
        this.meetingNotifyLoop();
    }

    private meetingNotifyLoop() {
        setInterval(() => {
            let now = new Date().getTime();
            Meeting.find({ is_notify: false })
                .then(meetings => {
                    let notifyMeetings = new Array<any>();
                    meetings.forEach(item => {
                        let startTime = (item as any).start_date * 1000;
                        if (startTime - now <= 5 * 60 * 1000 && startTime - now > 0) {
                            notifyMeetings.push(item);
                        }
                    });
                    return notifyMeetings;
                })
                .then(meetings => {
                    this.notifyMeetingIsComing(meetings);
                });
        }, 2 * 60 * 1000);
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
        const meeting_id = req.query['meeting_id'];
        const user_id = req.query['user_id'];
        let topic = ""
        if (isGet) {
            MeetingReceipt.findOne({
                meeting_id: meeting_id,
                uid: user_id
            })
                .then(receipt => {
                    return (receipt as any).is_confirm
                })
                .then(confirm => {
                    Meeting.findById(meeting_id)
                        .then(value => {
                            const form = generateMeetingResultForm(value, confirm)
                            res.status(200).json(form)
                        })
                        .catch(err => {
                            res.status(200).json(MEETING_WAS_DELETED)
                            console.log(`can not show result:${err}`);
                        })
                })
        } else {
            MeetingReceipt.findOneAndUpdate({ meeting_id: meeting_id, is_confirm: false }, { is_confirm: true })
                .then((receipt) => {
                    return Meeting.findById((receipt as any).meeting_id)
                })
                .then(value => {
                    const form = generateMeetingResultForm(value, true)
                    res.status(200).json(form)
                    let uid = (value as any).uid
                    topic = (value as any).topic
                    return this.bearyChatHelper.getVidByMemberId(TOKEN, uid)
                })
                .then(vid => {
                    this.bearyChatHelper.getMemberNameByUid(TOKEN, user_id)
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
        const user_id: string = req.query['user_id'];
        Meeting.find({ uid: user_id })
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
        const user_id: string = req.query['user_id'];
        Meeting.find({
            uid: user_id
        })
            .sort({ is_notify: -1, start_date: -1 })
            .then(meetings => {
                if ((meetings as Array<any>).length == 0) {
                    return MeetingReceipt.find({
                        user_id: user_id
                    })
                        .then(receipts => {
                            return this.findMeetingsByReceipts(receipts)
                        })
                }
                else {
                    return meetings
                }
            })
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

    private findMeetingsByReceipts(recepits: Array<any>): Promise<Array<any>> {
        return new Promise<Array<any>>((resolve, reject) => {
            let meetings = new Array<any>()
            if (recepits.length == 0) {
                resolve(meetings)
            }
            recepits.map(element => (element as any).meeting_id)
                .forEach(id => {
                    Meeting.findById(id)
                        .then(item => {
                            meetings.push(item)
                            if (meetings.length == meetings.length) {
                                resolve(meetings)
                            }
                        })
                        .catch(err => {
                            reject(err)
                        })
                })
        });
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
            member_ids: members,
            start_date: date,
            uid: user_id,
            team_id: team_id,
        }
        this.bearyChatHelper.getMemberNameByUid(token, user_id)
            .then(creator => {
                meetingData['creator_name'] = creator
                return this.bearyChatHelper.getMemberNamesByUids(token, members)
            })
            .then(names => {
                meetingData['member_names'] = names
                return meetingData
            })
            .then(data => {
                return new Meeting(data).save()
            })
            .then((value) => {
                const meetingId = value._id;
                console.log(`save a new meeting ${meetingId}`)
                // memberIds = memberIds.filter(id => user_id != id)
                this.sendMessageToTargetMembers(token, members, meetingId)
                response.status(200).json(generateCreateSuccessForm(value))
            })
            .catch((reason) => {
                console.log(`save meeting error:${reason}`)
                response.status(200).json(ERROR_FORM);
            })
    }

    private deleteMeetingFromRequest(request: Request, response: Response) {
        const meeting_id: string = request.body.data['meeting_id'];
        if (meeting_id == null) {
            response.status(200).json(ERROR_FORM)
            return
        }
        Meeting.findByIdAndDelete(meeting_id, {}, (err, res) => {
            if (err == null) {
                response.status(200).json(DELETE_MEETING_SUCCESS_FORM)
            } else {
                response.status(200).json(ERROR_FORM);
            }
        })
    }

    private sendMessageToTargetMembers(token: string, members: Array<string>, meetingId: any) {
        members.forEach((uid) => {
            this.bearyChatHelper.getVidByMemberId(token, uid)
                .then(vid => {
                    this.bearyChatHelper.sendMessageToBearyChat(token, vid, "您有到一条会议消息请确认!", BEARYCHAT_RESULT_URL + `?meeting_id=${meetingId}`)
                })
                .then(() => {
                    return new MeetingReceipt({
                        meeting_id: meetingId,
                        uid: uid,
                        is_confirm: false
                    })
                        .save()
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

    private async notifyMeetingIsComing(meeting: Array<any>) {
        meeting.forEach(element => {
            if (element.is_notify == true) return
            let uids = (element.member_ids as string).split(',')
            Meeting.findByIdAndUpdate(element.id, {
                is_notify: true
            })
                .then(() => {
                    uids.forEach(uid => {
                        let vid = this.bearyChatHelper.getVidByMemberId(TOKEN, uid)
                        this.bearyChatHelper.getVidByMemberId(TOKEN, uid)
                            .then(vid => {
                                this.bearyChatHelper.sendMessageToBearyChat(TOKEN, vid, `您有一条会议即将在**${convertDateToString(element.start_date)}**开始，主题是**${element.topic}**,与会成员有${element.member_names}`)
                            })
                            .then(() => {
                                Meeting.findByIdAndUpdate(element.id, {
                                    is_notify: true
                                })
                            })
                    })
                })
        })
    }
}
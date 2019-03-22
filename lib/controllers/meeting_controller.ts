import { Request, Response, response } from 'express';
import { Form } from '../models/base/action';
import { BearyChatHelper } from '../utils/bearychat_helper';
import { BEARYCHAT_INIT_URL, ActionType, HUBOT_TOKEN } from '../utils/constants';
import { INIT_STATE_FORM, ERROR_FORM, generateMeetingResultForm, generateCreateSuccessForm, generateDeleteMeetingForm, generateManageMeetingForm, convertDateToString, DELETE_MEETING_SUCCESS_FORM, ERROR_PARAMS_FORM, MEETING_WAS_DELETED, CHOOSE_MEETING_TARGET_TYPE, generateCreateMeetingForm } from '../utils/formUtils';
import { AVMeetingDataHelper } from '../models/data/av_meeting_data_helper';
import { MongoMeetingDataHelper } from '../models/data/mongo_meeting_data_helper';
import { isLeanCloudMode } from '../utils/constants';

const TOKEN = HUBOT_TOKEN

export class MeetingController {

    bearyChatHelper: BearyChatHelper = new BearyChatHelper();
    meetingDataHelper: BaseMeetingInterface

    constructor() {
        if (isLeanCloudMode) {
            this.meetingDataHelper = new AVMeetingDataHelper()
        } else {
            this.meetingDataHelper = new MongoMeetingDataHelper()
        }
        this.meetingNotifyLoop();
    }

    private meetingNotifyLoop() {
        setInterval(async () => {
            let meetings = await this.meetingDataHelper.queryNeedNotifyMeeting()
            this.notifyMeetingIsComing(meetings);
        }, 5 * 60 * 1000);
    }

    handleGetInitMeetingFormData(req: Request, res: Response): void {
        this.sendForm(INIT_STATE_FORM, res)
    }

    handleDynamicMeetingData(req: Request, res: Response): void {
        const action: string = req.body['action']
        switch (action) {
            case ActionType.CREATE: {
                this.sendForm(CHOOSE_MEETING_TARGET_TYPE, res);
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
            case ActionType.CHOOSE_MEETING_TARGET_TYPE: {
                this.handleChooseMeetingType(req, res);
                break;
            }
            case ActionType.DELETE_MEETING: {
                this.deleteMeetingFromRequest(req, res);
                break
            }
            case ActionType.CONFIRM_MEETINT_RECEIPT: {
                this.handleShowMeetingResult(req, res)
                break;
            }
            default: {
                this.sendForm(ERROR_FORM, res);
                break
            }
        }
    }

    handleBearyChatWebHook(req: Request, res: Response): void {
        const vchannel: string = req.body['vchannel']
        const token: string = req.body['token']
        this.bearyChatHelper.sendMessageToBearyChat(token, vchannel,
            '欢迎使用会议助手小机器人!', BEARYCHAT_INIT_URL, INIT_STATE_FORM)
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

    handleShowMeetingResult(req: Request, res: Response): any {
        const meetingId = req.body.data['meeting_id'];
        const uid = req.query['user_id'];
        let topic = ""
        this.meetingDataHelper.updateMemberReceiptConfirm(meetingId)
            .then(() => {
                return this.meetingDataHelper.queryMeetingById(meetingId)
            })
            .then(value => {
                const form = generateMeetingResultForm(value, true)
                res.status(200).json(form)
                let uid = value.get('uid')
                topic = value.get('topic')
                return this.bearyChatHelper.getVidByMemberId(TOKEN, uid)
            })
            .then(vid => {
                this.bearyChatHelper.getMemberNameByUid(TOKEN, uid)
                    .then(name => {
                        this.bearyChatHelper.sendMessageToBearyChat(TOKEN, vid, `**${name}**已确定参加会议:${topic}`)
                    })
            })
            .catch(err => {
                res.status(200).json(MEETING_WAS_DELETED)
                console.log(`can not show result:${err}`);
            })
    }

    private handleChooseMeetingType(req: Request, res: Response) {
        const type = req.body.data['target_type']
        const isChannel = type == "channel"
        res.status(200).json(generateCreateMeetingForm(isChannel))
    }

    private handleDeleteMeetingFormRequest(req: Request, res: Response) {
        const uid: string = req.query['user_id'];
        const teamId: string = req.query['team_id']
        this.meetingDataHelper.queryDeletableMeeting(teamId, uid)
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
        const teamId: string = req.query['team_id']
        this.meetingDataHelper.queryManageMeeting(teamId, uid)
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
        const extra: string = request.body.data['extra']
        const members: Array<string> = request.body.data['members']
        const channels: Array<string> = request.body.data['channels']


        const lackTargetType = members == null && channels == null

        if (topic == null || location == null || date == null || lackTargetType) {
            response.status(200).json(ERROR_PARAMS_FORM)
            return
        }
        if (members != null) {
            this.createMeetingByMembers(members, user_id, location, topic, date, team_id, token, extra, response);
        } else {
            this.createMeetingByChannel(channels, location, topic, date, user_id, team_id, token, extra, response);
        }
    }

    private createMeetingByChannel(channels: string[], location: string, topic: string, date: string, user_id: string, team_id: string, token: string, extra: string, response: Response) {
        const vid = channels[0];
        let meetingData = {
            location: location,
            topic: topic,
            vid: channels[0],
            startDate: date,
            uid: user_id,
            teamId: team_id,
            extra: extra
        };
        this.bearyChatHelper.getMemberNameByUid(token, user_id)
            .then(creator => {
                meetingData['userName'] = creator;
                return this.bearyChatHelper.getChannelInfoByVid(token, vid);
            })
            .then(info => {
                let members = info['member_uids'] as Array<string>
                let name = info['name']
                meetingData['memberIds'] = members;
                meetingData['channelName'] = name
                return meetingData;
            })
            .then(data => {
                return this.meetingDataHelper.saveMeeting(data)
            })
            .then((value) => {
                const meetingId = value.id;
                console.log(`save a new meeting ${meetingId}`);
                this.sendMessageToTargetChannel(token, vid, value);
                response.status(200).json(generateCreateSuccessForm(value));
            })
            .catch((reason) => {
                console.log(`save meeting error:${reason}`);
                response.status(200).json(ERROR_FORM);
            });
    }

    private createMeetingByMembers(members: string[], user_id: string, location: string, topic: string, date: string, team_id: string, token: string, extra: string, response: Response) {
        if (members.find(id => id == user_id) == null) {
            members.push(user_id);
        }
        let meetingData = {
            location: location,
            topic: topic,
            memberIds: members,
            startDate: date,
            uid: user_id,
            extra: extra,
            teamId: team_id,
        };
        this.bearyChatHelper.getMemberNameByUid(token, user_id)
            .then(creator => {
                meetingData['userName'] = creator;
                return this.bearyChatHelper.getMemberNamesByUids(token, members);
            })
            .then(names => {
                meetingData['memberNames'] = names;
                return meetingData;
            })
            .then(data => {
                return this.meetingDataHelper.saveMeeting(data)
            })
            .then((value) => {
                const meetingId = value.id;
                console.log(`save a new meeting ${meetingId}`);
                this.sendMessageToTargetMembers(token, members, value);
                response.status(200).json(generateCreateSuccessForm(value));
            })
            .catch((reason) => {
                console.log(`save meeting error:${reason}`);
                response.status(200).json(ERROR_FORM);
            });
    }

    private deleteMeetingFromRequest(request: Request, response: Response) {
        const meetingId: string = request.body.data['meeting_id'];
        if (meetingId == null) {
            response.status(200).json(ERROR_FORM)
            return
        }
        this.meetingDataHelper.deleteMeetingById(meetingId)
            .then(success => {
                response.status(200).json(DELETE_MEETING_SUCCESS_FORM)
            }, error => {
                response.status(200).json(ERROR_FORM);
            })
    }

    private sendMessageToTargetChannel(token: string, vid: string, meeting: any) {
        let userName = meeting.get('userName')
        let topic = meeting.get('topic')
        let location = meeting.get('location')
        let date = meeting.get('startDate')
        this.bearyChatHelper.sendMessageToBearyChat(token, vid, `@<-channel-> 大叫好，${userName}发起了一场会议.请大家知晓!\n - 主题:${topic} \n - 地点:${location} \n - 时间:${convertDateToString(date)}`)
    }

    private sendMessageToTargetMembers(token: string, members: Array<string>, meeting: any) {
        const meetingId = meeting.id
        members.forEach((uid) => {
            this.meetingDataHelper.saveMemberReceipt(uid, meetingId)
                .then(() => {
                    return this.bearyChatHelper.getVidByMemberId(token, uid)
                })
                .then(vid => {
                    const form = generateMeetingResultForm(meeting, false)
                    this.bearyChatHelper.sendMessageToBearyChat(token, vid, "您有到一条会议消息请确认!", BEARYCHAT_INIT_URL, form)
                })
                .then(receipt => {
                    console.log(`create meeting receipt: ${(receipt as any).uid}`)
                })
                .catch(err => {
                    console.log(`can not send message to: ${uid}`);
                })
        })
    }

    private sendForm(form: Form, response: Response) {
        response.status(200).json(form)
    }

    private notifyMeetingIsComing(meeting: Array<any>) {
        meeting.forEach(element => {
            if (element.get('hadNotify') == true) return
            let vid = element.get('vid') as string
            if (vid != null) {
                let topic = element.get('topic')
                let location = element.get('location')
                let date = element.get('startDate')
                this.bearyChatHelper.sendMessageToBearyChat(TOKEN, vid, `@<-channel -> 大叫好，有一场会议即将在 ** ${convertDateToString(date)}** 开始 \n - 主题: ${topic} \n - 地点: ${location} `)
                    .then(success => {
                        this.meetingDataHelper.updateMeetingConfirm(element.id)
                    }, onError => {
                        console.log(`can not notify${onError} `);
                    })
                return
            }

            let uids = element.get('memberIds') as Array<string>
            uids.forEach(uid => {
                this.bearyChatHelper.getVidByMemberId(TOKEN, uid)
                    .then(vid => {
                        const date = element.get('startDate')
                        const topic = element.get('topic')
                        const names = element.get('memberNames')
                        this.bearyChatHelper.sendMessageToBearyChat(TOKEN, vid, `您有一场会议即将在 ** ${convertDateToString(date)}** 开始 \n - 主题: ** ${topic}** \n - 与会成员: ** ${names}** `)
                    })
                    .then(success => {
                        this.meetingDataHelper.updateMeetingConfirm(element.id)
                    }, onError => {
                        console.log(`can not notify${onError} `);
                    })

            })
        })
    }
}
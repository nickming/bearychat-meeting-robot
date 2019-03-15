import { Form, Submit, Input, DateSelect, MemberSelct, Element, Section, Context, Select, SelectOption, ChannelSelect } from "../models/base/action";
import { ActionType } from "./constants";

export const generateMeetingResultForm = (meeting: any, hadConfirm: boolean): Form => {
    const location: string = meeting.get('location')
    const topic: string = meeting.get('topic')
    const startDate: number = meeting.get('startDate')
    const names: Array<string> = meeting.get('memberNames')
    const channelName: string = meeting.get('channelName')
    const extra: string = meeting.get('extra')
    const form = new Form([
        new Section(`- 主题: ${topic}`),
        new Section(`- 地点: ${location}`),
        new Section(`- 时间: ${convertDateToString(startDate)}`),
    ])
    if (names != null) {
        form.actions.push(new Section(`- 成员: ${names}`))
    }
    if (channelName != null) {
        form.actions.push(new Section(`- 与会讨论组: ${channelName}`))
    }
    if (extra != null) {
        form.actions.push(new Section(`- 备注信息: ${extra}`))
    }
    form.actions.push(new Section(`***`))
    if (hadConfirm) return form;
    form.actions.push(new Submit(ActionType.CONFIRM_MEETINT_RECEIPT, '确认参加会议', 'primary'))
    return form;
}

export const generateCreateSuccessForm = (meeting: any): Form => {
    const location: string = meeting.get('location')
    const topic: string = meeting.get('topic')
    const startDate: number = meeting.get('startDate')
    const names: Array<string> = meeting.get('memberNames')
    const channelName: string = meeting.get('channelName')
    const extra: string = meeting.get('extra')
    let form = new Form([
        new Section(`- 主题: ${topic}`),
        new Section(`- 地点: ${location}`),
        new Section(`- 时间: ${convertDateToString(startDate)}`),
    ])
    if (names != null) {
        form.actions.push(new Section(`- 成员: ${names}`))
    }
    if (channelName != null) {
        form.actions.push(new Section(`- 与会讨论组: ${channelName}`))
    }
    if (extra != null) {
        form.actions.push(new Section(`- 备注信息: ${extra}`))
    }
    form.actions.push(new Section(`***`))
    form.actions.push(new Submit(ActionType.BACK, '完成', 'primary'))
    return form;
}

export const generateManageMeetingForm = (meetings: Array<any>): Form => {
    if (meetings.length == 0) return new Form([
        new Section('暂无会议预约记录'),
        new Submit(ActionType.BACK, '返回', 'primary')
    ])
    let form = new Form([new Section('**以下是已经预约的会议**')]);
    meetings.forEach(element => {
        const location: string = element.get('location')
        const topic: string = element.get('topic')
        const startDate: number = element.get('startDate')
        const names: Array<string> = element.get('memberNames')
        const channelName: string = element.get('channelName')
        const extra: string = element.get('extra')
        let now = new Date().getTime()
        if (now > startDate * 1000) {
            form.actions.push(new Section(`- **会议已过期**`))
        }
        form.actions.push(new Section(`- 主题: ${topic}`))
        form.actions.push(new Section(`- 地点: ${location}`))
        form.actions.push(new Section(`- 时间: ${convertDateToString(startDate)}`))
        if (names != null) {
            form.actions.push(new Section(`- 成员: ${names}`))
        }
        if (channelName != null) {
            form.actions.push(new Section(`- 与会讨论组: ${channelName}`))
        }
        form.actions.push(new Section(`***`))
    });
    form.actions.push(new Submit(ActionType.BACK, '返回', 'primary'))
    return form;
}


export const generateDeleteMeetingForm = (meetings: Array<any>): Form => {
    if (meetings.length == 0) return new Form([
        new Section('暂无会议预约记录'),
        new Submit(ActionType.BACK, '返回', 'primary')
    ])

    let form = new Form([new Section('**选择要取消的会议**')]);
    let options = meetings.map(element => {
        const topic: string = element.get('topic');
        const id: string = element.id;
        return new SelectOption(topic, id);
    });
    form.actions.push(new Select('meeting_id', false, options, '根据主题选择会议', '选择要取消的会议'))
    form.actions.push(new Submit(ActionType.DELETE_MEETING, '确认', 'primary'))
    form.actions.push(new Submit(ActionType.BACK, '取消', 'primary'))
    return form;
}

export const generateCreateMeetingForm = (isChannel: boolean): Form => {
    let form = new Form([
        new Section('请完善下列信息完成会议的创建'),
        new Input('topic', '会议主题', '请输入会议主题'),
        new Input('location', '会议地点', '请输入会议地点'),
        new DateSelect('date', '选择会议开始时间'),
    ])
    if (isChannel) {
        form.actions.push(new ChannelSelect('channels', false, '请选择与会讨论组'))
    } else {
        form.actions.push(new MemberSelct('members', true, '选择与会成员'))
    }
    form.actions.push(new Input('extra', '备注', '会议备注信息(可不填)'))
    form.actions.push(new Submit(ActionType.CREATE_MEETING, '确认', 'primary'))
    form.actions.push(new Submit(ActionType.BACK, '返回', 'primary'))
    return form
}

export const CHOOSE_MEETING_TARGET_TYPE = new Form([
    new Section('请选择是会议参与范围'),
    new Select('target_type', false, [
        new SelectOption('讨论组', 'channel'),
        new SelectOption('成员', 'member')
    ]),
    new Submit(ActionType.CHOOSE_MEETING_TARGET_TYPE, '确认', 'primary'),
    new Submit(ActionType.BACK, '取消', 'primary')
])

export const INIT_STATE_FORM = new Form([
    new Section('我是会议小助手机器人，您可以用我来进行会议预约和管理。☺️'),
    new Submit(ActionType.CREATE, '预约会议', 'primary'),
    new Submit(ActionType.MANAGE, '查看会议', 'primary'),
    new Submit(ActionType.DELETE, '删除会议', 'primary'),
]);

export const MEETING_WAS_DELETED = new Form([
    new Section('该会议已被取消!')
])

export const CREATE_MEETING_SUCCESS_FORM = new Form([
    new Section('创建会议成功:'),
    new Submit(ActionType.BACK, '确定', 'primary')
])

export const DELETE_MEETING_SUCCESS_FORM = new Form([
    new Section('删除成功:'),
    new Submit(ActionType.BACK, '确定', 'primary')
])

export const ERROR_FORM = new Form([
    new Section('机器人出错!'),
    new Submit(ActionType.BACK, '返回', 'primary')
])

export const ERROR_PARAMS_FORM = new Form([
    new Section('请填写正确参数!'),
    new Submit(ActionType.BACK, '返回', 'primary')
])

export const convertDateToString = (ts: number) => {
    let date = new Date(ts * 1000);
    let year = date.getUTCFullYear();
    let month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
    let day = (date.getDate() < 10 ? '0' : '') + date.getDate();
    let hour = (date.getHours() < 10 ? '0' : '') + date.getHours();
    let mins = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();

    return `${year}-${month}-${day} ${hour}:${mins}`;
}
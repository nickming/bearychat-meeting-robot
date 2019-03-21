
export enum ActionType {
    CREATE = 'action.create',
    MANAGE = 'action.manage',
    DELETE = 'acton.delete',
    BACK = 'action.back',

    CREATE_MEETING = 'action_create_meeting',
    CHOOSE_MEETING_TARGET_TYPE = 'action_choose_meeting_type',
    DELETE_MEETING = 'action_delete_meeting',
    CONFIRM_MEETINT_RECEIPT = 'action_confirm_receipt'
}

export const isLeanCloudMode = true

const BASE_SNITCH_URL = 'https://api.bearychat.com/v1'

const SERVER_DOMAIN_URL = "http://meeting.applet.bearychat.com"

export const HUBOT_TOKEN = "f78605ed5e301a76732e2de2cb2cbfa6"

export const BEARYCHAT_MESSAGE_CREATE_URL = BASE_SNITCH_URL + '/message.create';

export const BEARYCHAT_P2P_CREATE_URL = BASE_SNITCH_URL + '/p2p.create'

export const BEARYCHAT_USER_INFO_URL = BASE_SNITCH_URL + '/user.info'

export const BEARYCHAT_CHANNEL_INFO_URL = BASE_SNITCH_URL + '/channel.info'

export const BEARYCHAT_INIT_URL = SERVER_DOMAIN_URL + '/api/meeting';

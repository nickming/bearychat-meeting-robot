
export enum ActionType {
    CREATE = 'action.create',
    MANAGE = 'action.manage',
    DELETE = 'acton.delete',
    BACK = 'action.back',

    CREATE_MEETING = 'action_create_meeting',
    DELETE_MEETING = 'action_delete_meeting',
    CONFIRM_MEETINT_RECEIPT = 'action_confirm_receipt'
}

export const BEARYCHAT_MESSAGE_CREATE_URL = 'http://api.stage.bearychat.com/v1/message.create';

export const BEARYCHAT_P2P_CREATE_URL = 'http://api.stage.bearychat.com/v1/p2p.create'

export const BEARYCHAT_USER_INFO_URL = 'http://api.stage.bearychat.com/v1/user.info'

export const BEARYCHAT_INIT_URL = 'http://chaojidiao.stage.bearychat.com:8004/api/meeting';

export const BEARYCHAT_RESULT_URL = 'http://chaojidiao.stage.bearychat.com:8004/api/meeting/result';

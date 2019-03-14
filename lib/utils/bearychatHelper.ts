import axios, { AxiosPromise } from 'axios';
import { Request, Response } from 'express';
import { BEARYCHAT_MESSAGE_CREATE_URL, BEARYCHAT_P2P_CREATE_URL, BEARYCHAT_USER_INFO_URL } from './constants';

export class BearyChatHelper {
    async getVidByMemberId(token: string, uid: string) {
        return axios.post(BEARYCHAT_P2P_CREATE_URL, {
            token: token,
            user_id: uid
        }).then(res => {
            return res.data['vchannel_id'] as string
        })
    }

    async sendMessageToBearyChat(token: string, vchannelId: string, text: string, formUrl?: string) {
        return await axios.post(BEARYCHAT_MESSAGE_CREATE_URL, {
            token: token,
            vchannel_id: vchannelId,
            text: text,
            form_url: formUrl
        })
    }

    async getMemberNameByUid(token: string, uid: string) {
        return await axios.get(BEARYCHAT_USER_INFO_URL, {
            params: {
                user_id: uid,
                token: token
            }
        })
            .then(res => {
                return res.data['name'] || res['full_name']
            });
    }

    async getMemberNamesByUids(token: string, uids: Array<string>) {
        return uids.map(async uid => {
            return await this.getMemberNameByUid(token, uid)
        })
    }
}
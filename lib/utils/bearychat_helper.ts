import axios, { AxiosPromise } from 'axios';
import { Request, Response } from 'express';
import { BEARYCHAT_MESSAGE_CREATE_URL, BEARYCHAT_P2P_CREATE_URL, BEARYCHAT_USER_INFO_URL, BEARYCHAT_CHANNEL_INFO_URL } from './constants';

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
                return res.data['name'] as string
            });
    }

    async getChannelInfoByVid(token: string, vid: string) {
        return await axios.get(BEARYCHAT_CHANNEL_INFO_URL, {
            params: {
                token: token,
                channel_id: vid
            }
        })
            .then(res => {
                return res.data
            })
    }

    async getMemberNamesByUids(token: string, uids: Array<string>): Promise<Array<string>> {
        const names = new Array<string>();
        return new Promise((resolve, reject) => {
            uids.forEach(async (uid, index) => {
                let name = await this.getMemberNameByUid(token, uid)
                names.push(name)
                if (index == uids.length - 1) {
                    resolve(names)
                }
            })
        })
    }


}
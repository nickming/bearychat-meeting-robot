import axios, { AxiosPromise } from 'axios';
import { Request, Response } from 'express';
import { BEARYCHAT_MESSAGE_CREATE_URL, BEARYCHAT_P2P_CREATE_URL, BEARYCHAT_USER_INFO_URL } from './constants';

export class BearyChatHelper {

    getVidByMemberId(token: string, uid: string): Promise<string> {
        return axios.post(BEARYCHAT_P2P_CREATE_URL, {
            token: token,
            user_id: uid
        })
            .then(res => {
                return res.data['vchannel_id']
            })
    }

    sendMessageToBearyChat(token: string, vchannelId: string, text: string, formUrl?: string): Promise<any> {
        return axios.post(BEARYCHAT_MESSAGE_CREATE_URL, {
            token: token,
            vchannel_id: vchannelId,
            text: text,
            form_url: formUrl
        })
    }

    getMemberNameByUid(token: string, uid: string): Promise<string> {
        return axios.get(BEARYCHAT_USER_INFO_URL, {
            params: {
                user_id: uid,
                token: token
            }
        })
            .then(res => {
                return res.data['name'] || res['full_name']
            });
    }

    getMemberNamesByUids(token: string, uids: Array<string>): Promise<Array<string>> {
        return new Promise<Array<string>>((resolve, reject) => {
            let names = new Array<string>()
            uids.forEach(id => {
                this.getMemberNameByUid(token, id)
                    .then(name => {
                        names.push(name);
                        if (names.length == uids.length) {
                            resolve(names)
                        }
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
        })
    }
}
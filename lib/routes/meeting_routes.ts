import * as express from "express";
import { Request, Response } from 'express';
import { MeetingController } from '../controllers/meeting_controller';

export class MeetingRoutes {
    meetingController: MeetingController = new MeetingController();

    routes(app: express.Application) {
        app.route('/')
            .get((req: Request, res: Response) => {
                res.status(200).send({
                    message: 'welcome to meeting robot home page!'
                })
            });

        app.route('/api/meeting/bearychat')
            .post((req, res) => {
                this.meetingController.handleBearyChatWebHook(req, res);
            });

        app.route('/api/meeting')
            .post((req, res) => {
                this.meetingController.handleDynamicMeetingData(req, res);
            })
    }
}
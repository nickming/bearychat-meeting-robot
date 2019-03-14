import * as express from "express";
import * as bodyParser from "body-parser";
import { MeetingRoutes } from "./routes/meeting_routes";
import * as AV from 'leancloud-storage';

class App {

    public app: express.Application = express();
    public routePrv: MeetingRoutes = new MeetingRoutes();


    constructor() {
        this.config();
        this.initLeanCloud()
        this.routePrv.routes(this.app);
    }

    private config() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(express.static('public'));
    }

    private initLeanCloud() {
        AV.init({
            appId: 'fHiwXWjTWk97Qln9rulQ5Tq6-gzGzoHsz',
            appKey: '2dyfpVBsqOH3K3l9KzVDQe7i'
        })
    }

}

export default new App().app;
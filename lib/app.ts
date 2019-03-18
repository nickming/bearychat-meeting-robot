import * as express from "express";
import * as bodyParser from "body-parser";
import { MeetingRoutes } from "./routes/meeting_routes";
import * as AV from 'leancloud-storage';
import * as mongoose from "mongoose";
import { isLeanCloudMode } from "utils/constants";

class App {

    public app: express.Application = express();
    public routePrv: MeetingRoutes = new MeetingRoutes();
    public mongoUrl: string = 'mongodb://localhost:27017/RobotDb';


    constructor() {
        this.config();
        if (isLeanCloudMode) {
            this.initLeanCloud()
        } else {
            this.mongoSetup()
        }
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

    private mongoSetup(): void {
        mongoose.connect(this.mongoUrl, { useNewUrlParser: true }, (err) => {
            if (err == null) {
                console.log('connect to mongodb!')
            } else {
                console.log(`can't connect mongodb ${err}`);
            }
        });
    }

}

export default new App().app;
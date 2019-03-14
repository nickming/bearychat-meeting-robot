import * as express from "express";
import * as bodyParser from "body-parser";
import { MeetingRoutes } from "./routes/meetingRoutes";
import * as mongoose from "mongoose";

class App {

    public app: express.Application = express();
    public routePrv: MeetingRoutes = new MeetingRoutes();
    public mongoUrl: string = 'mongodb://localhost/RobotDb';


    constructor() {
        this.config();
        this.mongoSetup();
        this.routePrv.routes(this.app);
    }

    private config(): void {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        // serving static files 
        this.app.use(express.static('public'));
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
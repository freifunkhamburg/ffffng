import "./init"
import { config } from "./config"
import Logger from "./logger"
import db from "./db/database"
import scheduler from "./jobs/scheduler"
import { init as initRouter } from "./router"
import app from "./app"

Logger.tag('main', 'startup').info('Server starting up...');

db.init()
.then(() => {
    Logger.tag('main').info('Initializing...');

    scheduler.init();
    initRouter();

    app.listen(config.server.port, '::');
})
.catch(error => {
    console.error('Could not init database: ', error);
    process.exit(1);
});

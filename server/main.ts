import "./init"
import {config} from "./config"
import Logger from "./logger"
import * as db from "./db/database"
import * as scheduler from "./jobs/scheduler"
import * as router from "./router"
import * as app from "./app"

app.init();
Logger.init(config.server.logging.enabled);
Logger.tag('main', 'startup').info('Server starting up...');

async function main() {
    Logger.tag('main').info('Initializing...');

    await db.init();
    scheduler.init();

    router.init();

    app.app.listen(config.server.port, '::');
}

main()
    .catch(error => {
        console.error('Unhandled runtime error:', error);
        process.exit(1);
    });

import * as MonitoringService from "../services/monitoringService";
import { jobResultOkay } from "./scheduler";

export default {
    name: "MonitoringMailsSendingJob",
    description:
        "Sends monitoring emails depending on the monitoring state of nodes retrieved by the NodeInformationRetrievalJob.",

    async run() {
        await MonitoringService.sendMonitoringMails();
        return jobResultOkay();
    },
};

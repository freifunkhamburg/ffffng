import * as MonitoringService from "../services/monitoringService";

export default {
    name: 'MonitoringMailsSendingJob',
    description: 'Sends monitoring emails depending on the monitoring state of nodes retrieved by the NodeInformationRetrievalJob.',

    run: MonitoringService.sendMonitoringMails,
};

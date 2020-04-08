import Logger from "../logger";
import MonitoringService from "../services/monitoringService";

export default {
    name: 'MonitoringMailsSendingJob',
    description: 'Sends monitoring emails depending on the monitoring state of nodes retrieved by the NodeInformationRetrievalJob.',

    run: (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            MonitoringService.sendMonitoringMails((err: any): void => {
                if (err) {
                    Logger.tag('monitoring', 'mail-sending').error('Error sending monitoring mails:', err);
                    return reject(err);
                }

                resolve();
            });
        });
    }
};

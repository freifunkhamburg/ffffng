import Logger from "../logger";
import MonitoringService from "../services/monitoringService";

export default {
    name: 'NodeInformationRetrievalJob',
    description: 'Fetches the nodes.json and calculates and stores the monitoring / online status for registered nodes.',

    run: (): Promise<void> => {
        return new Promise<void>(
            (resolve, reject) => {
                MonitoringService.retrieveNodeInformation((err: any): void => {
                    if (err) {
                        Logger.tag('monitoring', 'information-retrieval').error('Error retrieving node data:', err);
                        return reject(err);
                    }

                    resolve();
                });
            }
        );
    }
};

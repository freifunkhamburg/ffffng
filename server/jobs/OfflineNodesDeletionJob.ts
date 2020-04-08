import MonitoringService from "../services/monitoringService";
import Logger from "../logger";

export default {
    name: 'OfflineNodesDeletionJob',
    description: 'Delete nodes that are offline for more than 100 days.',

    run: (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            MonitoringService.deleteOfflineNodes((err: any): void => {
                if (err) {
                    Logger.tag('nodes', 'delete-offline').error('Error deleting offline nodes:', err);
                    return reject(err);
                }

                resolve();
            });
        });
    }
};

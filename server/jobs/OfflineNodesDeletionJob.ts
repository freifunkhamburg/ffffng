import * as MonitoringService from "../services/monitoringService";

export default {
    name: 'OfflineNodesDeletionJob',
    description: 'Delete nodes that are offline for more than 100 days.',

    run: MonitoringService.deleteOfflineNodes,
};

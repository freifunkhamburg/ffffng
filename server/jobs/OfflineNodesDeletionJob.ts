import * as MonitoringService from "../services/monitoringService";
import { jobResultOkay } from "./scheduler";

export default {
    name: "OfflineNodesDeletionJob",
    description: "Delete nodes that are offline for more than 100 days.",

    async run() {
        await MonitoringService.deleteOfflineNodes();
        return jobResultOkay();
    },
};

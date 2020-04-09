import * as MonitoringService from "../services/monitoringService";

export default {
    name: 'NodeInformationRetrievalJob',
    description: 'Fetches the nodes.json and calculates and stores the monitoring / online status for registered nodes.',

    run: MonitoringService.retrieveNodeInformation,
};

import * as MonitoringService from "../services/monitoringService";
import {jobResultOkay, jobResultWarning} from "./scheduler";

export default {
    name: 'NodeInformationRetrievalJob',
    description: 'Fetches the nodes.json and calculates and stores the monitoring / online status for registered nodes.',

    async run () {
        const result = await MonitoringService.retrieveNodeInformation();
        if (result.failedParsingNodesCount > 0) {
            return jobResultWarning(
                `Warning: ${result.failedParsingNodesCount} of ${result.totalNodesCount} nodes could not be processed.`
            );
        } else {
            return jobResultOkay(
                `${result.totalNodesCount} nodes have been processed.`
            );
        }
    },
};

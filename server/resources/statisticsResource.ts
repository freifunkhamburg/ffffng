import ErrorTypes from "../utils/errorTypes";
import Logger from "../logger";
import { getNodeStatistics } from "../services/nodeService";
import { handleJSON } from "../utils/resources";

export const get = handleJSON(async () => {
    try {
        const nodeStatistics = await getNodeStatistics();
        return {
            nodes: nodeStatistics,
        };
    } catch (error) {
        Logger.tag("statistics").error("Error getting statistics:", error);
        throw { data: "Internal error.", type: ErrorTypes.internalError };
    }
});

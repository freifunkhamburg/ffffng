import { handleJSON } from "../utils/resources";
import { version } from "../config";

export const get = handleJSON(async () => ({
    version,
}));

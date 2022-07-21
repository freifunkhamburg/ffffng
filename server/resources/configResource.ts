import {handleJSON} from "../utils/resources";
import {config} from "../config";

export const get = handleJSON(async () => config.client);

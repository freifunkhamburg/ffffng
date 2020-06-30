import {fixNodeFilenames} from "../services/nodeService";
import {jobResultOkay} from "./scheduler";

export default {
    name: 'FixNodeFilenamesJob',
    description: 'Makes sure node files (holding fastd key, name, etc.) are correctly named.',

    async run() {
        await fixNodeFilenames();
        return jobResultOkay();
    },
}

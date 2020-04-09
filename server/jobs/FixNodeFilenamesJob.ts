import {fixNodeFilenames} from "../services/nodeService";

export default {
    name: 'FixNodeFilenamesJob',
    description: 'Makes sure node files (holding fastd key, name, etc.) are correctly named.',

    run: fixNodeFilenames
}

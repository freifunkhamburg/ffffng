import Logger from "../logger";
import NodeService from "../services/nodeService";

export default {
    name: 'FixNodeFilenamesJob',
    description: 'Makes sure node files (holding fastd key, name, etc.) are correctly named.',

    run: (): Promise<void> => {
        return new Promise<void>(
            (resolve, reject) => {
                NodeService.fixNodeFilenames((err: any): void => {
                    if (err) {
                        Logger.tag('nodes', 'fix-filenames').error('Error fixing filenames:', err);
                        return reject(err);
                    }

                    resolve();
                });
            }
        );
    }
}

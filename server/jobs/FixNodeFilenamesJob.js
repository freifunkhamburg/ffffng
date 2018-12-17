'use strict';

const Logger = require('../logger')
const NodeService = require('../services/nodeService')

module.exports = {
    description: 'Makes sure node files (holding fastd key, name, etc.) are correctly named.',

    run: function (callback) {
        NodeService.fixNodeFilenames(function (err) {
            if (err) {
                Logger.tag('nodes', 'fix-filenames').error('Error fixing filenames:', err);
            }

            callback();
        });
    }
}

'use strict';

const fs = require('graceful-fs')

const ErrorTypes = require('../utils/errorTypes')
const Logger = require('../logger')
const Resources = require('../utils/resources')

const indexHtml = __dirname + '/../../client/index.html';

module.exports = {
    render (req, res) {
        const data = Resources.getData(req);

        fs.readFile(indexHtml, 'utf8', function (err, body) {
            if (err) {
                Logger.tag('frontend').error('Could not read file: ', indexHtml, err);
                return Resources.error(res, {data: 'Internal error.', type: ErrorTypes.internalError});
            }

            return Resources.successHtml(
                res,
                body.replace(
                    /<body/,
                    '<script>window.__nodeToken = \''+ data.token + '\';</script><body'
                )
            );
        });
    }
}

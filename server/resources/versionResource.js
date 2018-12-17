'use strict';

const Resources = require('../utils/resources')
const version = require('../config').version

module.exports = {
    get (req, res) {
        return Resources.success(
            res,
            {
                version
            }
        );
    }
}

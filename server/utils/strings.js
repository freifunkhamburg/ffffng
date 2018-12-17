'use strict';

const _ = require('lodash')

module.exports = {
    normalizeString (str) {
        return _.isString(str) ? str.trim().replace(/\s+/g, ' ') : str;
    },

    normalizeMac (mac) {
        // parts only contains values at odd indexes
        const parts = mac.toUpperCase().replace(/:/g, '').split(/([A-F0-9]{2})/);

        const macParts = [];

        for (let i = 1; i < parts.length; i += 2) {
            macParts.push(parts[i]);
        }

        return macParts.join(':');
    },

    parseInt (str) {
        const parsed = _.parseInt(str, 10);
        return parsed.toString() === str ? parsed : undefined;
    }
}

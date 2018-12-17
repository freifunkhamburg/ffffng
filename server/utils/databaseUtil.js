'use strict';

const _ = require('lodash')

module.exports = {
    inCondition (field, list) {
        return {
            query: '(' + field + ' IN (' + _.join(_.times(list.length, _.constant('?')), ', ') + '))',
            params: list
        }
    }
}

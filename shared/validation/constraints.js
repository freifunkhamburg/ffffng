'use strict';

angular.module('ffffng').constant('Constraints',  {
    id:{
        type: 'string',
        regex: /^[1-9][0-9]*/,
        optional: false
    },
    token:{
        type: 'string',
        regex: /^[0-9a-f]{16}$/i,
        optional: false
    },
    node: {
        hostname: {
            type: 'string',
            regex: /^[-a-z0-9_]{1,32}$/i,
            optional: false
        },
        key: {
            type: 'string',
            regex: /^([a-f0-9]{64})$/i,
            optional: true
        },
        email: {
            type: 'string',
            regex: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
            optional: false
        },
        nickname: {
            type: 'string',
            regex: /^[-a-z0-9_ äöüß]{1,64}$/i,
            optional: false
        },
        mac: {
            type: 'string',
            regex: /^([a-f0-9]{12}|([a-f0-9]{2}:){5}[a-f0-9]{2})$/i,
            optional: false
        },
        coords: {
            type: 'string',
            regex: /^(-?[0-9]{1,3}(\.[0-9]{1,15})? -?[0-9]{1,3}(\.[0-9]{1,15})?)$/,
            optional: true
        },
        monitoring: {
            type: 'boolean',
            optional: false
        }
    },
    rest: {
        list: {
            _page: {
                type: 'number',
                min: 1,
                optional: true,
                default: 1
            },
            _perPage: {
                type: 'number',
                min: 1,
                max: 50,
                optional: true,
                default: 20
            }
        }
    }
});

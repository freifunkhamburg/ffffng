'use strict';

angular.module('ffffng').factory('Constraints', function () {
    return {
        id:{
            regex: /^[1-9][0-9]*/,
            optional: false
        },
        token:{
            regex: /^[0-9a-f]{16}$/i,
            optional: false
        },
        node: {
            hostname: {
                regex: /^[-a-z0-9_]{1,32}$/i,
                optional: false
            },
            key: {
                regex: /^([a-f0-9]{64})$/i,
                optional: true
            },
            email: {
                regex: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
                optional: false
            },
            nickname: {
                regex: /^[-a-z0-9_ äöüß]{1,64}$/i,
                optional: false
            },
            mac: {
                regex: /^([a-f0-9]{12}|([a-f0-9]{2}:){5}[a-f0-9]{2})$/i,
                optional: false
            },
            coords: {
                regex: /^(-?[0-9]{1,3}(\.[0-9]{1,15})? -?[0-9]{1,3}(\.[0-9]{1,15})?)$/,
                optional: true
            }
        }
    };
});

'use strict';

angular.module('ffffng').factory('Constraints', function () {
    return {
        token:{
            regex: /^[0-9a-fA-F]{16}$/,
            optional: false
        },
        node: {
            hostname: {
                regex: /^[-a-zA-Z0-9_]{1,32}$/,
                optional: false
            },
            key: {
                regex: /^([a-fA-F0-9]{64})$/,
                optional: true
            },
            email: {
                regex: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
                optional: false
            },
            nickname: {
                regex: /^[-a-zA-Z0-9_ äöüÄÖÜß]{1,64}$/,
                optional: false
            },
            mac: {
                regex: /^([a-fA-F0-9]{12}|([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2})$/,
                optional: false
            },
            coords: {
                regex: /^(-?[0-9]{1,3}(\.[0-9]{1,15})? -?[0-9]{1,3}(\.[0-9]{1,15})?)$/,
                optional: true
            }
        }
    };
});

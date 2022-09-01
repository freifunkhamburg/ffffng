"use strict";

// ATTENTION: Those constraints are no longer the same file as for the server.
//            Make sure changes are also reflected in /server/validation/constraints.ts.

(function () {
    const constraints = {
        id: {
            type: "string",
            regex: /^[1-9][0-9]*$/,
            optional: false,
        },
        token: {
            type: "string",
            regex: /^[0-9a-f]{16}$/i,
            optional: false,
        },
        node: {
            hostname: {
                type: "string",
                regex: /^[-a-z0-9_]{1,32}$/i,
                optional: false,
            },
            key: {
                type: "string",
                regex: /^([a-f0-9]{64})$/i,
                optional: true,
            },
            email: {
                type: "string",
                regex: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
                optional: false,
            },
            nickname: {
                type: "string",
                regex: /^[-a-z0-9_ äöüß]{1,64}$/i,
                optional: false,
            },
            mac: {
                type: "string",
                regex: /^([a-f0-9]{12}|([a-f0-9]{2}:){5}[a-f0-9]{2}|([a-f0-9]{2}-){5}[a-f0-9]{2})$/i,
                optional: false,
            },
            coords: {
                type: "string",
                regex: /^(-?[0-9]{1,3}(\.[0-9]{1,20})? -?[0-9]{1,3}(\.[0-9]{1,20})?)$/,
                optional: true,
            },
            monitoring: {
                type: "boolean",
                optional: false,
            },
        },
        nodeFilters: {
            hasKey: {
                type: "boolean",
                optional: true,
            },
            hasCoords: {
                type: "boolean",
                optional: true,
            },
            onlineState: {
                type: "string",
                regex: /^(ONLINE|OFFLINE)$/,
                optional: true,
            },
            monitoringState: {
                type: "string",
                regex: /^(disabled|active|pending)$/,
                optional: true,
            },
            site: {
                type: "string",
                regex: /^[a-z0-9_-]{1,32}$/,
                optional: true,
            },
            domain: {
                type: "string",
                regex: /^[a-z0-9_-]{1,32}$/,
                optional: true,
            },
        },
        rest: {
            list: {
                _page: {
                    type: "number",
                    min: 1,
                    optional: true,
                    default: 1,
                },
                _perPage: {
                    type: "number",
                    min: 1,
                    max: 50,
                    optional: true,
                    default: 20,
                },
                _sortDir: {
                    type: "enum",
                    allowed: ["ASC", "DESC"],
                    optional: true,
                    default: "ASC",
                },
                _sortField: {
                    type: "string",
                    regex: /^[a-zA-Z0-9_]{1,32}$/,
                    optional: true,
                },
                q: {
                    type: "string",
                    regex: /^[äöüß a-z0-9!#$%&@:.'*+/=?^_`{|}~-]{1,64}$/i,
                    optional: true,
                },
            },
        },
    };

    let _angular = null;
    try {
        _angular = angular;
    } catch (error) {
        // ReferenceError, as angular is not defined.
    }

    let _module = null;
    try {
        _module = module;
    } catch (error) {
        // ReferenceError, as module is not defined.
    }

    if (_angular) {
        angular.module("ffffng").constant("Constraints", constraints);
    }

    if (_module) {
        module.exports = constraints;
    }
})();

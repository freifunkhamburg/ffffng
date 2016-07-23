'use strict';

angular.module('ffffng').factory('MailResource', function (
    Constraints,
    Validator,
    MailService,
    Resources,
    Logger,
    ErrorTypes,
    Strings
) {
    var isValidId = Validator.forConstraint(Constraints.id);

    function withValidMailId(req, res, callback) {
        var id = Strings.normalizeString(Resources.getData(req).id);

        if (!isValidId(id)) {
            return callback({data: 'Invalid mail id.', type: ErrorTypes.badRequest});
        }

        callback(null, id);
    }

    return {
        get: function (req, res) {
            withValidMailId(req, res, function (err, id) {
                if (err) {
                    return Resources.error(res, err);
                }

                MailService.getMail(id, function (err, mail) {
                    if (err) {
                        Logger.tag('mails', 'admin').error('Error getting mail:', err);
                        return Resources.error(res, {data: 'Internal error.', type: ErrorTypes.internalError});
                    }

                    if (!mail) {
                        return Resources.error(res, {data: 'Mail not found.', type: ErrorTypes.notFound});
                    }

                    return Resources.success(res, mail);
                });
            });
        },

        getAll: function (req, res) {
            Resources.getValidRestParams('list', null, req, function (err, restParams) {
                if (err) {
                    return Resources.error(res, err);
                }

                return MailService.getPendingMails(
                    restParams,
                    function (err, mails, total) {
                        if (err) {
                            Logger.tag('mails', 'admin').error('Could not get pending mails:', err);
                            return Resources.error(res, {data: 'Internal error.', type: ErrorTypes.internalError});
                        }

                        res.set('X-Total-Count', total);
                        return Resources.success(res, mails);
                    }
                );
            });
        },

        delete: function (req, res) {
            withValidMailId(req, res, function (err, id) {
                if (err) {
                    return Resources.error(res, err);
                }

                MailService.deleteMail(id, function (err) {
                    if (err) {
                        Logger.tag('mails', 'admin').error('Error deleting mail:', err);
                        return Resources.error(res, {data: 'Internal error.', type: ErrorTypes.internalError});
                    }

                    return Resources.success(res);
                });
            });
        },

        resetFailures: function (req, res) {
            withValidMailId(req, res, function (err, id) {
                if (err) {
                    return Resources.error(res, err);
                }

                MailService.resetFailures(id, function (err, mail) {
                    if (err) {
                        Logger.tag('mails', 'admin').error('Error resetting failure count:', err);
                        return Resources.error(res, {data: 'Internal error.', type: ErrorTypes.internalError});
                    }

                    return Resources.success(res, mail);
                });
            });
        }
    };
});

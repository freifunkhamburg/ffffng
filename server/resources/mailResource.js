'use strict';

const Constraints = require('../validation/constraints')
const ErrorTypes = require('../utils/errorTypes')
const Logger = require('../logger')
const MailService = require('../services/mailService')
const Resources = require('../utils/resources')
const Strings = require('../utils/strings')
const Validator = require('../validation/validator')

const isValidId = Validator.forConstraint(Constraints.id);

function withValidMailId(req, res, callback) {
    const id = Strings.normalizeString(Resources.getData(req).id);

    if (!isValidId(id)) {
        return callback({data: 'Invalid mail id.', type: ErrorTypes.badRequest});
    }

    callback(null, id);
}

module.exports = {
    get (req, res) {
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

    getAll (req, res) {
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

    delete (req, res) {
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

    resetFailures (req, res) {
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
}

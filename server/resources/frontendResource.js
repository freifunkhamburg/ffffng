'use strict';

angular.module('ffffng').factory('FrontendResource', function (
    Logger,
    Resources,
    ErrorTypes,
    fs
) {
    var indexHtml = __dirname + '/../../client/index.html';

    return {
        render: function (req, res) {
            var data = Resources.getData(req);

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
    };
});

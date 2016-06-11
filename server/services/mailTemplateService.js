'use strict';

angular.module('ffffng')
.service('MailTemplateService', function (
        UrlBuilder,
        config,
        _,
        async,
        deepExtend,
        fs,
        Logger
) {
    var templateBasePath = __dirname + '/../mailTemplates';

    return {
        configureTransporter: function (transporter) {
            var htmlToText = require('nodemailer-html-to-text').htmlToText;
            transporter.use('compile', htmlToText({
                tables: ['.table']
            }));
        },

        render: function (mailOptions, callback) {
            var templatePathPrefix = templateBasePath + '/' + mailOptions.email

            async.parallel({
                    subject: _.partial(fs.readFile, templatePathPrefix + '.subject.txt'),
                    body: _.partial(fs.readFile, templatePathPrefix + '.body.html')
                },
                function (err, templates) {
                    if (err) {
                        return callback(err);
                    }

                    var data = deepExtend(
                        {},
                        mailOptions.data,
                        {
                            community: config.client.community,
                            editNodeUrl: UrlBuilder.editNodeUrl()
                        }
                    );

                    function render(field) {
                        return _.template(templates[field].toString())(data);
                    }

                    var renderedTemplate;
                    try {
                        renderedTemplate = {
                            subject: _.trim(render('subject')),
                            body: render('body')
                        };
                    }
                    catch (error) {
                        Logger
                            .tag('mail', 'template')
                            .error('Error rendering template for mail[' + mailOptions.id + ']:', error);
                        return callback(error);
                    }

                    callback(null, renderedTemplate);
                }
            );
        }
    };
});

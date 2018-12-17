'use strict';

angular.module('ffffngAdmin').config(function(NgAdminConfigurationProvider, RestangularProvider, Constraints, config) {
    RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
        if (operation === 'getList') {
            if (params._filters) {
                // flatten filter query params

                for (var filter in params._filters) {
                    params[filter] = params._filters[filter];
                }
                delete params._filters;
            }
        }
        return { params: params };
    });

    function nullable(value) {
        return value ? value : 'N/A';
    }

    function formatMoment(unix) {
        return unix ? moment.unix(unix).fromNow() : 'N/A';
    }

    function formatDuration(duration) {
        return typeof duration === 'number' ? moment.duration(duration).humanize() : 'N/A';
    }

    function nodeConstraint(field) {
        var constraint = Constraints.node[field];
        var result = {
            required: !constraint.optional
        };
        if (constraint.type === 'string') {
            result.pattern = constraint.regex;
        }
        return result;
    }

    var nga = NgAdminConfigurationProvider;

    var title = 'Knotenverwaltung - ' + config.community.name + ' - Admin-Panel';
    var admin = nga.application(title);
    document.title = title;

    var pathPrefix = config.rootPath === '/' ? '' : config.rootPath;

    var siteChoices = [];
    for (var i = 0; i < config.community.sites.length; i++) {
        var site = config.community.sites[i];
        siteChoices.push({
            label: site,
            value: site
        });
    }

    var domainChoices = [];
    for (var i = 0; i < config.community.domains.length; i++) {
        var domain = config.community.domains[i];
        domainChoices.push({
            label: domain,
            value: domain
        });
    }

    var header =
        '<div class="navbar-header">' +
        '<a class="navbar-brand" href="#" ng-click="appController.displayHome()">' +
        title + ' ' +
        '<small style="font-size: 0.7em;">(<fa-version></fa-version>)</small>' +
        '</a>' +
        '</div>';
    if (config.legal.imprintUrl) {
        header +=
            '<p class="navbar-text navbar-right">' +
            '<a href="' + config.legal.imprintUrl + '" target="_blank">' +
            'Imprint' +
            '</a>' +
            '</p>';
    }
    if (config.legal.privacyUrl) {
        header +=
            '<p class="navbar-text navbar-right">' +
            '<a href="' + config.legal.privacyUrl + '" target="_blank">' +
            'Privacy' +
            '</a>' +
            '</p>';
    }
    header +=
        '<p class="navbar-text navbar-right">' +
        '<a href="https://github.com/freifunkhamburg/ffffng/issues" target="_blank">' +
        '<i class="fa fa-bug" aria-hidden="true"></i> Report Error' +
        '</a>' +
        '</p>' +
        '<p class="navbar-text navbar-right">' +
        '<a href="https://github.com/freifunkhamburg/ffffng" target="_blank">' +
        '<i class="fa fa-code" aria-hidden="true"></i> Source Code' +
        '</a>' +
        '</p>' +
        '<p class="navbar-text navbar-right">' +
        '<a href="' + pathPrefix + '/" target="_blank">' +
        '<i class="fa fa-external-link" aria-hidden="true"></i> Frontend' +
        '</a>' +
        '</p>';

    admin
        .header(header)
        .baseApiUrl(pathPrefix + '/internal/api/')
        .debug(true);

    function nodeClasses(node) {
        if (!node) {
            return;
        }

        switch (node.values.onlineState) {
            case 'ONLINE':
                return 'node-online';

            case 'OFFLINE':
                return 'node-offline';

            default:
                return;
        }
    }

    var nodes = nga.entity('nodes').label('Nodes').identifier(nga.field('token'));
    nodes
        .listView()
        .title('Nodes')
        .perPage(30)
        .sortDir('ASC')
        .sortField('hostname')
        .actions([])
        .batchActions([])
        .exportFields([])
        .fields([
            nga.field('hostname').cssClasses(nodeClasses),
            nga.field('nickname').cssClasses(nodeClasses),
            nga.field('email').cssClasses(nodeClasses),
            nga.field('token').cssClasses(nodeClasses),
            nga.field('mac').cssClasses(nodeClasses),
            nga.field('key').label('VPN').cssClasses(nodeClasses).template(function (node) {
                return node.values.key
                    ? '<i class="fa fa-lock vpn-key-set" aria-hidden="true" title="VPN key set"></i>'
                    : '<i class="fa fa-times vpn-key-unset" aria-hidden="true" title="no VPN key"></i>';
            }),
            nga.field('site').map(nullable).cssClasses(nodeClasses),
            nga.field('domain').map(nullable).cssClasses(nodeClasses),
            nga.field('coords').label('GPS').cssClasses(nodeClasses).template(function (node) {
                return node.values.coords
                    ? '<i class="fa fa-map-marker coords-set" aria-hidden="true" title="coordinates set"></i>'
                    : '<i class="fa fa-times coords-unset" aria-hidden="true" title="no coordinates"></i>';
            }),
            nga.field('onlineState').map(nullable).cssClasses(nodeClasses),
            nga.field('monitoringState').cssClasses(nodeClasses).template(function (node) {
                switch (node.values.monitoringState) {
                    case 'active':
                        return '<i class="fa fa-heartbeat monitoring-active" title="active"></i>';

                    case 'pending':
                        return '<i class="fa fa-envelope monitoring-confirmation-pending" title="confirmation pending"></i>';

                    default:
                        return '<i class="fa fa-times monitoring-disabled" title="disabled"></i>';
                }
            })
        ])
        .filters([
            nga.field('q', 'template')
                .label('')
                .pinned(true)
                .template(
                    '<div class="input-group">' +
                    '<input type="text" ng-model="value" placeholder="Search" class="form-control"></input>' +
                    '<span class="input-group-addon"><i class="fa fa-search"></i></span></div>'),
            nga.field('site', 'choice')
                .label('Site')
                .pinned(false)
                .choices(siteChoices),
            nga.field('domain', 'choice')
                .label('Domäne')
                .pinned(false)
                .choices(domainChoices),
            nga.field('hasKey', 'choice')
                .label('VPN key')
                .pinned(false)
                .choices([
                    { label: 'VPN key set', value: true },
                    { label: 'no VPN key', value: false }
                ]),
            nga.field('hasCoords', 'choice')
                .label('GPS coordinates')
                .pinned(false)
                .choices([
                    { label: 'coordinates set', value: true },
                    { label: 'no coordinates', value: false }
                ]),
            nga.field('onlineState', 'choice')
                .label('Online state')
                .pinned(false)
                .choices([
                    { label: 'online', value: 'ONLINE' },
                    { label: 'offline', value: 'OFFLINE' }
                ]),
            nga.field('monitoringState', 'choice')
                .label('Monitoring')
                .pinned(false)
                .choices([
                    { label: 'pending', value: 'pending' },
                    { label: 'active', value: 'active' },
                    { label: 'disabled', value: 'disabled' }
                ])
        ])
        .actions(['<ma-filter-button filters="filters()" enabled-filters="enabledFilters" enable-filter="enableFilter()"></ma-filter-button>'])
        .listActions(
            '<ma-edit-button entry="entry" entity="entity" size="sm"></ma-edit-button> ' +
            '<ma-delete-button entry="entry" entity="entity" size="sm"></ma-delete-button> ' +
            '<form style="display: inline-block" action="' + pathPrefix + '/#/update" method="POST" target="_blank">' +
            '<input type="hidden" name="token" value="{{entry.values.token}}"/>' +
            '<button class="btn btn-primary btn-sm" type="submit"><i class="fa fa-external-link"></i> Open</button>' +
            '</form> ' +
            '<a class="btn btn-success btn-sm" href="' + config.map.mapUrl +
            '/#!v:m;n:{{entry.values.mapId}}" target="_blank"><i class="fa fa-map-o"></i> Map</a>'
        )
    ;

    nodes
        .editionView()
        .title('Edit node')
        .actions(['list', 'delete'])
        .addField(nga.field('token').editable(false))
        .addField(nga.field('hostname').label('Name').validation(nodeConstraint('hostname')))
        .addField(nga.field('key').label('Key').validation(nodeConstraint('key')))
        .addField(nga.field('mac').label('MAC').validation(nodeConstraint('mac')))
        .addField(nga.field('coords').label('GPS').validation(nodeConstraint('coords')))
        .addField(nga.field('nickname').validation(nodeConstraint('nickname')))
        .addField(nga.field('email').validation(nodeConstraint('email')))
        .addField(nga.field('monitoring', 'boolean').validation(nodeConstraint('monitoring')))
        .addField(nga.field('monitoringConfirmed').label('Monitoring confirmation').editable(false).map(
            function (monitoringConfirmed, node) {
                if (!node.monitoring) {
                    return 'N/A';
                }

                return monitoringConfirmed ? 'confirmed' : 'pending';
            }
        ))
    ;

    admin.addEntity(nodes);

    function monitoringStateClasses(monitoringState) {
        if (!monitoringState) {
            return;
        }

        switch (monitoringState.values.state) {
            case 'ONLINE':
                return 'monitoring-state-online';

            case 'OFFLINE':
                return 'monitoring-state-offline';

            default:
                return;
        }
    }

    var monitoringStates = nga.entity('monitoring').label('Monitoring');
    monitoringStates
        .listView()
        .title('Monitoring')
        .perPage(30)
        .sortDir('ASC')
        .sortField('id')
        .actions([])
        .batchActions([])
        .exportFields([])
        .fields([
            nga.field('id').cssClasses(monitoringStateClasses),
            nga.field('hostname').cssClasses(monitoringStateClasses),
            nga.field('mac').cssClasses(monitoringStateClasses),
            nga.field('site').map(nullable).cssClasses(monitoringStateClasses),
            nga.field('domain').map(nullable).cssClasses(monitoringStateClasses),
            nga.field('monitoring_state').cssClasses(monitoringStateClasses).template(function (monitoringState) {
                switch (monitoringState.values.monitoring_state) {
                    case 'active':
                        return '<i class="fa fa-heartbeat monitoring-active" title="active"></i>';

                    case 'pending':
                        return '<i class="fa fa-envelope monitoring-confirmation-pending" title="confirmation pending"></i>';

                    default:
                        return '<i class="fa fa-times monitoring-disabled" title="disabled"></i>';
                }
            }),
            nga.field('state').cssClasses(monitoringStateClasses),
            nga.field('last_seen').map(formatMoment).cssClasses(monitoringStateClasses),
            nga.field('import_timestamp').label('Imported').map(formatMoment).cssClasses(monitoringStateClasses),
            nga.field('last_status_mail_type').map(nullable).cssClasses(monitoringStateClasses),
            nga.field('last_status_mail_sent').map(formatMoment).cssClasses(monitoringStateClasses),
            nga.field('created_at').map(formatMoment).cssClasses(monitoringStateClasses),
            nga.field('modified_at').map(formatMoment).cssClasses(monitoringStateClasses)
        ])
        .filters([
            nga.field('q')
                .label('')
                .pinned(true)
                .template(
                '<div class="input-group">' +
                '<input type="text" ng-model="value" placeholder="Search" class="form-control"></input>' +
                '<span class="input-group-addon"><i class="fa fa-search"></i></span></div>'),
        ])
        .listActions(
            '<a class="btn btn-success btn-sm" href="' + config.map.mapUrl +
            '/#!v:m;n:{{entry.values.mapId}}" target="_blank"><i class="fa fa-map-o"></i> Map</a>'
        )
    ;

    admin.addEntity(monitoringStates);

    function mailClasses(mail) {
        if (!mail) {
            return;
        }

        var failures = mail.values.failures;

        if (failures === 0) {
            return 'mails-pending';
        }

        if (failures >= 5) {
            return 'mails-failed-max';
        }

        return 'mails-failed';
    }

    var mails = nga.entity('mails').label('Mail-Queue');
    mails
        .listView()
        .title('Mail-Queue')
        .perPage(30)
        .sortDir('ASC')
        .sortField('id')
        .actions([])
        .batchActions([])
        .exportFields([])
        .fields([
            nga.field('id').cssClasses(mailClasses),
            nga.field('failures').cssClasses(mailClasses),
            nga.field('sender').cssClasses(mailClasses),
            nga.field('recipient').cssClasses(mailClasses),
            nga.field('email').cssClasses(mailClasses),
            nga.field('created_at').map(formatMoment).cssClasses(mailClasses),
            nga.field('modified_at').map(formatMoment).cssClasses(mailClasses)
        ])
        .filters([
            nga.field('q')
                .label('')
                .pinned(true)
                .template(
                '<div class="input-group">' +
                '<input type="text" ng-model="value" placeholder="Search" class="form-control"></input>' +
                '<span class="input-group-addon"><i class="fa fa-search"></i></span></div>'),
        ])
        .listActions(
        '<fa-mail-action-button disabled="entry.values.failures === 0" action="reset" icon="refresh" label="Retry" mail="entry" button="success" label="run" size="sm"></fa-mail-action-button> ' +
        '<ma-delete-button entry="entry" entity="entity" size="sm"></ma-delete-button>'
    )
    ;

    admin.addEntity(mails);

    function taskClasses(field) {
        return function(task) {
            if (!task) {
                return;
            }
            return 'task-' + field + ' ' + (task.values.enabled ? 'task-enabled' : 'task-disabled');
        };
    }

    var tasks = nga.entity('tasks').label('Background-Jobs');
    tasks
        .listView()
        .title('Background-Jobs')
        .perPage(30)
        .sortDir('ASC')
        .sortField('id')
        .actions([])
        .batchActions([])
        .exportFields([])
        .fields([
            nga.field('id').cssClasses(taskClasses('id')),
            nga.field('name').cssClasses(taskClasses('name')),
            nga.field('description').cssClasses(taskClasses('description')),
            nga.field('schedule').cssClasses(taskClasses('schedule')),
            nga.field('state').cssClasses(taskClasses('state')),
            nga.field('runningSince').map(formatMoment).cssClasses(taskClasses('runningSince')),
            nga.field('lastRunStarted').map(formatMoment).cssClasses(taskClasses('lastRunStarted')),
            nga.field('lastRunDuration').map(formatDuration).cssClasses(taskClasses('lastRunDuration'))
        ])
        .filters([
            nga.field('q')
                .label('')
                .pinned(true)
                .template(
                '<div class="input-group">' +
                '<input type="text" ng-model="value" placeholder="Search" class="form-control"></input>' +
                '<span class="input-group-addon"><i class="fa fa-search"></i></span></div>'),
        ])
        .listActions(
            '<fa-task-action-button action="run" task="entry" button="primary" label="run" size="sm"></fa-task-action-button> ' +
            '<fa-task-action-button ng-if="!entry.values.enabled" button="success" action="enable" icon="power-off" task="entry" label="enable" size="sm"></fa-task-action-button> ' +
            '<fa-task-action-button ng-if="entry.values.enabled" button="warning" action="disable" icon="power-off" task="entry" label="disable" size="sm"></fa-task-action-button>'
        )
    ;

    admin.addEntity(tasks);

    admin.menu(
            nga.menu()
                .addChild(nga
                    .menu()
                    .template(
                        '<a href="' + pathPrefix + '/internal/admin">' +
                        '<span class="fa fa-dashboard"></span> Dashboard / Statistics' +
                        '</a>'
                    )
                )
                .addChild(nga
                    .menu(nodes)
                    .icon('<i class="fa fa-dot-circle-o"></i>')
                )
                .addChild(nga
                    .menu(monitoringStates)
                    .icon('<span class="fa fa-heartbeat"></span>')
                )
                .addChild(nga
                    .menu(mails)
                    .icon('<span class="fa fa-envelope"></span>')
                )
                .addChild(nga
                    .menu(tasks)
                    .icon('<span class="fa fa-cog"></span>')
                )
                .addChild(nga
                    .menu()
                    .template(
                        '<a href="' + pathPrefix + '/internal/logs" target="_blank">' +
                        '<span class="fa fa-list"></span> Logs' +
                        '</a>'
                    )
                )
    );

    admin.dashboard(nga.dashboard()
        .template(
            '<div class="row dashboard-starter"></div>' +
            '<fa-dashboard-stats></fa-dashboard-stats>' +

            '<div class="row dashboard-content">' +
                '<div class="col-lg-6">' +
                    '<div class="panel panel-default" ng-repeat="collection in dashboardController.collections | orderElement" ng-if="$even">' +
                        '<ma-dashboard-panel collection="collection" entries="dashboardController.entries[collection.name()]"></ma-dashboard-panel>' +
                    '</div>' +
                '</div>' +
            '</div>'
        )
    );

    nga.configure(admin);
});

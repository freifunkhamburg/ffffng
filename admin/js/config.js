'use strict';

angular.module('ffffngAdmin').config(function(NgAdminConfigurationProvider, RestangularProvider, Constraints) {
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

    function formatMoment(unix) {
        return unix ? moment.unix(unix).fromNow() : 'N/A';
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
    var admin = nga.application('Knotenverwaltung - Admin-Panel');

    admin
        .baseApiUrl('/internal/api/')
        .debug(true);

    function nodeClasses(node) {
        if (!node) {
            return;
        }
        return;
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
            nga.field('coords').label('GPS').cssClasses(nodeClasses).template(function (node) {
                return node.values.coords
                    ? '<i class="fa fa-map-marker coords-set" aria-hidden="true" title="coordinates set"></i>'
                    : '<i class="fa fa-times coords-unset" aria-hidden="true" title="no coordinates"></i>';
            }),
            nga.field('monitoringState').cssClasses(nodeClasses).template(function (node) {
                switch (node.values.monitoringState) {
                    case 'active':
                        return '<i class="fa fa-check monitoring-active" title="active"></i>';

                    case 'pending':
                        return '<i class="fa fa-envelope monitoring-confirmation-pending" title="confirmation pending"></i>';

                    default:
                        return '<i class="fa fa-times monitoring-disabled" title="disabled"></i>';
                }
            })
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
        .listActions([
            'edit',
            'delete'
        ])
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

    function taskClasses(task) {
        if (!task) {
            return;
        }
        return task.values.enabled ? 'task-enabled' : 'task-disabled';
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
            nga.field('id').cssClasses(taskClasses),
            nga.field('name').cssClasses(taskClasses),
            nga.field('schedule').cssClasses(taskClasses),
            nga.field('state').cssClasses(taskClasses),
            nga.field('runningSince').map(formatMoment).cssClasses(taskClasses),
            nga.field('lastRunStarted').map(formatMoment).cssClasses(taskClasses)
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
                    .menu(nodes)
                    .icon('<i class="fa fa-dot-circle-o"></i>')
                )
                .addChild(nga
                    .menu(tasks)
                    .icon('<span class="fa fa-cog"></span>')
                )
                .addChild(nga
                    .menu()
                    .template(
                        '<a href="/internal/logs" target="_blank">' +
                        '<span class="fa fa-list"></span> Logs' +
                        '</a>'
                    )
                )
    );

    nga.configure(admin);
});

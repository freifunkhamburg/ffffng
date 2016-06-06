'use strict';

angular.module('ffffngAdmin').config(function(NgAdminConfigurationProvider, Constraints) {
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
        .actions([])
        .batchActions([])
        .exportFields([])
        .fields([
            nga.field('token').cssClasses(nodeClasses),
            nga.field('hostname').cssClasses(nodeClasses),
            nga.field('monitoring').cssClasses(nodeClasses).template(function (node) {
                if (!node.values.monitoring) {
                    return '<span class="glyphicon glyphicon-remove monitoring-disabled" title="disabled"></span>';
                }
                return node.values.monitoringConfirmed
                    ? '<span class="glyphicon glyphicon-ok monitoring-active" title="active"></span>'
                    : '<span class="glyphicon glyphicon-envelope monitoring-confirmation-pending" ' +
                      'title="confirmation pending"></span>';
            })
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
            '<fa-task-action-button ng-if="!entry.values.enabled" button="success" action="enable" icon="off" task="entry" label="enable" size="sm"></fa-task-action-button> ' +
            '<fa-task-action-button ng-if="entry.values.enabled" button="warning" action="disable" icon="off" task="entry" label="disable" size="sm"></fa-task-action-button>'
        )
    ;

    admin.addEntity(tasks);

    admin.menu(
            nga.menu()
                .addChild(nga
                    .menu(nodes)
                    .icon('<span class="glyphicon glyphicon-record"></span>')
                )
                .addChild(nga
                    .menu(tasks)
                    .icon('<span class="glyphicon glyphicon-cog"></span>')
                )
                .addChild(nga
                    .menu()
                    .template(
                        '<a href="/internal/logs" target="_blank">' +
                        '<span class="glyphicon glyphicon-list"></span> Logs' +
                        '</a>'
                    )
                )
    );

    nga.configure(admin);
});

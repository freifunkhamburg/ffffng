'use strict';

var myApp = angular.module('ffffngAdmin', ['ng-admin']);

myApp.config(['NgAdminConfigurationProvider', function(NgAdminConfigurationProvider) {
    function formatMoment(unix) {
        return unix ? moment.unix(unix).fromNow() : 'N/A';
    }

    var nga = NgAdminConfigurationProvider;
    var admin = nga.application('Knotenverwaltung - Admin-Panel');

    admin
        .baseApiUrl('/internal/api/')
        .debug(true);

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
}]);

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

    var tasks = nga.entity('tasks').label('Background-Jobs');
    tasks
        .listView()
        .title('Background-Jobs')
        .actions([])
        .batchActions([])
        .exportFields([])
        .fields([
            nga.field('id'),
            nga.field('name'),
            nga.field('schedule'),
            nga.field('runningSince').map(formatMoment),
            nga.field('lastRunStarted').map(formatMoment)
        ])
        .listActions(
            '<fa-task-action-button action="run" task="entry" label="Run" size="sm"></fa-task-action-button>'
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

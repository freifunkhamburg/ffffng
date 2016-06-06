'use strict';

angular.module('ffffngAdmin')
.directive('faTaskActionButton', function (Restangular, $state, notification) {
    var link = function (scope) {
        scope.label = scope.label || 'ACTION';
        scope.icon = scope.icon || 'play';
        scope.button = scope.button || 'default';

        scope.perform = function () {
            var task = scope.task();

            Restangular
                .one('/internal/api/tasks/' + scope.action, task.values.id).put()
                .then(function () { $state.reload() })
                .then(function () { notification.log('Done', { addnCls: 'humane-flatty-success' }); })
                .catch(function (e) {
                    notification.log('Error: ' + e.data, { addnCls: 'humane-flatty-error' });
                    console.error(e)
                });
        };
    };

    return {
        'link': link,
        'restrict': 'E',
        'scope': {
            'action': '@',
            'icon': '@',
            'task': '&',
            'size': '@',
            'label': '@',
            'button': '@',
            'disabled': '='
        },

        'template':
            '<button class="btn btn-{{ button }}" ng-disabled="disabled" ng-class="size ? \'btn-\' + size : \'\'" ng-click="perform()">' +
            '<span class="glyphicon glyphicon-{{ icon }}" aria-hidden="true"></span>&nbsp;<span class="hidden-xs">{{ label }}</span>' +
            '</button>'
    };
});

'use strict';

angular.module('ffffng', [
    'ngSanitize',
    'ngRoute',
    'ng',
    'leaflet-directive',
    'templates-main',
    'ui.bootstrap'
])
.config(function ($logProvider, $locationProvider, $routeProvider) {
    $logProvider.debugEnabled(false);
    $locationProvider.hashPrefix('');
    $locationProvider.html5Mode(false);
    $routeProvider
        .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl',
            title: 'Willkommen'
        })
        .when('/new', {
            templateUrl: 'views/newNodeForm.html',
            controller: 'NewNodeCtrl',
            title: 'Neuen Knoten anmelden'
        })
        .when('/update', {
            templateUrl: 'views/updateNodeForm.html',
            controller: 'UpdateNodeCtrl',
            title: 'Knotendaten ändern'
        })
        .when('/delete', {
            templateUrl: 'views/deleteNodeForm.html',
            controller: 'DeleteNodeCtrl',
            title: 'Knoten löschen'
        })
        .when('/monitoring/confirm', {
            templateUrl: 'views/confirmMonitoring.html',
            controller: 'ConfirmMonitoringCtrl',
            title: 'Versand von Status-E-Mails bestätigen'
        })
        .when('/monitoring/disable', {
            templateUrl: 'views/disableMonitoring.html',
            controller: 'DisableMonitoringCtrl',
            title: 'Versand von Status-E-Mails deaktivieren'
        })
        .otherwise({
            resolveRedirectTo: function ($location) {
                var url = $location.url();
                if (url.startsWith('/!/')) {
                    return url.substring(3);
                }
                return '/';
            }
        });
})
.service('Navigator', function ($location) {
    return {
        home: function () {
            $location.url('/');
        },
        newNode: function () {
            $location.url('/new');
        },
        updateNode: function () {
            $location.url('/update');
        },
        deleteNode: function () {
            $location.url('/delete');
        }
    };
})
.run(function ($location, $rootScope, $window, config) {
    $rootScope.$on('$routeChangeSuccess', function (event, current) {
        $window.scrollTo(0, 0);
        $rootScope.title = current.$$route ? (current.$$route.title || '') : '';
        $rootScope.config = config;
    });
});

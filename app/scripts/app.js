'use strict';

angular.module('ffffng', [
    'ngSanitize',
    'ngRoute',
    'ng',
    'leaflet-directive',
    'templates-main'
])
.config(function ($routeProvider) {
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
        .otherwise({
            redirectTo: '/'
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
        }
    };
})
.run(function ($location, $rootScope, config) {
    $rootScope.$on('$routeChangeSuccess', function (event, current) {
        $rootScope.title = current.$$route.title;
        $rootScope.config = config;
    });
});

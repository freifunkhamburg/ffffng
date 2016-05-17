'use strict';

angular.module('ffffng')
.directive('fNodeForm', function () {
    var ctrl = function (
        $scope,
        $timeout,
        Constraints,
        $element,
        _,
        config,
        $window,
        geolib,
        OutsideOfCommunityDialog
    ) {
        $scope.config = config;
        angular.extend($scope, {
            center: {
                lat: config.coordsSelector.lat,
                lng: config.coordsSelector.lng,
                zoom: config.coordsSelector.defaultZoom
            },
            markers: {},
            layers: {
                baselayers: {
                    osm: {
                        name: '',
                        url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg',
                        type: 'xyz',
                        layerOptions: {
                            subdomains: '1234',
                            attribution:
                                'Map data Tiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> ' +
                                '<img src="https://developer.mapquest.com/content/osm/mq_logo.png" />, ' +
                                'Map data © OpenStreetMap contributors, CC-BY-SA'
                        }
                    }
                }
            }
        });

        if (config.otherCommunityInfo.showBorderForDebugging) {
            $scope.paths = {
                border: {
                    color: '#ff0000',
                        weight: 3,
                        latlngs: config.otherCommunityInfo.localCommunityPolygon.concat(
                                [config.otherCommunityInfo.localCommunityPolygon[0]]
                        )
                }
            };
        }

        var geolibPolygon = _.map(config.otherCommunityInfo.localCommunityPolygon, function (point) {
            return {
                latitude: point.lat,
                longitude: point.lng
            };
        });

        var inCommunityArea = function (lat, lng) {
            return geolib.isPointInside({latitude: lat, longitude: lng}, geolibPolygon);
        };

        var updateNodePosition = function (lat, lng) {
            $scope.markers.node = {
                lat: lat,
                lng: lng,
                focus: true,
                draggable: false
            };
        };

        $scope.$on('leafletDirectiveMap.click', function (event, leaflet) {
            var lat = leaflet.leafletEvent.latlng.lat;
            var lng = leaflet.leafletEvent.latlng.lng;
            updateNodePosition(lat, lng);
            $scope.node.coords = lat + ' ' + lng;
        });

        function withValidCoords(coords, callback, invalidCallback) {
            invalidCallback = invalidCallback || function () {};

            coords = coords ||  '';
            coords = coords.trim();
            if (_.isEmpty(coords)) {
                return invalidCallback();
            }

            if ($scope.hasError('coords')) {
                return invalidCallback();
            }

            var parts = coords.split(/\s+/);

            var lat = Number(parts[0]);
            var lng = Number(parts[1]);

            return callback(lat, lng);
        }

        $scope.updateMap = function (optCoords) {
            var coords = optCoords || $scope.coords;
            withValidCoords(coords, function (lat, lng) {
                updateNodePosition(lat, lng);
            });
        };

        $scope.resetCoords = function () {
            $scope.node.coords = '';
            $scope.markers = {};
        };

        $scope.constraints = Constraints.node;

        var submitted = false;

        $scope.hasError = function (field) {
            return $scope.nodeForm && $scope.nodeForm[field].$invalid && submitted;
        };

        var duplicateError = {
            hostname: 'Der Knotenname ist bereits vergeben. Bitte wähle einen anderen.',
            key: 'Für den VPN-Schlüssel gibt es bereits einen Eintrag.',
            mac: 'Für die MAC-Adresse gibt es bereits einen Eintrag.'
        };

        var doSubmit = function (node) {
            if ($scope.nodeForm.$invalid) {
                var firstInvalid = _.filter($element.find('form').find('input'), function (input) {
                    return (input.type === 'text' || input.type === 'email')
                        && $scope.nodeForm[input.name].$invalid;
                })[0];
                if (firstInvalid) {
                    $window.scrollTo(0, $window.pageYOffset + firstInvalid.getBoundingClientRect().top - 100);
                }
                return;
            }

            $scope.error = null;
            $scope.save(node).error(function (response, code) {
                switch (code) {
                    case 409: // conflict
                        $scope.error = duplicateError[response.field];
                        break;
                    default:
                        $scope.error = 'Es ist ein Fehler aufgetreten. Versuche es später noch einmal.';
                }
                $window.scrollTo(0, 0);
            });
        };

        $scope.onSubmit = function (node) {
            submitted = true;

            withValidCoords(
                node.coords,
                function (lat, lng) {
                    if (!config.otherCommunityInfo.showInfo || inCommunityArea(lat, lng)) {
                        doSubmit(node);
                    } else {
                        OutsideOfCommunityDialog.open($scope.action).result.then(function () {
                            doSubmit(node);
                        });
                    }
                },
                function () {
                    doSubmit(node);
                }
            );
        };

        $scope.updateMap($scope.node.coords);
        withValidCoords($scope.node.coords, function (lat, lng) {
            $scope.center.lat = lat;
            $scope.center.lng = lng;
            $scope.center.zoom = 12;
        });
    };

    return {
        'controller': ctrl,
        'restrict': 'E',
        'templateUrl': 'views/directives/nodeForm.html',
        'scope': {
            'node': '=fNode',
            'save': '=fSave',
            'cancel': '=fCancel',
            'action': '@fAction'
        }
    };
});

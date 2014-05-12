'use strict';

angular.module('ffffng')
.directive('fTokenForm', function () {
    var ctrl = function ($scope, Constraints, Validator) {
        var isValid = Validator.forConstraint(Constraints.token);
        $scope.hasError = function () {
            var value = $scope.token;
            if (value === undefined) {
                return false;
            }
            return !isValid(value);
        };

        $scope.doSubmit = function (token) {
            $scope.error = null;
            $scope.onSubmit(token)
                .error(function (response, code) {
                    switch (code) {
                        case 404: // not found
                            $scope.error = 'Zum Token wurde kein passender Eintrag gefunden.';
                            break;
                        default:
                            $scope.error = 'Es ist ein Fehler aufgetreten. Versuche es später noch einmal.';
                    }
                });
        };
    };

    return {
        'controller': ctrl,
        'restrict': 'E',
        'templateUrl': 'views/directives/tokenForm.html',
        'scope': {
            'onSubmit': '=fSubmit',
            'onCancel': '=fCancel'
        }
    };
});

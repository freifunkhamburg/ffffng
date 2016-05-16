'use strict';

angular.module('ffffng')
.directive('fTokenForm', function () {
    var ctrl = function ($scope, Constraints) {
        $scope.constraints = Constraints;
        $scope.submitted = false;

        $scope.doSubmit = function (token) {
            $scope.submitted = true;

            if ($scope.tokenForm.$invalid) {
                return;
            }

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
            'onCancel': '=fCancel',
            'submitIcon': '@fSubmitIcon',
            'submitLabel': '@fSubmitLabel'
        }
    };
});

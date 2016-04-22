/**
 * Created by charsen on 16/4/6.
 */
MAIN.controller('homeCtrl', ["$scope", "$rootScope", "tools", "$timeout", "$routeParams", "$location", function ($scope, $rootScope, tools, $timeout, $routeParams, $location) {
    $scope.userName = window.localStorage.userName;
}]);
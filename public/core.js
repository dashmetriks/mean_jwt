var interceptor = function($q, $location) {
    return {
        request: function(config) {
            return config;
        },

        response: function(result) {
            return result;
        },

        responseError: function(rejection) {
            console.log('Failed with', rejection.status, 'status');
            if (rejection.status == 403) {
                    $location.url('/login');
            }

            return $q.reject(rejection);
        }
    }
};


//var express_endpoint = "http://envite.club:3000"
var express_endpoint = "http://localhost:8070"

//var envite = angular.module('envite', ['ui.bootstrap', 'ui.bootstrap.datetimepicker', 'ngRoute']);
angular.module('envite', [
  'ngRoute',
  'envite.user',
  'envite.view1',
  'envite.invites'
]).
config(['$locationProvider', '$routeProvider',
    function($locationProvider, $routeProvider) {
        $routeProvider
       //     .when('/smsdata', {
      //          templateUrl: 'smsdata.html',
       //         controller: 'mainController'
       //     })
      //      .otherwise({
       //         redirectTo: '/event_list'
        //    });
        $locationProvider.html5Mode(true);
    }
])
.directive('match', function($parse) {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      console.log(attrs)
      scope.$watch(function() {        
      console.log(ctrl)
        return $parse(attrs.match)(scope) === ctrl.$modelValue;
      }, function(currentValue) {
        ctrl.$setValidity('mismatch', currentValue);
      });
    }
  };
});

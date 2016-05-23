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

angular.module('envite', [
    'ngRoute',
    'config',
    'envite.user',
    'envite.invite'
])

.config(['$locationProvider', '$routeProvider',
    function($locationProvider, $routeProvider) {
        $routeProvider
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
})

.factory('urls', function(config) {
    return {
        express_endpoint: config.express_endpoint
    }
})

.controller('mainController', ['urls',
    function(urls) {
        express_endpoint = urls.express_endpoint
    }
]);

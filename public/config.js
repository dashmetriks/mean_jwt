angular.module('config', [])
    .factory('config', function() {
        return {
            express_endpoint: 'http://localhost:8080'
        };
    });
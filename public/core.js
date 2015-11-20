var scotchTodo = angular.module('scotchTodo', ['ngRoute']);

scotchTodo.config(['$routeProvider',
   function ($routeProvider) {
	$routeProvider
	.when('/events/:event_id', {
		templateUrl: 'events.html',
		controller: 'mainController'
	})
	.when('/login', {
		templateUrl: 'login.html',
		controller: 'mainController'
	});
}]);

scotchTodo.controller('mainController', ['$scope', '$http', '$window', '$location', '$routeParams',
  function ($scope, $http, $window, $location , $routeParams) {
    $scope.formData = {};

    // when landing on the page, get all todos and show them
    $http.get('/api/todos')
        .success(function(data) {
            $scope.todos2 = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    // when submitting the add form, send the text to the node API
    $scope.createTodo = function() {
        $http.post('/api/todos', $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos2 = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    // delete a todo after checking it
    $scope.deleteTodo = function(id) {
        $http.delete('/api/todos/' + id)
            .success(function(data) {
                $scope.todos2 = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };


    $scope.login = function() {
        console.log("easdfdsafsdaf");
        $http({
            method: 'POST',
            url: 'http://localhost:8080/authenticate',
            data: 'name=' + $scope.user.username + '&password=' + $scope.user.password,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).success(function(data) {
            console.log(data);
            $window.sessionStorage.setItem('token', data.token);
            //          $location.path('/');
        });
    }

    $scope.getEvent = function(id) {
        $http({
                method: 'GET',
                url: 'http://localhost:8080/api/events/' + $routeParams.event_id,
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.todos = data;
                console.log("get Event scope");
                console.log (data);
                
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    $scope.addEvent = function(id,ustatus) {
        $http({
                method: 'GET',
                url: 'http://localhost:8080/api/adduserevent/' + id + '/' + ustatus,
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.todos = data;
                console.log("add Event scope");
                console.log (data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
}]);

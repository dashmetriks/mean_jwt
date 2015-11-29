var interceptor = function ($q, $location) {
	return {
		request: function (config) {
		console.log(config);
		return config;
	},

	response: function (result) {
		console.log('Repos:');
		//    result.data.splice(0, 10).forEach(function (repo) {
		//       console.log(repo.name);
		//    })
		return result;
	},

	responseError: function (rejection) {
		console.log('Failed with', rejection.status, 'status');
		if (rejection.status == 403) {
			$location.url('/login');
		}

		return $q.reject(rejection);
	}
	}
};


var scotchTodo = angular.module('scotchTodo', ['ngRoute']);

scotchTodo.config(function ($httpProvider) {
       $httpProvider.interceptors.push(interceptor);
    });

scotchTodo.config(['$locationProvider', '$routeProvider',
   function ($locationProvider, $routeProvider) {
	$routeProvider
	.when('/events/:event_id', {
		templateUrl: 'events.html',
		controller: 'mainController'
	})
	.when('/event_list', {
		templateUrl: 'event_list.html',
		controller: 'mainController'
	})
	.when('/login', {
		templateUrl: 'login.html',
		controller: 'mainController'
	})
	.when('/register', {
		templateUrl: 'register.html',
		controller: 'mainController'
	})
        .otherwise({
            redirectTo: '/event_list'
        });
   $locationProvider.html5Mode(true);
}]);

scotchTodo.controller('mainController', ['$scope', '$http', '$window', '$location', '$routeParams', '$rootScope',
  function ($scope, $http, $window, $location , $routeParams, $rootScope) {
    $scope.formData = {};

    $scope.logOut = function () {
       console.log ("looooooooogout");
       $window.sessionStorage['token'] = null;
       $rootScope.isUserLoggedIn = false;
          //  $window.sessionStorage.setItem('token', data.token);
       $location.url('/login');
    }
    // when landing on the page, get all todos and show them
//    $http.get('/api/todos')
 //       .success(function(data) {
  //          $scope.todos = data;
   //         console.log(data);
    //    })
     //   .error(function(data) {
      //      console.log('Error: ' + data);
       // });

    // when submitting the add form, send the text to the node API

    // delete a todo after checking it
    $scope.deleteTodo = function(id) {
        $http.delete('/api/todos/' + id)
            .success(function(data) {
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };


    $scope.register = function() {
        $http({
            method: 'POST',
            url: 'http://localhost:8080/register',
            data: 'name=' + $scope.user.username + '&password=' + $scope.user.password,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).success(function(data) {
           console.log("kkmkmkoooo");
            console.log(data);
          //  $window.sessionStorage.setItem('token', data.token);
//            $scope.isUserLoggedIn = true;
            $location.url('/login');
        });
    }

    $scope.login = function() {
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
//            $scope.isUserLoggedIn = true;
            $location.url('/event_list');
        });
    }

    $scope.getEventList = function() {
        $http({
                method: 'GET',
                url: 'http://localhost:8080/api/todos/',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.todos = data;
                console.log("get Event Lissssssssst scope");
            $rootScope.isUserLoggedIn = true;
                console.log (data);
                
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

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


    $scope.createTodo = function() {
        $http({
                method: 'POST',
                url: 'http://localhost:8080/api/todos',
                data: 'text=' + $scope.formData.text,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.todos = data;
                console.log("add commment");
                console.log (data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    $scope.addComment = function() {
        $http({
                method: 'POST',
                url: 'http://localhost:8080/api/addcomment/' + $routeParams.event_id,
                data: 'text=' + $scope.formData.text,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.todos = data;
                console.log("add commment");
                console.log (data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };


}]);

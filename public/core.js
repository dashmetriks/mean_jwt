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

(function (module) {
     
    var fileReader = function ($q, $log) {
 
        var onLoad = function(reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.resolve(reader.result);
                });
            };
        };
 
        var onError = function (reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.reject(reader.result);
                });
            };
        };
 
        var onProgress = function(reader, scope) {
            return function (event) {
                scope.$broadcast("fileProgress",
                    {
                        total: event.total,
                        loaded: event.loaded
                    });
            };
        };
 
        var getReader = function(deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            reader.onprogress = onProgress(reader, scope);
            return reader;
        };
 
        var readAsDataURL = function (file, scope) {
            var deferred = $q.defer();
             
            var reader = getReader(deferred, scope);         
            reader.readAsDataURL(file);
             
            return deferred.promise;
        };
 
        return {
            readAsDataUrl: readAsDataURL  
        };
    };
 
    module.factory("fileReader",
                   ["$q", "$log", fileReader]);
 
}(angular.module("scotchTodo")));

var UploadController = function ($scope, fileReader) {
     console.log(fileReader)
    $scope.getFile = function () {
        $scope.progress = 0;
        fileReader.readAsDataUrl($scope.file, $scope)
                      .then(function(result) {
                          $scope.imageSrc = result;
                      });
    };
 
    $scope.$on("fileProgress", function(e, progress) {
        $scope.progress = progress.loaded / progress.total;
    });
 
};

scotchTodo.directive("ngFileSelect",function(){

  return {
    link: function($scope,el){
      
      el.bind("change", function(e){
      
        $scope.file = (e.srcElement || e.target).files[0];
        $scope.getFile();
      })
      
    }
    
  }
  
  
});


scotchTodo.config(function ($httpProvider) {
       $httpProvider.interceptors.push(interceptor);
    });

scotchTodo.config(['$locationProvider', '$routeProvider',
   function ($locationProvider, $routeProvider) {
	$routeProvider
	.when('/invite/:invite_code', {
		templateUrl: 'invites.html',
		controller: 'mainController'
	})
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

    $scope.invite_accept = function (event_id) {
       console.log ("invite accept");
       console.log ($routeParams.invite_code);
            $http({
                method: 'GET',
                url: 'http://localhost:8080/api/adduserevent/' + event_id + '/invited' ,
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.todos = data;
                console.log("invite acccccccccepted");
            //$rootScope.isUserLoggedIn = true;
                //console.log (data[0].invite_status);
               // if (data[0].invite_status == 'open') {
                //   console.log("wowowowowo");
                   $location.url('/events/' + event_id);
              //  }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    }

    $scope.invite_check = function () {
       console.log ("invite check");
       console.log ($routeParams.invite_code);
       $http({
                method: 'GET',
                url: 'http://localhost:8080/invites/' + $routeParams.invite_code
           //     headers: {
            //        'Content-Type': 'application/json',
            //    }
            }).success(function(data) {
                $scope.todos = data;
                console.log("invite scoppppppppe");
            //$rootScope.isUserLoggedIn = true;
                console.log (data[0].invite_status);
                if (data[0].invite_status == 'open') {
                   console.log("wowowowowo");
                 //  $location.url('/events/38');
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    }

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
            if (data.message == "User already exists.") {
              $scope.reg_message = "User already exists."    
            }
          //  $window.sessionStorage.setItem('token', data.token);
//            $scope.isUserLoggedIn = true;
            if (data.success == true) {
              $location.url('/login');
            }
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
            if (data.success == true) {
              $window.sessionStorage.setItem('token', data.token);
              $location.url('/event_list');
            } else {
              $scope.login_message = data.message    
            }

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
                $scope.yeses = data['players_yes'];
                $scope.nos = data['players_no'];
                console.log("add Event scope");
                console.log (data['players_yes']);
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
                console.log($window.sessionStorage.getItem('token'));
              //  $scope.todos = data;
                $scope.comments = data;
                console.log("add commment");
                console.log (data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };


    $scope.addInvite = function() {
        $http({
                method: 'POST',
                url: 'http://localhost:8080/api/addinvite/' + $routeParams.event_id,
                data: 'text=' + $scope.formData.text,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                console.log($window.sessionStorage.getItem('token'));
              //  $scope.todos = data;
                $scope.comments = data;
                console.log("add invite");
                console.log (data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };


}]);

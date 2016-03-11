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
	.when('/invited_list/:event_id', {
		templateUrl: 'invited_list.html',
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
       $window.sessionStorage['token'] = null;
       $rootScope.isUserLoggedIn = false;
          //  $window.sessionStorage.setItem('token', data.token);
       $location.url('/login');
    }

    $scope.display_reg_form = function () {
       $scope.showRegToInvite = true;
       $scope.showLoginToInvite = false;
    }

    $scope.display_login_form = function () {
       $scope.showRegToInvite = false;
       $scope.showLoginToInvite = true;
    }

    $scope.invite_accept = function (event_id) {
       console.log ("invite accept");
       console.log ($routeParams.invite_code);
            $http({
                method: 'GET',
                url: 'http://localhost:8080/api/change_invite_status/' + $routeParams.invite_code ,
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
           //     $scope.events = data;
                console.log("invite 999999 acccccccccepted");
         //          $location.url('/events/' + event_id);
                   $location.url('/events/' + event_id);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
/*
            $http({
                method: 'GET',
                url: 'http://localhost:8080/api/adduserevent/' + event_id + '/invited' ,
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.events = data;
                console.log("invite acccccccccepted");
                   $location.url('/events/' + event_id);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
*/
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
                $scope.events = data;
                console.log("invite scoppppppppe");
            //$rootScope.isUserLoggedIn = true;
                console.log (data.invite_status);
                //console.log ($window.sessionStorage.getItem('token').length);
                if (data.invite_status == 'Opened' || data.invite_status == 'Sent') {
                  if ($window.sessionStorage.getItem('token') == null  ) {   
                  
                    $scope.showRegToInvite = true;
                console.log("nulllllll token");
                  } else {
                  if ($window.sessionStorage.getItem('token').length > 5) {   
                    $scope.showAcceptInvite = true;
                    $scope.showRegToInvite = false;
                   console.log("wowowowowo");
                 //  $location.url('/events/38');
                  } else {
                   console.log("99999999wowowowowo");
                    $scope.showLoginToInvite = true;
                  }
                  }
                } else {
                    $scope.showAlreadyAccepted = true;
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    }

    $scope.deleteTodo = function(id) {
        $http.delete('/api/events/' + id)
            .success(function(data) {
                $scope.events = data;
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
            console.log(data);
            if (data.message == "User already exists.") {
              $scope.reg_message = "User already exists."    
            }
          //  $window.sessionStorage.setItem('token', data.token);
//            $scope.isUserLoggedIn = true;
            if (data.success == true) {
              console.log("kkmkmkoooo");
              $scope.showRegToInvite = false;
              $scope.showLoginToInvite = true;
              $window.location.reload();
             // $location.url('/login');
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
            //  $location.url('/event_list');
           //   $location.url('/invite/e4d091cc');
                $window.location.reload();
            } else {
              $scope.login_message = data.message    
            }

        });
    }

    $scope.getEventList = function() {
        $http({
                method: 'GET',
                url: 'http://localhost:8080/api/my_event_list/',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.events = data['my_events'];
                console.log("get Event Lissssssssst scope");
            $rootScope.isUserLoggedIn = true;
                console.log (data['my_events']);
                
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    $scope.getInvites = function(id) {
        $http({
                method: 'GET',
                url: 'http://localhost:8080/api/invited/' + $routeParams.event_id,
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                
                $scope.event_id = $routeParams.event_id;
                $scope.invites = data['invites']; 
                if ( data['event'][0].event_creator == data['logged_in_userid']){
                $rootScope.isEventCreator = true;
                } 
      /*
                $scope.event_title = data['event'][0].event_title; 
                console.log (data['event'][0].event_title);
                $scope.yeses = data['players_yes'];
                $scope.nos = data['players_no'];
                $scope.comments = data['comments'];
                console.log("get Event 9999 scope");
     */
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
                url: 'http://localhost:8080/api/geteventdata/' + $routeParams.event_id,
              //  url: 'http://localhost:8080/api/events/' + $routeParams.event_id,
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
  
                $scope.event_id = $routeParams.event_id;
                $scope.event_title = data['event'][0].event_title; 
                $scope.event_creator_username = data['event'][0].event_creator_username; 
                console.log (data['players_list']);
                console.log (data['event'][0].event_creator);
                $scope.yeses = data['players_yes'];
                $scope.nos = data['players_no'];
                $scope.comments = data['comments'];
                $scope.loggedInUsername = data['logged_in_username']; 
                $rootScope.isUserLoggedIn = true;
                console.log (data);
                if (data['players_list'] != null) {
                  if ( data['players_list'].user_id == data['logged_in_userid']){
                  console.log("is a member");
                  $rootScope.isMember = true;
                  } 
                }else{
                  $rootScope.isMember = false;
                }  
                if ( data['event'][0].event_creator == data['logged_in_userid']){
                $rootScope.isEventCreator = true;
                $rootScope.isMember = true;
                } 
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
           //     $scope.yeses = data['players_yes'];
           //     $scope.nos = data['players_no'];
           //     console.log("add Event scope");
           //     console.log (data['players_yes']);
                console.log("add 99999 Event scope");
  
               $scope.getEvent();
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };


    $scope.createTodo = function() {
        $http({
                method: 'POST',
                url: 'http://localhost:8080/api/new_event',
                data: 'text=' + $scope.formData.text,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.events = data;
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
               $scope.getEvent();
              //  console.log($window.sessionStorage.getItem('token'));
              //  $scope.todos = data;
           //     $scope.comments = data;
            //    console.log("add commment");
             //   console.log (data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };


    $scope.addInvite = function() {
        $http({
                method: 'POST',
                url: 'http://localhost:8080/api/addinvite/' + $routeParams.event_id,
                data: 'text=' + $scope.formData.text + '&email=' + $scope.formData.email,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                console.log("add invite");
              //  $scope.todos = data;
                //$scope.comments = data;
                $scope.getInvites();
            //    $scope.invites = data; 
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };


}]);

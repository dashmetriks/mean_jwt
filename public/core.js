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
	//		$location.url('/login');
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
    $scope.formData1 = {};

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

    
    $scope.invite_open_tmp = function (id,ustatus) {
      $scope.showAcceptInvite = true;
      $scope.ustatus = ustatus
      $scope.event_id = id
    }
    $scope.invite_change = function () {
      $scope.showAcceptInvite = true;
      $scope.newInvite = true;
    //  $scope.ustatus = ustatus
      //$scope.event_id = id
    }

    $scope.invite_open = function (ustatus) {
      $scope.showAcceptInvite = true;
      $scope.ustatus = ustatus
  //  $scope.invite_check = function () {
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
                console.log (data);
                //console.log ($window.sessionStorage.getItem('token').length);
                if (data.invite_status == 'Opened' || data.invite_status == 'Sent') {
                  //if ($window.sessionStorage.getItem('token') == null  ) {   
                 //   $scope.showRegToInvite = true;
                //  } else {
                 // if ($window.sessionStorage.getItem('token').length > 5) {   
             //       $scope.showAcceptInvite = false;
                  //  $scope.invited_name = data.invited;
                  $scope.invited =  {username: data.invited, email: data.invited_email }
                  $scope.set = function(invited_username) {
                    this.invited.username = invited_username;
                  }
                  $scope.set = function(invited_email) {
                    this.invited.email = invited_email;
                  }
                   $scope.checkboxModel = {
                     rsvp : 'NO',
                     comment_alert : 'NO',
                   };
                 //   $scope.showRegToInvite = false;
                //  } else {
               //     $scope.showLoginToInvite = true;
                //  }
                 // }
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

    $scope.checkLogin = function() {
        $http({
            method: 'GET',
            url: 'http://localhost:8080/api/userget/',
             headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
        }).success(function(data) {
            console.log(data['user'][0]['email']);
            if (data['user'][0]['email']) { 
              console.log("kkmkmkoooo");
              $scope.showLoginToInvite = false;
            } else {
$scope.showLoginToInvite = true;

            }
/*
            if (data.success == true) {
              $window.sessionStorage.setItem('token', data.token);
            //  $location.url('/event_list');
           //   $location.url('/invite/e4d091cc');
                $window.location.reload();
            } else {
              $scope.login_message = data.message    
            }
*/
        })
        .error(function(data) {
$scope.showLoginToInvite = true;
                console.log('Error: ' + data);
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
                url: 'http://localhost:8080/api/my_event_list2/',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.events = data['my_events'];
                $scope.events_invite = data['event_invites'][0];
                console.log("get Event Lissssssssst scope");
            $rootScope.isUserLoggedIn = true;
                console.log (data['event_invites'][0]);
                
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
                
                $scope.invite_code = data['invite_creator']['invite_code']
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

    $scope.getEventInvite = function(id) {
        $http({
                method: 'GET',
                url: 'http://localhost:8080/geteventinvite/' + $routeParams.invite_code,
              //  url: 'http://localhost:8080/api/events/' + $routeParams.event_id,
                headers: {
                    'Content-Type': 'application/json',
                //    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
  
                console.log ("dedededededeedededededededede")
                $scope.invite_code =  $routeParams.invite_code
                $scope.wtf = "lets do this" 
              //  $scope.widget = {title: 'abc444'};
        
      //  $scope.set = function(new_title) {
       //     this.widget.title = new_title;
      //  }
                console.log (data)
             //   $scope.event_id = $routeParams.event_id;
                $scope.event_title = data['event'][0].event_title; 
                $scope.event_date = data['event'][0].event_start; 
                $scope.event_creator_username = data['event'][0].event_creator_username; 
                $scope.event_creator_id = data['event'][0].event_creator;
                console.log (data['is_member']);
                console.log (data['event'][0].event_creator);
                $scope.event_id = data['event'][0]._id;
                $scope.yeses = data['players_yes'];
                $scope.nos = data['players_no'];
                $scope.players_list = data['players_list'];
                $scope.comments = data['comments'];
                $scope.loggedInUsername = data['logged_in_username']; 
              //  $rootScope.isUserLoggedIn = true;
                //if (data['is_member'] == null) {
                if(data['is_member'].length > 0){  
                  $scope.invited = {username: data['is_member'][0].username, email: data['is_member'][0].email };
                  $scope.set = function(invited_username) {
                    this.invited.username = invited_username;
                  }
                  $scope.set = function(invited_email) {
                    this.invited.email = invited_email;
                  }
                  $scope.checkboxModel = {
                     rsvp : data['is_member'][0].notice_rsvp ,
                     comment_alert : data['is_member'][0].notice_comments 
                  };

                  $scope.invited_reply = data['is_member'][0].in_or_out;
                  $scope.ustatus = data['is_member'][0].in_or_out;
                  $rootScope.isMember = true;
                  $rootScope.newInvite = false;
                  console.log(" is a member");
                }else{
                  console.log("not is a member");
                  $rootScope.isMember = false;
                  $rootScope.newInvite = true;
                }  
                if ( data['event'][0].event_creator == data['logged_in_userid']){
                  console.log(" is a dkdkkasdkfsdakfasdkfkaskdfaksfkasdk");
                $rootScope.isEventCreator = true;
                $rootScope.isMember = true;
                } 
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
    $scope.getEvent = function(id) {
       console.log($scope)
        $http({
                method: 'GET',
                url: 'http://localhost:8080/api/geteventdata/' + $routeParams.event_id,
              //  url: 'http://localhost:8080/api/events/' + $routeParams.event_id,
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.event_title = data['event'][0].event_title; 
                $scope.event_date = data['event'][0].event_start; 
                $scope.event_creator_username = data['event'][0].event_creator_username; 
                $scope.event_creator_id = data['event'][0].event_creator;
                console.log (data['is_member']);
                console.log (data['event'][0].event_creator);
                $scope.event_id = data['event'][0]._id;
                $scope.yeses = data['players_yes'];
                $scope.nos = data['players_no'];
                $scope.comments = data['comments'];
                $scope.loggedInUsername = data['logged_in_username']; 
              //  $rootScope.isUserLoggedIn = true;
                //if (data['is_member'] == null) {
                if(data['is_member'].length > 0){  
                  $scope.invited = {username: data['is_member'][0].username, email: data['is_member'][0].email, invite_code: data['is_member'][0].invite_code };
                  $scope.set = function(invited_username) {
                    this.invited.username = invited_username;
                  }
                  $scope.set = function(invited_email) {
                    this.invited.email = invited_email;
                  }
                  $scope.set = function(invite_code) {
                    this.invited.code = invite_code;
                  }
                  $scope.checkboxModel = {
                     rsvp : data['is_member'][0].notice_rsvp ,
                     comment_alert : data['is_member'][0].notice_comments 
                  };

                  $scope.invited_reply = data['is_member'][0].in_or_out;
                  $scope.ustatus = data['is_member'][0].in_or_out;
                  $rootScope.isMember = true;
                  $rootScope.newInvite = false;
                  console.log(" is a member");
                }else{
                  console.log("not is a member");
                  $rootScope.isMember = false;
                  $rootScope.newInvite = true;
                }  
                if ( data['event'][0].event_creator == data['logged_in_userid']){
                $rootScope.isEventCreator = true;
                $rootScope.isMember = true;
                } 
 /* 
                console.log (data)
                $scope.event_id = $routeParams.event_id;
                $scope.event_title = data['event'][0].event_title; 
                $scope.event_creator_username = data['event'][0].event_creator_username; 
                console.log (data['is_member']);
                console.log (data['event'][0].event_creator);
                $scope.yeses = data['players_yes'];
                $scope.nos = data['players_no'];
                $scope.comments = data['comments'];
                $scope.loggedInUsername = data['logged_in_username']; 
                $rootScope.isUserLoggedIn = true;
                //console.log (data);
                if (data['is_member'] != null) {
                 // if ( data['players_list'].user_id == data['logged_in_userid']){
                  console.log("is a member");
                  $rootScope.isMember = true;
                //  } 
                }else{
                  $rootScope.isMember = false;
                }  
                if ( data['event'][0].event_creator == data['logged_in_userid']){
                $rootScope.isEventCreator = true;
                $rootScope.isMember = true;
                } 
*/
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    $scope.addEvent = function(id,ustatus) {
       if (ustatus == 'none'){
          Comments = $scope.formData.comments
       }else{
          Comments = $scope.formData.text
      }
          
       
        $http({
                method: 'POST',
                url: 'http://localhost:8080/adduserevent2/' + id + '/' + ustatus + '/' + $routeParams.invite_code,
             //   data: 'username=' + $scope.formData1.text + '&comment=' + $scope.formData.text,
              //  data: 'username=' + $scope.invited.username + '&comment=' + $scope.formData.text + '&rsvp=' + $scope.checkboxModel.rsvp +  '&comment_alert=' + $scope.checkboxModel.comment_alert + '&email=' + $scope.invited.email ,
                data: 'username=' + $scope.invited.username + '&comment=' + Comments + '&rsvp=' + $scope.checkboxModel.rsvp +  '&comment_alert=' + $scope.checkboxModel.comment_alert + '&email=' + $scope.invited.email ,
   
              //  data: 'username=' + $scope.formData1.text,
                headers: {
                 //   'Content-Type': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
           //         'x-access-token': $window.sessionStorage.getItem('token')
                }
            }).success(function(data) {
               //$scope.getEvent();
               // $scope.events = data;
              //  $scope.yeses = data['players_yes'];
             //   $scope.nos = data['players_no'];
              //  $scope.comments = data['comments'];
             //  console.log($scope)
            //   console.log(data['players_yes'])
             //   $scope.$apply();
           //    $scope.invite_check();
               $scope.showAcceptInvite = false;
               $scope.newInvite = false;
               $scope.getEventInvite();
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

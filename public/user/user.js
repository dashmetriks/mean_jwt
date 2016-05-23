angular.module('envite.user', [ 'ngRoute' ])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/login', {
      templateUrl: 'user/login.html',
      controller: 'userController'
    })
    .when('/register', {
      templateUrl: 'user/register.html',
      controller: 'userController'
    })
    .when('/user', {
      templateUrl: 'user/user_account.html',
      controller: 'userController'
    })
}])

.controller('userController', ['$scope', '$http', '$window', '$location', '$routeParams', '$rootScope',
    function($scope, $http, $window, $location, $routeParams, $rootScope) {
        $scope.form = {};
        var that = this;


        $scope.logOut = function() {
            $window.localStorage['token'] = null;
            $rootScope.isUserLoggedIn = false;
            $location.url('/login');
        }

        $scope.display_reg_form = function() {
            $scope.showRegToInvite = true;
            $scope.showLoginToInvite = false;
        }

        $scope.display_login_form = function() {
            $scope.showRegToInvite = false;
            $scope.showLoginToInvite = true;
        }


        $scope.loginForm = function() {
                $rootScope.showLoginlink = false;
        }

        $scope.password_change = function() {
                $scope.changePassword = $scope.changePassword === true ? false : true;
        }


        $scope.save_password = function() {
          $scope.submitted = true;
          if ($scope.fields.password.length < 1){
             $scope.noPassword = true;
          } else {
            $http({
                method: 'POST',
                url: express_endpoint + '/api/passwordsave',
                data: '&password=' + $scope.fields.password,
                headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                }
            }).success(function(data) {
                $scope.changePassword = $scope.changePassword === true ? false : true;
                $rootScope.reg_message_success = "Password has been changed."
                if (data.success == true) {
                //  $rootScope.reg_message_success = "Thanks for registering. Please confirm your Display Name"
               //   $scope.login();
                }
            });
        }
        }
        $scope.register = function() {
          $scope.submitted = true;
          if ($scope.fields.password.length < 1){
             $scope.noPassword = true;
          } else {
            $http({
                method: 'POST',
                url: express_endpoint + '/register',
                data: 'name=' + $scope.user.username + '&password=' + $scope.fields.password,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data) {
                if (data.message == "User already exists.") {
                    $scope.reg_message = "User already exists."
                }
                if (data.success == true) {
                  $rootScope.reg_message_success = "Thanks for registering. Please confirm your Display Name"
                  $scope.login();
                }
            });
        }
        }

        $scope.checkLogin = function() {
            $http({
                    method: 'GET',
                    url: express_endpoint + '/api/userget/',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    if (data['user'][0]['username']) {
                        $scope.username = data['user'][0].username
                        if (data['user'][0].displayname) {
                            $scope.displayname = data['user'][0].displayname;
                        } else {
                            $scope.displayname = data['user'][0].username.split('@')[0];
                        }
                        $scope.showLoginToInvite = false;
                    } else {
                        $scope.showLoginToInvite = true;
                    }
                })
                .error(function(data) {
                    $scope.showLoginToInvite = true;
                    console.log('Error: ' + data);
                });
        }

        $scope.userSave = function() {
            $http({
                    method: 'POST',
                    url: express_endpoint + '/api/usersave/',
                    data: 'username=' + $scope.username + '&displayname=' + $scope.displayname,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    if ($rootScope.reg_message_success){
                       $rootScope.reg_message_success = null;
                    }
                    $location.url('/event_list');
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

        $scope.login = function() {
          console.log("sadfasfdasfdsaf")
          $scope.submitted = true;
          if ($scope.fields.password.length < 1){
             $scope.noPassword = true;
          } else {
            $http({
                method: 'POST',
                url: express_endpoint + '/authenticate',
                //data: 'name=' + $scope.user.username + '&password=' + $scope.user.password,
                data: 'name=' + $scope.user.username + '&password=' + $scope.fields.password,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data) {
                if (data.success == true) {
                    $window.localStorage.setItem('token', data.token);
  
                    $rootScope.isUserLoggedIn = true;

                    if (data.user_displayname) {
                        $location.url('/event_list');
                    } else {
                        $location.url('/user');
                    }
                } else {
                    $scope.login_message = data.message
                }

            });
        }
        }

    }
]);

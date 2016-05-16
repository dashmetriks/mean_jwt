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

var envite = angular.module('envite', ['ui.bootstrap', 'ui.bootstrap.datetimepicker', 'ngRoute']);

(function(module) {

    var fileReader = function($q, $log) {

        var onLoad = function(reader, deferred, scope) {
            return function() {
                scope.$apply(function() {
                    deferred.resolve(reader.result);
                });
            };
        };

        var onError = function(reader, deferred, scope) {
            return function() {
                scope.$apply(function() {
                    deferred.reject(reader.result);
                });
            };
        };

        var onProgress = function(reader, scope) {
            return function(event) {
                scope.$broadcast("fileProgress", {
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

        var readAsDataURL = function(file, scope) {
            var deferred = $q.defer();

            var reader = getReader(deferred, scope);
            reader.readAsDataURL(file);

            return deferred.promise;
        };

        return {
            readAsDataUrl: readAsDataURL
        };
    };

    module.factory("fileReader", ["$q", "$log", fileReader]);

}(angular.module("envite")));

var UploadController = function($scope, fileReader) {
    $scope.getFile = function() {
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

envite.directive("ngFileSelect", function() {

    return {
        link: function($scope, el) {

            el.bind("change", function(e) {

                $scope.file = (e.srcElement || e.target).files[0];
                $scope.getFile();
            })

        }

    }
});

envite.directive('match', function($parse) {
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



envite.config(function($httpProvider) {
    $httpProvider.interceptors.push(interceptor);
});

envite.config(['$locationProvider', '$routeProvider',
    function($locationProvider, $routeProvider) {
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
            .when('/user', {
                templateUrl: 'user_account.html',
                controller: 'mainController'
            })
            .when('/register', {
                templateUrl: 'register.html',
                controller: 'mainController'
            })
            .when('/register2', {
                templateUrl: 'register2.html',
                controller: 'mainController'
            })
            .otherwise({
                redirectTo: '/event_list'
            });
        $locationProvider.html5Mode(true);
    }
]);

envite.controller('mainController', ['$scope', '$http', '$window', '$location', '$routeParams', '$rootScope',
    function($scope, $http, $window, $location, $routeParams, $rootScope) {

        $scope.form = {};
        var that = this;

        var in10Days = new Date();
        in10Days.setDate(in10Days.getDate() + 10);

        this.dates = {
            date1: new Date('2015-03-01T00:00:00Z'),
            date2: new Date('2015-03-01T12:30:00Z'),
            date3: new Date(),
            date4: new Date(),
            date5: in10Days,
            date6: new Date(),
            date7: new Date(),
            date8: new Date(),
            date9: null,
            date10: new Date('2015-03-01T09:00:00Z'),
            date11: new Date('2015-03-01T10:00:00Z')
        };

        this.open = {
            date1: false,
            date2: false,
            date3: false,
            date4: false,
            date5: false,
            date6: false,
            date7: false,
            date8: false,
            date9: false,
            date10: false,
            date11: false
        };

        // Disable today selection
        this.disabled = function(date, mode) {
            return (mode === 'day' && (new Date().toDateString() == date.toDateString()));
        };

        this.dateOptions = {
            showWeeks: false,
            startingDay: 1
        };

        this.timeOptions = {
            readonlyInput: false,
            showMeridian: false
        };

        this.dateModeOptions = {
            minMode: 'year',
            maxMode: 'year'
        };

        this.openCalendar = function(e, date) {
            that.open[date] = true;
        };

        // watch date4 and date5 to calculate difference
        var unwatch = $scope.$watch(function() {
            return that.dates;
        }, function() {
            if (that.dates.date4 && that.dates.date5) {
                var diff = that.dates.date4.getTime() - that.dates.date5.getTime();
                that.dayRange = Math.round(Math.abs(diff / (1000 * 60 * 60 * 24)))
            } else {
                that.dayRange = 'n/a';
            }
        }, true);

        $scope.$on('$destroy', function() {
            unwatch();
        });

        $scope.formData = {};
        $scope.formData1 = {};
        $scope.fields = {
          password: '',
          passwordConfirm: ''
        };

        $scope.submitForm = function(isValid) {
          $scope.submitted = true;

    // check to make sure the form is completely valid
    if (isValid) {
      alert('our form is amazing');
    }

  };

  
  $scope.submit = function() {
    alert("Submit!");
  };

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

        $scope.invite_accept = function(event_id) {
            $http({
                    method: 'GET',
                    url: express_endpoint + '/api/change_invite_status/' + $routeParams.invite_code,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    $location.url('/events/' + event_id);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        }


        $scope.editEvent = function() {
            $scope.eventEdit = 'YES';
            $scope.event_data = {
                event_title: $scope.event_title,
                event_date: $scope.event_date,
                event_location: $scope.event_location
            }
            $scope.set = function(event_title) {
                this.event_data.event_title = event_title;
            }
            $scope.set = function(event_location) {
                this.event_data.event_location = event_location;
            }
            $scope.set = function(event_date) {
                this.event_data.event_date = event_date;
            }
        }

        $scope.cancelEditEvent = function() {
            $scope.eventEdit = 'NO';
        }
        $scope.loginForm = function() {
                $rootScope.showLoginlink = false;
        }

        $scope.invite_change = function() {
            $scope.newInvite = false;

            if ($rootScope.isUserLoggedIn == true) {
                $scope.changeSettings = $scope.changeSettings === true ? false : true;
                $scope.showAcceptInvite = false;
            } else if ($rootScope.isMember == true) {
                $scope.changeSettingsAnon = $scope.changeSettingsAnon === true ? false : true;
                $scope.changeSettings = false;
                $scope.showAcceptInvite = false;
            } else {
                $scope.changeSettings = false;
                $scope.showAcceptInvite = true;
            }
        }

        $scope.invite_open = function(ustatus) {
            $scope.showAcceptInvite = true;
            $scope.ustatus = ustatus
            $http({
                    method: 'GET',
                    url: express_endpoint + '/invites/' + $routeParams.invite_code
                }).success(function(data) {
                    $scope.events = data;
                    if (data.invite_status == 'Opened' || data.invite_status == 'Sent') {
                        $scope.invited = {
                            username: data.invited_email,
                            displayname: data.invited
                        }
                        $scope.set = function(invited_username) {
                            this.invited.username = invited_username;
                        }
                        $scope.set = function(invited_email) {
                            this.invited.displayname = invited_displayname;
                        }
                        $scope.checkboxModel = {
                            rsvp: 'NO',
                            comment_alert: 'NO',
                        };
                        $scope.set = function(invited_rsvp) {
                            this.checkboxModel.rsvp = invited_rsvp;
                        }
                        $scope.set = function(invited_comment_alert) {
                            this.checkboxModel.comment_alert = invited_comment_alert;
                        }

                    } else {
                        $scope.showAlreadyAccepted = true;
                    }
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        }

        $scope.deleteEventConfirm = function(id) {
            if ($scope.showDeleteEvent == true) {
                $scope.showDeleteEvent = false;
            } else {
                $scope.showDeleteEvent = true;
            }
            $scope.showDeleteEventid = id;

        };


        $scope.deleteEvent = function(id) {
            $http({
                    method: 'DELETE',
                    url: express_endpoint + '/api/events/' + id,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    $scope.getEventList();
                    $scope.showDeleteEvent = false;
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

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
                //    $scope.showRegToInvite = false;
               //     $scope.showLoginToInvite = true;
                //    $location.url('/login');
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


        $scope.getEventList = function() {
            $http({
                    method: 'GET',
                    url: express_endpoint + '/api/my_event_list2/',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    $scope.events = data['my_events'];
                    $scope.events_invite = data['event_invites'][0];
                    $rootScope.isUserLoggedIn = true;

                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

        $scope.getInvites = function(id) {
            $http({
                    method: 'GET',
                    url: express_endpoint + '/api/invited/' + $routeParams.event_id,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {

                    $scope.invite_code = data['invite_creator']['invite_code']
                    $scope.event_id = $routeParams.event_id;
                    $scope.invites = data['invites'];
                    if (data['event'][0].event_creator == data['logged_in_userid']) {
                        $rootScope.isEventCreator = true;
                    }
                    $rootScope.isUserLoggedIn = true;

                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

        $scope.getEventInvite = function(id) {
            if ($window.localStorage.getItem('token') == null) {
                $rootScope.showLoginlink = true;
                var endpoint = express_endpoint + '/geteventinviteanon/' + $routeParams.invite_code
                var head = {
                    'Content-Type': 'application/json'
                }
            } else if ($window.localStorage.getItem('token').length < 10) {
                $rootScope.showLoginlink = true;
                var endpoint = express_endpoint + '/geteventinviteanon/' + $routeParams.invite_code
                var head = {
                    'Content-Type': 'application/json'
                }
            } else {
                var endpoint = express_endpoint + '/api/geteventinvite/' + $routeParams.invite_code
                var head = {
                    'Content-Type': 'application/json',
                    'x-access-token': $window.localStorage.getItem('token')
                }
                $rootScope.isUserLoggedIn = true;
            }
            $http({
                    method: 'GET',
                    url: endpoint,
                    headers: head
                }).success(function(data) {
                    $scope.event_title = data['event'][0].event_title;
                    $scope.event_date = data['event'][0].event_start;
                    $scope.event_creator_displayname = data['event'][0].event_creator_displayname;
                    $scope.event_creator_id = data['event'][0].event_creator;
                    $scope.event_location = data['event'][0].event_location;
                    $scope.event_id = data['event'][0]._id;
                    $scope.yeses = data['players_yes'];
                    $scope.nos = data['players_no'];
                    $scope.players_list = data['players_list'];
                    $scope.comments = data['comments'];
                    $scope.loggedInUsername = data['logged_in_username'];
                    if (data['is_member'].length > 0) {
                        $scope.invited = {
                            username: data['is_member'][0].username,
                            displayname: data['is_member'][0].displayname
                        };
                        $scope.set = function(invited_username) {
                            this.invited.username = invited_username;
                        }
                        $scope.set = function(invited_displayname) {
                            this.invited.displayname = invited_displayname;
                        }
                        $scope.checkboxModel = {
                            rsvp: data['is_member'][0].notice_rsvp,
                            comment_alert: data['is_member'][0].notice_comments
                        };

                        $scope.invited_reply = data['is_member'][0].in_or_out;
                        $scope.invite_code = data['is_member'][0].invite_code;
                        $scope.ustatus = data['is_member'][0].in_or_out;
                        $rootScope.isMember = true;
                        $rootScope.newInvite = false;
                    } else {
                        $rootScope.isMember = false;
                        $rootScope.newInvite = true;
                    }
                    if (data['event'][0].event_creator == data['logged_in_userid']) {
                        $rootScope.isEventCreator = true;
                        $rootScope.isMember = true;
                    }
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };


        $scope.getEvent = function(id) {
            $http({
                    method: 'GET',
                    url: express_endpoint + '/api/geteventdata/' + $routeParams.event_id,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    $scope.event_title = data['event'][0].event_title;
                    $scope.event_date = data['event'][0].event_start;
                    $scope.event_creator_displayname = data['event'][0].event_creator_displayname;
                    $scope.event_creator_id = data['event'][0].event_creator;
                    $scope.event_id = data['event'][0]._id;
                    $scope.yeses = data['players_yes'];
                    $scope.nos = data['players_no'];
                    $scope.comments = data['comments'];
                    $scope.loggedInUsername = data['logged_in_username'];
                    if (data['is_member'].length > 0) {
                        $scope.invited = {
                            username: data['is_member'][0].username,
                            email: data['is_member'][0].email,
                            invite_code: data['is_member'][0].invite_code
                        };
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
                            rsvp: data['is_member'][0].notice_rsvp,
                            comment_alert: data['is_member'][0].notice_comments
                        };

                        $scope.invited_reply = data['is_member'][0].in_or_out;
                        $scope.ustatus = data['is_member'][0].in_or_out;
                        $rootScope.isMember = true;
                        $rootScope.newInvite = false;
                    } else {
                        $rootScope.isMember = false;
                        $rootScope.newInvite = true;
                    }
                    if (data['event'][0].event_creator == data['logged_in_userid']) {
                        $rootScope.isEventCreator = true;
                        $rootScope.isMember = true;
                    }
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

        $scope.addEvent = function(id, ustatus, commentsForm) {
            if (ustatus == 'none') {
                Comments = $scope.formData.comments
            } else {
                Comments = $scope.formData.text
            }

            $http({
                    method: 'POST',
                    url: express_endpoint + '/adduserevent2/' + id + '/' + ustatus + '/' + $routeParams.invite_code,
                    data: 'username=' + $scope.invited.username + '&comment=' + Comments + '&rsvp=' + $scope.checkboxModel.rsvp + '&comment_alert=' + $scope.checkboxModel.comment_alert + '&displayname=' + $scope.invited.displayname + '&create_account=' + $scope.checkboxModel.create_account,

                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                }).success(function(data) {
                    if (Comments) {
                        $scope.form.myForm2.$setPristine();
                        delete $scope.formData.comments
                        delete $scope.formData.text
                    }
                    $scope.showAcceptInvite = false;
                    $scope.changeSettingsAnon = false;
                    $scope.changeSettings = false;
                    $scope.newInvite = false;
                    $scope.getEventInvite();
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };


        $scope.createEvent = function() {
          $scope.submitted = true;
          if ($scope.formData.text.length < 1){
             $scope.noEventTitle = true;
          } else {
            $http({
                    method: 'POST',
                    url: express_endpoint + '/api/new_event',
                    data: 'text=' + $scope.formData.text + '&event_start=' + $scope.ctrl.dates.date3 + '&event_location=' + $scope.formData.event_location,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    $scope.getEventList();

          $scope.submitted = false;
                    delete $scope.formData.text
                    delete $scope.formData.event_location
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        }
        };

        $scope.editEventSave = function() {
            $http({
                    method: 'POST',
                    url: express_endpoint + '/api/eventsave/' + $scope.event_id,
                    data: 'event_title=' + $scope.event_data.event_title + '&event_start=' + $scope.event_data.event_date + '&event_location=' + $scope.event_data.event_location,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    $scope.eventEdit = 'NO';
                    $scope.getEventInvite();
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

        $scope.addComment = function() {
            $http({
                    method: 'POST',
                    url: express_endpoint + '/api/addcomment/' + $routeParams.event_id,
                    data: 'text=' + $scope.formData.text,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    $scope.getEvent();
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };


        $scope.addInvite = function() {
            $http({
                    method: 'POST',
                    url: express_endpoint + '/api/addinvite/' + $routeParams.event_id,
                    data: 'text=' + $scope.formData.text + '&email=' + $scope.formData.email,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    delete $scope.formData.text
                    delete $scope.formData.email
                    $scope.getInvites();
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };


    }
]);

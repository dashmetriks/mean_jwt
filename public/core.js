var interceptor = function($q, $location) {
    return {
        request: function(config) {
            console.log(config);
            return config;
        },

        response: function(result) {
            console.log('Repos:');
            //    result.data.splice(0, 10).forEach(function (repo) {
            //       console.log(repo.name);
            //    })
            return result;
        },

        responseError: function(rejection) {
            console.log('Failed with', rejection.status, 'status');
            if (rejection.status == 403) {
                //    $location.url('/login');
            }

            return $q.reject(rejection);
        }
    }
};


//var express_endpoint = "http://dashmetriks.com:3000"
var express_endpoint = "http://localhost:8080"

var scotchTodo = angular.module('scotchTodo', ['ui.bootstrap', 'ui.bootstrap.datetimepicker', 'ngRoute']);

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

}(angular.module("scotchTodo")));

var UploadController = function($scope, fileReader) {
    console.log(fileReader)
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

scotchTodo.directive("ngFileSelect", function() {

    return {
        link: function($scope, el) {

            el.bind("change", function(e) {

                $scope.file = (e.srcElement || e.target).files[0];
                $scope.getFile();
            })

        }

    }


});


scotchTodo.config(function($httpProvider) {
    $httpProvider.interceptors.push(interceptor);
});

scotchTodo.config(['$locationProvider', '$routeProvider',
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
            .otherwise({
                redirectTo: '/event_list'
            });
        $locationProvider.html5Mode(true);
    }
]);

scotchTodo.controller('mainController', ['$scope', '$http', '$window', '$location', '$routeParams', '$rootScope',
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

        $scope.logOut = function() {
            $window.localStorage['token'] = null;
            $rootScope.isUserLoggedIn = false;
            //  $window.sessionStorage.setItem('token', data.token);
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
            console.log("invite accept");
            console.log($routeParams.invite_code);
            $http({
                    method: 'GET',
                    url: express_endpoint + '/api/change_invite_status/' + $routeParams.invite_code,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': $window.localStorage.getItem('token')
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
                            url: 'http://dashmetriks.com:3000/api/adduserevent/' + event_id + '/invited' ,
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


        $scope.editEvent = function() {
            $scope.eventEdit = 'YES';
            console.log($scope.event_title);
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
        $scope.invite_change = function() {
            $scope.newInvite = false;

            console.log($rootScope.isUserLoggedIn)
            if ($rootScope.isUserLoggedIn == true) {
                $scope.changeSettings = $scope.changeSettings === true ? false : true;
                $scope.showAcceptInvite = false;
            } else if ($rootScope.isMember == true) {
                console.log("nooooo")
                $scope.changeSettingsAnon = $scope.changeSettingsAnon === true ? false : true;
                $scope.changeSettings = false;
                $scope.showAcceptInvite = false;
            } else {
                $scope.changeSettings = false;
                $scope.showAcceptInvite = true;
            }
            //  $scope.ustatus = ustatus
            //$scope.event_id = id
        }

        $scope.invite_open = function(ustatus) {
            $scope.showAcceptInvite = true;
            $scope.ustatus = ustatus
                //  $scope.invite_check = function () {
            console.log("invite check");
            console.log($routeParams.invite_code);
            $http({
                    method: 'GET',
                    url: express_endpoint + '/invites/' + $routeParams.invite_code
                        //     headers: {
                        //        'Content-Type': 'application/json',
                        //    }
                }).success(function(data) {
                    $scope.events = data;
                    console.log("invite scoppppppppe");
                    //$rootScope.isUserLoggedIn = true;
                    console.log(data.invite_status);
                    console.log(data);
                    //console.log ($window.sessionStorage.getItem('token').length);
                    if (data.invite_status == 'Opened' || data.invite_status == 'Sent') {
                        //if ($window.sessionStorage.getItem('token') == null  ) {   
                        //   $scope.showRegToInvite = true;
                        //  } else {
                        // if ($window.sessionStorage.getItem('token').length > 5) {   
                        //       $scope.showAcceptInvite = false;
                        //  $scope.invited_name = data.invited;



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

        $scope.deleteEventConfirm = function(id) {
            if ($scope.showDeleteEvent == true) {
                $scope.showDeleteEvent = false;
            } else {
                $scope.showDeleteEvent = true;
            }
            $scope.showDeleteEventid = id;

        };


        $scope.deleteEvent = function(id) {
            console.log("blah blah 0")
            $http({
                    method: 'DELETE',
                    url: express_endpoint + '/api/events/' + id,
                    //   data: 'name=' + $scope.user.username + '&password=' + $scope.user.password,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    console.log("blah blah")
                    $scope.getEventList();
                    $scope.showDeleteEvent = false;
                    console.log("blah blah2")
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

        $scope.register = function() {
            $http({
                method: 'POST',
                url: express_endpoint + '/register',
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
                    //   $window.location.reload();
                    $location.url('/login');
                }
            });
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
                    console.log(data);
                    if (data['user'][0]['username']) {
                        console.log("kkmkmkoooo");
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
                    // $scope.checkLogin()
                    $location.url('/event_list');
                    // $scope.user_data = data['user'][0]
                    // $scope.getEvent();
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

        $scope.login = function() {
            $http({
                method: 'POST',
                url: express_endpoint + '/authenticate',
                data: 'name=' + $scope.user.username + '&password=' + $scope.user.password,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data) {
                console.log(data);
                if (data.success == true) {
                    $window.localStorage.setItem('token', data.token);

                    if (data.user_displayname) {
                        $location.url('/event_list');
                    } else {
                        $location.url('/user');
                    }
                    //   $location.url('/invite/e4d091cc');
                    //     $window.location.reload();
                } else {
                    $scope.login_message = data.message
                }

            });
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
                    console.log("get Event Lissssssssst scope");
                    $rootScope.isUserLoggedIn = true;
                    console.log(data);

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
                    /*
                $scope.event_title = data['event'][0].event_title; 
                console.log (data['event'][0].event_title);
                $scope.yeses = data['players_yes'];
                $scope.nos = data['players_no'];
                $scope.comments = data['comments'];
                console.log("get Event 9999 scope");
     */
                    $rootScope.isUserLoggedIn = true;
                    console.log(data);

                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

        $scope.getEventInvite = function(id) {
            if ($window.localStorage.getItem('token') == null) {
                var endpoint = express_endpoint + '/geteventinviteanon/' + $routeParams.invite_code
                var head = {
                    'Content-Type': 'application/json'
                }
            } else if ($window.localStorage.getItem('token').length < 10) {
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
                        $scope.ustatus = data['is_member'][0].in_or_out;
                        $rootScope.isMember = true;
                        $rootScope.newInvite = false;
                        console.log(" is a member");
                    } else {
                        console.log("not is a member");
                        $rootScope.isMember = false;
                        $rootScope.newInvite = true;
                    }
                    console.log(data['event'][0].event_creator)
                    console.log(data['logged_in_userid'])
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
            console.log($scope)
            $http({
                    method: 'GET',
                    url: express_endpoint + '/api/geteventdata/' + $routeParams.event_id,
                    //  url: 'http://dashmetriks.com:3000/api/events/' + $routeParams.event_id,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    console.log(data['event'][0].event_creator_displayname);
                    $scope.event_title = data['event'][0].event_title;
                    $scope.event_date = data['event'][0].event_start;
                    $scope.event_creator_displayname = data['event'][0].event_creator_displayname;
                    $scope.event_creator_id = data['event'][0].event_creator;
                    console.log(data['is_member']);
                    console.log(data['event'][0].event_creator);
                    $scope.event_id = data['event'][0]._id;
                    $scope.yeses = data['players_yes'];
                    $scope.nos = data['players_no'];
                    $scope.comments = data['comments'];
                    $scope.loggedInUsername = data['logged_in_username'];
                    //  $rootScope.isUserLoggedIn = true;
                    //if (data['is_member'] == null) {
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
                        console.log(" is a member");
                    } else {
                        console.log("not is a member");
                        $rootScope.isMember = false;
                        $rootScope.newInvite = true;
                    }
                    if (data['event'][0].event_creator == data['logged_in_userid']) {
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

        $scope.addEvent = function(id, ustatus, commentsForm) {
            if (ustatus == 'none') {
                Comments = $scope.formData.comments
            } else {
                Comments = $scope.formData.text
            }

            $http({
                    method: 'POST',
                    url: express_endpoint + '/adduserevent2/' + id + '/' + ustatus + '/' + $routeParams.invite_code,
                    //   data: 'username=' + $scope.formData1.text + '&comment=' + $scope.formData.text,
                    //  data: 'username=' + $scope.invited.username + '&comment=' + $scope.formData.text + '&rsvp=' + $scope.checkboxModel.rsvp +  '&comment_alert=' + $scope.checkboxModel.comment_alert + '&email=' + $scope.invited.email ,
                    data: 'username=' + $scope.invited.username + '&comment=' + Comments + '&rsvp=' + $scope.checkboxModel.rsvp + '&comment_alert=' + $scope.checkboxModel.comment_alert + '&displayname=' + $scope.invited.displayname + '&create_account=' + $scope.checkboxModel.create_account,

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
            console.log($scope.ctrl.dates.date3)
            $http({
                    method: 'POST',
                    url: express_endpoint + '/api/new_event',
                    data: 'text=' + $scope.formData.text + '&event_start=' + $scope.ctrl.dates.date3 + '&event_location=' + $scope.formData.event_location,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    //  $scope.events = data;
                    $scope.getEventList();

                    delete $scope.formData.text
                    delete $scope.formData.event_location
                    console.log("add commment");
                    console.log(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

        $scope.editEventSave = function() {
            console.log($scope.ctrl.dates.date3)
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
                    url: express_endpoint + '/api/addinvite/' + $routeParams.event_id,
                    data: 'text=' + $scope.formData.text + '&email=' + $scope.formData.email,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'x-access-token': $window.localStorage.getItem('token')
                    }
                }).success(function(data) {
                    console.log("add invite");
                    delete $scope.formData.text
                    delete $scope.formData.email
                        //  $scope.todos = data;
                        //$scope.comments = data;
                    $scope.getInvites();
                    //    $scope.invites = data; 
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };


    }
]);

var myApp = angular.module('myApp', ['ngRoute']);
//config routing
myApp.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/', {
        redirectTo : '/home'
    })
    .when('/home', {
        templateUrl: '/template/home.html',
        controller: 'homeController'
    })
    .when('/authenticated', {
        templateUrl: '/template/authenticate.html',
        controller: 'authenticateController'
    })
    .when('/authorized', {
        templateUrl: '/template/authorize.html',
        controller: 'authorizeController'
    })
    .when('/login', {
        templateUrl: '/template/login.html',
        controller: 'loginController'
    })
    .when('/unauthorized', {
        templateUrl: '/template/unauthorize.html',
        controller: 'unauthorizeController'
    })
}])
//global veriable for store service base path
myApp.constant('serviceBasePath', 'http://localhost:25419');
//controllers
myApp.controller('homeController', ['$scope', 'dataService', function ($scope, dataService) {
    //FETCH DATA FROM SERVICES
    $scope.data = "";
    dataService.GetAnonymousData().then(function (data) {
        $scope.data = data;
    })
}])
myApp.controller('authenticateController', ['$scope', 'dataService', function ($scope, dataService) {
    //FETCH DATA FROM SERVICES
    $scope.data = "";
    dataService.GetAuthenticateData().then(function (data) {
        $scope.data = data;
    })
}])
myApp.controller('authorizeController', ['$scope', 'dataService', function ($scope, dataService) {
    //FETCH DATA FROM SERVICES
    $scope.data = "";
    dataService.GetAuthorizeData().then(function (data) {
        $scope.data = data;
    })
}])
myApp.controller('loginController', ['$scope', 'accountService','$location', function ($scope, accountService, $location) {
    //FETCH DATA FROM SERVICES
    $scope.account = {
        username: '',
        password: ''
    }
    $scope.message = "";
    $scope.login = function () {
        accountService.login($scope.account).then(function (data) {
            $location.path('/home');
        }, function (error) {
            $scope.message = error.error_description;
        })
    }
}])
myApp.controller('unauthorizeController', ['$scope', function ($scope) {
    //FETCH DATA FROM SERVICES
    $scope.data = "Sorry you are not authorize to access this page";
}])
//services
myApp.factory('dataService', ['$http', 'serviceBasePath', function ($http, serviceBasePath) {
    var fac = {};
    fac.GetAnonymousData = function () {
        return $http.get(serviceBasePath + '/api/data/forall').then(function (response) {
            return response.data;
        })
    }

    fac.GetAuthenticateData = function () {
        return $http.get(serviceBasePath + '/api/data/authenticate').then(function (response) {
            return response.data;
        })
    }

    fac.GetAuthorizeData = function () {
        return $http.get(serviceBasePath + '/api/data/authorize').then(function (response) {
            return response.data;
        })
    }
    return fac;
}])
myApp.factory('userService', function () {
    var fac = {};
    fac.CurrentUser = null;
    fac.SetCurrentUser = function (user) {
        fac.CurrentUser = user;
        sessionStorage.user = angular.toJson(user);
    }
    fac.GetCurrentUser = function () {
        fac.CurrentUser = angular.fromJson(sessionStorage.user);
        return fac.CurrentUser;
    }
    return fac;
})
myApp.factory('accountService', ['$http', '$q', 'serviceBasePath', 'userService', function ($http, $q, serviceBasePath, userService) {
    var fac = {};
    fac.login = function (user) {
        var obj = { 'username': user.username, 'password': user.password, 'grant_type': 'password' };
        Object.toparams = function ObjectsToParams(obj) {
            var p = [];
            for (var key in obj) {
                p.push(key + '=' + encodeURIComponent(obj[key]));
            }
            return p.join('&');
        }

        var defer = $q.defer();
        $http({
            method: 'post',
            url: serviceBasePath + "/token",
            data: Object.toparams(obj),
            headers : {'Content-Type' : 'application/x-www-form-urlencoded'}
        }).then(function (response) {
            userService.SetCurrentUser(response.data);
            defer.resolve(response.data);
        }, function (error) {
            defer.reject(error.data);
        })
        return defer.promise;
    }
    fac.logout = function () {
        userService.CurrentUser = null;
        userService.SetCurrentUser(userService.CurrentUser);
    }
    return fac;
}])
//http interceptor
myApp.config(['$httpProvider', function ($httpProvider) {
    var interceptor = function(userService, $q, $location)
    {
        return {
            request: function (config) {
                var currentUser = userService.GetCurrentUser();
                if (currentUser != null) {
                    config.headers['Authorization'] = 'Bearer ' + currentUser.access_token;
                }
                return config;
            },
            responseError : function(rejection)
            {
                if (rejection.status === 401) {
                    $location.path('/login');
                    return $q.reject(rejection);
                }
                if (rejection.status === 403) {
                    $location.path('/unauthorized');
                    return $q.reject(rejection);
                }
                return $q.reject(rejection);
            }

        }
    }
    var params = ['userService', '$q', '$location'];
    interceptor.$inject = params;
    $httpProvider.interceptors.push(interceptor);
}]);

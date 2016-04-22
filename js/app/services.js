SERVICES.factory("tools", ["$http", "$rootScope", function ($http, $rootScope) {
    return {
        get: function (param) {
            var self = this;
            if (!param instanceof Object || !param.url) {
                return;
            }
            if (param.cache && this.data.getItem(param.url + ':' + JSON.stringify(param.data))) {
                $rootScope.$broadcast('loading_off');
                param.succ && param.succ(resp);
                return;
            }
            $rootScope.$broadcast('loading');
            $http({
                method: param.method || 'GET',
                url: param.url,
                params: param.data || {},
                headers: {
                    'Accept': 'application/json, text/javascript, */*'
                }
            }).success(function (resp) {
                $rootScope.$broadcast('loading_off');
                if (resp.value == "session expired" || resp.message == 'session expired') {
                    window.location.href = '/trend-BI/html/login.html';
                }
                param.succ && param.succ(resp);
                if (resp.success && param.cache) {
                    this.data.setItem(param.url + ':' + JSON.stringify(param.data), resp);
                }
            }).error(function (resp) {
                $rootScope.$broadcast('loading_off');
                param.fail && param.fail(resp);
            });
        },
        post: function (param) {
            var self = this;
            if (!param instanceof Object || !param.url) {
                return;
            }
            $http.post(param.url, param.data).success(function (resp, status, headers, config) {
                if (resp.value == "session expired" || resp.message == 'session expired') {
                    window.location.href = '/trend-BI/html/login.html';
                }
                param.succ && param.succ(resp);
            }).error(function (data, status, headers, config) {

            });
        },
        trim: function (str) {
            if (!str instanceof String)
                return str;
            var res = str.replace(/^\s+|\s+$/gi, "");
            return res;
        },
        isEmpty: function (obj) {
            for (var i in obj) {
                return false;
            }
            return true;
        },
        data: {
            data: {},
            setItem: function (key, value) {
                this.data[key] = value;
            },
            getItem: function (key) {
                return this.data[key];
            },
            delItem: function (key) {
                delete this.data[key];
            }
        },
        identifier: function () {
            var name = "";
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (var i = 0; i < 20; i++) {
                name += chars[Math.floor(Math.random() * 25)];
            }
            return name;
        },
        storage: {
            setItem: function (key, value) {
                window.localStorage.setItem(key, value);
            },
            getItem: function (key) {
                return window.localStorage.getItem(key);
            },
            removeItem: function (key) {
                window.localStorage.removeItem(key)
            }
        },
        info: function (content) {
            $rootScope.$broadcast('info', content);
        }
    }
}]);

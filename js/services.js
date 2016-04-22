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
        cachedUrls: [
            'getChartByModuleId.htm', 'getDatasByModuleId.htm'
        ],
        setCache: function (url, params, resp) {
            // var key = url + JSON.stringify
        },
        getCache: function (url, params) {

        },
        /*
         * 清除字符串两端的空格
         * */
        trim: function (str) {
            if (!str instanceof String)
                return str;
            var res = str.replace(/^\s+|\s+$/gi, "");
            return res;
        },
        /*
         * alert指令的简便调用模式
         * */
        alert: function (title, content) {
            $rootScope.$broadcast('alert', title, content);
            return false;
        },
        /*
         * confirm指令的简便调用模式
         * */
        confirm: function (title, content) {
            $rootScope.$broadcast('confirm', title, content);
            return false;
        },
        /*
         * info指令的简便调用模式
         * */
        info: function (content) {
            $rootScope.$broadcast("info", content);
            return false;
        },
        /*
         * 检查一个对象是否为空
         * */
        isEmpty: function (obj) {
            for (var i in obj) {
                return false;
            }
            return true;
        },
        /*
         * 用于跨页面保存数据
         * */
        data: {
            data: {
                itemlist: {
                    checkboxlist: {},
                    chartlist: {},
                    radiolist: {},
                    betweenlist: {},
                    selectlist: {},
                    datelist: {},
                    sheetlist: {},
                    notelist: {},
                    syncdatalist: {}

                }

            },
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
        makeConditionId: function () {
            var id = "";
            var chars = '0123456789';
            for (var i = 0; i < 20; i++) {
                id += chars[Math.ceil(Math.random() * 9)];
            }
            return id;
        },
        isPreviewing: function () {
            return window.location.hash.indexOf("system") != -1;
        },
        isEditing: function () {
            return window.location.hash.indexOf("editor") != -1;
        },
        storage: {
            //var localStorage = window.localStorage;
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
        gridwidth: function () {
            return Math.floor((window.screen.width * 0.95) / 80);
        },
        dragcontentwidth: function () {
            return (Math.floor((window.screen.width * 0.95) / 80)) * 80
        },
        screenCapture: function () {
            html2canvas(document.body).then(function (canvas) {
                $('.imgsrc').val(canvas.toDataURL())
            });
        }
    }
}]);

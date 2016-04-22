/**
 * Created by charsen on 16/4/5.
 */
MAIN.controller('chartsCtrl', ["$scope", "$rootScope", "tools", "$timeout", "$routeParams", "$location", function ($scope, $rootScope, tools, $timeout, $routeParams, $location) {
    var pageId = $routeParams.pageId;
    $scope.pageName = "";

    $scope.refresh = function () {
        window.location.reload();
    }

    /*$scope.charts_pages_container_shown = false;
     $scope.charts_query_container_shown = false;*/

    $scope.toogle = function (claName) {
        if (this.cur_top == claName) {
            $('.' + claName).slideUp(400);
            this.cur_top = "";

            if (claName == 'charts-pages-container') {
                $('.fa-' + claName).removeClass('fa-chevron-circle-up').addClass('fa-chevron-circle-down');
            }
            if (claName == 'charts-query-container') {
                $('.fa-' + claName).removeClass('fa-chevron-circle-up').addClass('fa-chevron-circle-down');
            }
            return;
        }
        var tops = ['charts-pages-container', 'charts-query-container', 'share-container'];
        for (var i = 0; i < tops.length; i++) {
            if (tops[i] != claName) {
                $("." + tops[i]).hide();
            }
            $('.' + claName).slideDown(400);
        }
        this.cur_top = claName;
        if (claName == 'charts-pages-container') {
            $('.fa-' + claName).removeClass('fa-chevron-circle-down').addClass('fa-chevron-circle-up');
        }
        if (claName == 'charts-query-container') {
            $('.fa-' + claName).removeClass('fa-chevron-circle-down').addClass('fa-chevron-circle-up');
        }
    }

    $scope.items = {
        chartlist: [],
        sheetlist: [],
        checkboxlist: [],
        radiolist: [],
        betweenlist: [],
        selectlist: [],
        datelist: [],
        notelist: [],
        syncdatalist: []
    };

    tools.get({
        url: '/Intelligence-Business-Management/getPageByPageId.htm',
        data: {
            pageId: pageId
        },
        succ: function (resp) {
            if (resp.success) {
                $scope.pageName = resp.value.pageName;
                var itemlist = resp.value.pageObject.jsonObject.itemlist;

                tools.data.setItem("itemlist", itemlist);

                for (var i in itemlist) {
                    var list = itemlist[i];
                    for (var j in list) {
                        if (i == 'selectlist') {
                            list[j].chartType = 'radio';
                        }
                        $scope.items[i == 'selectlist' ? "radiolist" : i].push(list[j]);
                    }
                }
                angular.extend(itemlist.radiolist, itemlist.selectlist);

                tools.data.setItem('tbId', resp.value.tbId);
                tools.data.setItem('pageId', resp.value.pageId);
                tools.data.setItem('tableType', resp.value.tableType);

                $rootScope.$broadcast('PAGE_JSON_READY_EV');
            }
        }
    });
}]);
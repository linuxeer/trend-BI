/*MAIN.controller('systemCtrl', ["$scope", "$rootScope", "tools", "$timeout", "$routeParams", function ($scope, $rootScope, tools, $timeout, $routeParams) {
    
    $("#charts-container").parent().width(tools.dragcontentwidth());
    //console.log(tools.storage.getItem('prewviewlist'))
    $scope.pageId = $routeParams.pageid;
    $scope.chartlist = [];
    $scope.betweenlist = [];
    $scope.radiolist = [];
    $scope.checkboxlist = [];
    $scope.selectlist = [];
    $scope.datelist = [];
    $scope.sheetlist = [];
    if (tools.storage.getItem('prewviewlist')) {
        angular.forEach(JSON.parse(tools.storage.getItem('prewviewlist')).pageJson, function (item) {
            if (item.chartType == 'checkbox') {
                $scope.checkboxlist.push(item);
            } else if (item.chartType == 'radio') {
                $scope.radiolist.push(item);
            } else if (item.chartType == 'between') {
                $scope.betweenlist.push(item);
            } else if (item.chartType == 'select') {
                $scope.selectlist.push(item);
            } else if (item.chartType == 'date') {
                $scope.datelist.push(item);
            } else if (item.chartType == 'crosstab' || item.chartType == 'summarytab' || item.chartType == 'detailtab') {
                $scope.sheetlist.push(item);
            } else {
                $scope.chartlist.push(item);
            }
        });
    } else {
        return false;
    };

    $scope.backeditor = function () {

        tools.storage.setItem('backeditorlist', tools.storage.getItem('prewviewlist'));
        tools.storage.removeItem('prewviewlist');
        tools.storage.removeItem('dragcontentwidth');
        window.location.href = '#/editor?pageid=' + $scope.pageId;
    }
}]);*/

MAIN.controller('productCtrl', ["$scope", "$rootScope", "tools", "$timeout", "$routeParams", function ($scope, $rootScope, tools, $timeout, $routeParams) {
    $scope.username = tools.storage.getItem('userName');
    $scope.pageid = $routeParams.pageid;
    $scope.chartlist = [];
    $scope.betweenlist = [];
    $scope.radiolist = [];
    $scope.checkboxlist = [];
    $scope.selectlist = [];
    $scope.datelist = [];
    $scope.sheetlist = [];
    $scope.notelist = [];
    $scope.syncdatalist = [];
    $scope.itemlist = {
        chartlist : {},
        checkboxlist : {},
        radiolist : {},
        betweenlist : {},
        selectlist : {},
        datelist : {},
        sheetlist : {},
        notelist: {},
        syncdatalist: {}

    };
    var tbId = '';
    var tableType = '';
    $scope.editable = tools.data.getItem('editable');

    if (!$scope.pageid) {
        alert('请选择页面')
    };
    tools.get({
        url: '/Intelligence-Business-Management/getPageByPageId.htm',
        data: {
            pageId: $scope.pageid
        },
        succ: function (resp) {
            if (resp.success) {
                $scope.pageName = resp.value.pageName;
                tbId = resp.value.tbId;
                tableType = resp.value.tableType;
                $("#charts-container").parent().width(tools.dragcontentwidth());
                if(resp.value.pageObject.jsonObject.setpagejson){
                    
                    $('#product').css({'background':resp.value.pageObject.jsonObject.setpagejson.background});
                    $("#charts-container").css({'color':resp.value.pageObject.jsonObject.setpagejson.color})
                }
                if(resp.value.pageObject.jsonObject.itemlist && !(resp.value.pageObject.jsonObject.itemlist instanceof Array)){
          
                    $scope.itemlist = resp.value.pageObject.jsonObject.itemlist;
                    
                    angular.forEach($scope.itemlist.chartlist,function(item){
                        $scope.chartlist.push(item);
                    });
                    angular.forEach($scope.itemlist.checkboxlist,function(item){
                        $scope.checkboxlist.push(item);
                    });
                    angular.forEach($scope.itemlist.radiolist,function(item){
                        $scope.radiolist.push(item);
                    });
                    angular.forEach($scope.itemlist.betweenlist,function(item){
                        $scope.betweenlist.push(item);
                    });
                    angular.forEach($scope.itemlist.selectlist,function(item){
                        $scope.selectlist.push(item);
                    });
                    angular.forEach($scope.itemlist.datelist,function(item){
                        $scope.datelist.push(item);
                    });
                    angular.forEach($scope.itemlist.sheetlist,function(item){
                        $scope.sheetlist.push(item);
                    });
                    angular.forEach($scope.itemlist.notelist, function (item) {
                        $scope.notelist.push(item);
                    });
                    angular.forEach($scope.itemlist.syncdatalist, function (item) {
                        $scope.syncdatalist.push(item);
                    });
                }
                tools.data.setItem('itemlist',$scope.itemlist);
                $timeout(function(){
                   $rootScope.$broadcast('PREVIEW_EV'); 
                },1000)
                
               
            } else {
                if(resp.message != 'session expired'){
                    alert(resp.message)
                }
            }
        }
    });

    $scope.sharepage = function(){
        var sharecontent = {
            'pageId':$scope.pageid,
            'tbId':tbId,
            'tableType':tableType
        };

        $rootScope.$broadcast('share',sharecontent)
    };
}]);
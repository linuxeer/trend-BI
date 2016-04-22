/**
 * Created by Administrator on 2016/1/15.
 */
MAIN.controller('lookCtrl', ["$scope", "$rootScope", "tools", "$timeout", "$routeParams", function ($scope, $rootScope, tools, $timeout, $routeParams) {
    $scope.username = tools.storage.getItem('userName');
    $scope.userType = tools.storage.getItem('userType');

    if ($scope.userType == "administrator") {
        $scope.isAdmin = true;
    } else {
        $scope.isAdmin = false;
    }
    $scope.pageList = [];
    $scope.seteditable = tools.storage.getItem('seteditable');

    var init = function () {
        tools.get({
            url: '/Intelligence-Business-Management/getPages.htm',
            succ: function (data) {
                if (data.success) {
                    $scope.pageList = data.value;
                    angular.forEach($scope.pageList, function (page) {
                        page.oriPageName = page.pageName;
                        if (page.pageName.length > 10) {
                            page.pageName = page.pageName.slice(0, 10) + '..';
                        }
                    });
                } else {
                    if (data.message != 'session expired') {
                        alert(data.message)
                    }
                }
            }
        });
    };
    init();

    //点击预览页面
    $scope.showproduct = function (pageId, editable) {
        tools.data.setItem('editable', editable);
        window.location.href = '#/product?pageid=' + pageId;
    };

    //点击新建，弹出弹框
    $scope.setnewpage = function () {
        if ($scope.pageid) {
            $rootScope.$broadcast("confirm", {
                'title': '保存提醒',
                'content': '是否对之前页面进行保存',
                'btns': [
                    {
                        'text': '否',
                        'style': 'btn-default',
                        'fn': function () {
                            $rootScope.$broadcast('setnewpage-event-no');
                        }
                    },
                    {
                        'text': '是',
                        'style': 'btn-primary',
                        'fn': function () {
                            $rootScope.$broadcast('setnewpage-event-yes');
                        }
                    }
                ]
            });
        } else {
            $scope.getcolumn();
            $scope.setpage = true;

        }
    };
    //初始化图表，组件，表格数组begin
    $scope.model = {
        tablist: [],
        showtab: {}
    };
    $scope.tid = '';
    $scope.ttype = '';
    $scope.setpage = false;
    var onsetnewpageeventyes = $rootScope.$on('setnewpage-event-yes', function () {
        $scope.saveform(function () {
            $scope.getcolumn();
            $scope.setpage = true;
        });
    });

    var onsetnewpageeventno = $rootScope.$on('setnewpage-event-no', function () {
        $scope.getcolumn();
        $scope.setpage = true;
    });
    //点击新建弹框中的单选，选择使用表格
    $scope.radiochk = function (tid, ttype) {
        $scope.tid = tid;
        $scope.ttype = ttype;

    }

    //保存新建页面
    $scope.savepage = function () {
        if ($(".pagename").val() == '') {
            alert('页面名称不能为空');
            return false;
        } else if ($scope.tid == '') {
            alert('请选择表格');
            return false;
        }
        tools.get({
            url: '/Intelligence-Business-Management/updatePage.htm',
            data: {
                'pageName': $(".pagename").val(),
                'tbId': $scope.tid,
                'tableType': $scope.ttype,
                'pageJson': {'jsonObject': []},
                'chartStyle': 'default'
            },
            succ: function (data) {
                if (data.success) {
                    tools.data.setItem('tbId', $scope.tid);
                    tools.data.setItem('tableType', $scope.ttype);
                    tools.data.setItem('pageid', data.value);
                    window.location.href = '#/editor?pageid=' + data.value;
                } else {
                    if (data.message != 'session expired') {
                        alert(data.message)
                    }
                }
            }
        });

    }
//获得$scope.model.tablist数据，所有数据
    $scope.getcolumn = function () {
        $scope.model.tablist.length = 0;
        tools.get({
            url: '/Intelligence-Business-Management/getAllTables.htm',
            succ: function (data) {
                if (data.success == true) {
                    for (var i in data.value) {
                        for (var j in data.value[i]) {
                            $scope.model.tablist.push({
                                'tabletype': i,
                                'tableDesc': data.value[i][j].tableDesc,
                                'tabid': data.value[i][j].tbId
                                //'classificationColumns': data.value[i][j].classificationColumns
                            })
                        }
                    }
                } else {
                    if (data.message != 'session expired') {
                        alert(data.message)
                    }
                }
            }
        })
    };

    $scope.deletePage = function (pageId) {
        $rootScope.$broadcast("confirm", {
            'title': '删除提醒',
            'content': '确定要删除本页面吗,删除以后页面不可恢复',
            'btns': [
                {
                    'text': '否',
                    'style': 'btn-default',
                    'fn': function () {
                        $scope.setpage = false;
                    }
                },
                {
                    'text': '是',
                    'style': 'btn-primary',
                    'fn': function () {
                        tools.get({
                            url: '/Intelligence-Business-Management/deletePage.htm',
                            data: {
                                'pageId': pageId
                            },
                            succ: function (data) {
                                if (data.success) {
                                    //alert('删除成功');
                                    init();


                                } else {
                                    if (data.message != 'session expired') {
                                        alert(data.message)
                                    }

                                }
                            }
                        });
                    }
                },
            ]
        });
    };

    $scope.sharepage = function (pageId, tbId, tableType) {
        var sharecontent = {
            'pageId': pageId,
            'tbId': tbId,
            'tableType': tableType
        };

        $rootScope.$broadcast('share', sharecontent)
    };
//右键显示分享
    $scope.rightclick = function (pageId, tbId, tableType) {
        $scope.menus = [
            {
                text: '分享',
                fn: angular.bind($scope, function (e) {
                    if (e) {
                        e.preventDefault();
                    }
                    $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                    $scope.sharepage(pageId, tbId, tableType);
                })
            },
            {
                text: '删除',
                fn: angular.bind($scope, function (e) {
                    $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                    $scope.deletePage(pageId);
                })
            }
        ];
        $rootScope.$broadcast('CONTEXT_MENU_EV', $scope.menus);
    };
}]);






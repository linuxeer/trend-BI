DIRECTIVES.directive('pageList', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            scope.pages = [];
            tools.get({
                url: '/Intelligence-Business-Management/getPages.htm',
                data: {},
                succ: function (resp) {
                    scope.pages = resp.value;
                }
            });
        },
        templateUrl: "/trend-BI/html/app/widget/pageList.html"
    }
}]);
DIRECTIVES.directive('chart', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: false,
        link: function (scope, element, attr) {
            var moduleId = attr.moduleid;
            var identifier = tools.identifier();
            var config = tools.data.getItem('itemlist')['chartlist'][moduleId];

            $(element).find('.chart').css({
                width: window.screen.width + 'px',
                height: window.screen.width * 0.6 + 'px'
            });

            var linkQuery = {}; // 联动查询条件对象
            var conditionQuery = {}; // 条件查询对象
            var downDrillValue = []; // 下钻条件
            var layerNum = 0;
            var chart = null;

            function getChartData(type) {
                var query = {
                    layerNum: layerNum,
                    moduleId: moduleId,
                    chartStyle: 'Hchart',
                    downDrillValue: downDrillValue.join(',')
                };
                angular.extend(query, linkQuery);
                angular.extend(query, conditionQuery);

                tools.get({
                    url: '/Intelligence-Business-Management/getChartByModuleId.htm',
                    data: query,
                    succ: function (resp) {
                        if (resp.success) {
                            if (resp.value.option.series.length == 0 || resp.value.option.series[0].data.length == 0) {
                                if (type == 'drilldown') {
                                    downDrillValue.length -= 1;
                                    layerNum--;
                                }
                                return tools.info("暂无相关数据!");
                            }
                            resp.value.option.plotOptions = {
                                pie: {
                                    allowPointSelect: true
                                }
                            }
                            if (resp.value.option.legend) {
                                resp.value.option.legend.align = 'bottom';
                                resp.value.option.legend.enabled = false;
                            }

                            resp.value.option.title.text = config.ctitle || "";

                            makeChartLinkAble(resp.value.option, config.chartType);
                            $(element).find('.chart').highcharts(resp.value.option);
                            makeChartDrilldownAble();

                            if (downDrillValue.length) {
                                scope.backBtnShown = true;
                            }
                        } else {
                            if (type == 'drilldown' || resp.value.option.series[0].data.length == 0) {
                                downDrillValue.length -= 1;
                                layerNum--;
                            }
                        }
                    }
                });
            }

            scope.backBtnShown = false;
            scope.back = function () {
                layerNum--;
                downDrillValue.length -= 1;
                getChartData();

                if (layerNum === 0) {
                    scope.backBtnShown = false;
                }
            }

            // 使联动
            function makeChartLinkAble(option, chartType) {
                option.plotOptions.series = {
                    allowPointSelect: true,
                    events: {
                        click: function (e) {
                            var name = chartType == 'StandardPieChart' ? e.point.name : e.point.category;
                            var $target = $(e.target);
                            if ($target.data('activate')) {
                                $rootScope.$broadcast('LINK_EV', {
                                    identifier: identifier
                                });
                                $target.data('activate', false);
                                return;
                            }
                            $target.data('activate', true);
                            $rootScope.$broadcast('LINK_EV', {
                                implicationValue: downDrillValue.length ? downDrillValue.join('-') + '-' + name : name,
                                dimensionValue: e.point.series.name,
                                grangedModuleType: 'chart',
                                grangedModuleId: moduleId,
                                identifier: identifier
                            });
                        }
                    }
                };
            }

            // 使下钻
            var $chartEle = $(element).find('.chart');

            function makeChartDrilldownAble() {
                var labels = $chartEle.find('.highcharts-xaxis-labels text').length ? $chartEle.find('.highcharts-xaxis-labels text') : $chartEle.find('.highcharts-data-labels text');
                labels.click(function (e) {
                    e.stopPropagation();
                    if (config.config.dimension.length == 1 || !config.isDrill || layerNum + 1 == config.config.dimension.length) {
                        return;
                    }
                    downDrillValue.push($(this).text());
                    layerNum++;
                    getChartData('drilldown');
                });
                if (config.isDrill && config.config.dimension.length > 1 && layerNum + 1 < config.config.dimension.length) {
                    $chartEle.find('tspan').css('text-decoration', 'underline');
                }
            }

            getChartData();

            // 条件过滤
            var CONDITION_FILTER_EV = $rootScope.$on('CONDITION_FILTER_EV', function (e, conditionId, constr) {
                conditionQuery["condition-" + conditionId] = constr;
                getChartData();
            });
            var LINK_EV = $rootScope.$on('LINK_EV', function (e, linkQuery_) {
                if (linkQuery_.identifier === identifier) {
                    return;
                }
                linkQuery = linkQuery_;
                getChartData(moduleId);
            });

            scope.$on("$destroy", function () {
                CONDITION_FILTER_EV();
                LINK_EV();
            });
        },
        templateUrl: '/trend-BI/html/app/widget/chart.html'
    }
}]);
// 汇总表 明细表 交叉表
DIRECTIVES.directive('sheet', ["$rootScope", 'tools', "$document", "$timeout", function ($rootScope, tools, $document, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: false,
        link: function (scope, element, attr) {
            var $element = $(element);
            var moduleId = scope.moduleId = attr.moduleid;
            var chartType = attr.charttype;
            var identifier = tools.identifier();
            var config = scope.config = tools.data.getItem('itemlist')['sheetlist'][moduleId];

            console.log(config);

            $(element).find('.table-box').css({
                width: window.screen.width + 'px',
                height: window.screen.width * 0.8 + 'px'
            });

            // 条件查询对象,条件来源于组件
            var conditionQuery = {};
            // 联动查询对象,来自于其他sheet或者chart
            var linkQuery = {};
            var requestSequence = 0;

            // 横表头与纵表头数量
            var lineHeaderSize = 0, listHeaderSize = 0;
            // table数据
            scope.tableData = [];

            getTableData(moduleId);

            // 请求数据
            function getTableData(moduleId) {
                scope.tableData.length = 0;

                var query = {
                    moduleId: moduleId,
                    requestSequence: requestSequence
                };
                angular.extend(query, conditionQuery, linkQuery);
                tools.get({
                    url: '/Intelligence-Business-Management/getDatasByModuleId.htm',
                    data: query,
                    succ: function (resp) {
                        if (resp.success) {
                            if (resp.value.requestSequence == requestSequence) {
                                drawTable(resp);
                            }
                        }
                    }
                });
            }

            function drawTable(resp) {
                if (resp && resp.success) {
                    var datas = angular.copy(resp.value.datas);

                    scope.lineHeaderSize = lineHeaderSize = resp.value.lineHeaderSize;
                    scope.listHeaderSize = listHeaderSize = resp.value.listHeaderSize;

                    for (var i = 0; i < datas.length; i++) {
                        for (var j = 0; j < datas[i].length; j++) {
                            if (datas[i][j] === '') {
                                datas[i][j] = '-';
                            }
                        }
                    }

                    scope.tableData = datas;
                }
                // 调整表格高度
                $timeout(function () {
                    adjustSize();
                }, 2000);
            }

            // 检测联动事件
            var LINK_EV = $rootScope.$on('LINK_EV', function (e, linkQuery_) {
                if (linkQuery_.identifier === identifier) {
                    return;
                }
                linkQuery = linkQuery_;
                getTableData(moduleId);
            });

            scope.$on("$destroy", function () {
                LINK_EV();
            });

            var scrollTop, scrollLeft;

            function adjustSize() {
                $(element).find('.table-for-data table tr').each(function (index, ele) {
                    $(element).find('.table-for-list-header table tr:eq(' + index + ')').css('height', $(ele).height() + 'px');
                    $(element).find('.table-for-line-header table tr:eq(' + index + ')').css('height', $(ele).height() + 'px');
                    $(element).find('.table-for-corn-header table tr:eq(' + index + ')').css('height', $(ele).height() + 'px');
                });

                for (var i = 0; i < lineHeaderSize; i++) {
                    var data_tds = $(element).find('.table-for-data table tr').eq(i).find('td');
                    var line_tds = $(element).find('.table-for-line-header table tr').eq(i).find('td');

                    // 固定行表头的宽度可能会因为数据太宽而导致与行表头宽度不一致,在此统一
                    for (var j = 0; j < data_tds.size(); j++) {
                        if (line_tds.eq(j).css('width') < data_tds.eq(j).css('width')) {
                            line_tds.eq(j).css('width', data_tds.eq(j).css('width'));
                        }
                    }
                }

                $(element).find('.table-container').scroll(function () {
                    if ($(this).scrollLeft() != scrollLeft) {
                        scrollLeft = $(this).scrollLeft();
                        if (scrollLeft > 100) {
                            $(element).find('.table-for-list-header').css({
                                left: scrollLeft + 'px',
                                zIndex: 3
                            }).removeClass('none');
                            $(element).find(".table-for-line-header").css({
                                zIndex: 2
                            });
                        } else {
                            $(element).find('.table-for-list-header').addClass('none');
                            $(element).find('.table-for-corn-header').addClass('none');
                        }
                    } else {
                        scrollTop = $(this).scrollTop();
                        if (scrollTop > 100) {
                            $(element).find(".table-for-line-header").css({
                                top: scrollTop + 'px',
                                zIndex: 3
                            }).removeClass('none');
                            $(element).find('.table-for-list-header').css({
                                zIndex: 2
                            });
                        } else {
                            $(element).find(".table-for-line-header").addClass('none');
                            $(element).find('.table-for-corn-header').addClass('none');
                        }
                    }

                    // 如果纵表头和横表头都显示则左上角固定表头也显示出来
                    if (scrollTop > 100 && scrollLeft > 100) {
                        $(element).find('.table-for-corn-header').css({
                            left: scrollLeft + 'px',
                            top: scrollTop + 'px'
                        }).removeClass('none');
                    }
                });
            }
        },
        templateUrl: '/trend-BI/html/app/widget/sheet.html'
    }
}]);
DIRECTIVES.directive('radioFilter', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            var conditionId = attr.conditionid;
            var config = tools.data.getItem('itemlist')['radiolist'][conditionId];

            scope.items = [];
            scope.filtername = config.filtername;

            tools.get({
                url: '/Intelligence-Business-Management/getSelectDatasByConditionId.htm',
                data: {
                    conditionId: conditionId
                },
                succ: function (resp) {
                    if (resp.success) {
                        angular.forEach(resp.value, function (item, index, array) {
                            array[index] = {
                                text: item,
                                selected: false,
                                src: '../../images/radio-0.png'
                            }
                        });
                        scope.items = resp.value;
                    }
                }
            });

            var cur_index = -1;
            scope.select = function (index) {
                if (scope.items[index].selected) {
                    scope.items[index].selected = false;
                    scope.items[index].src = '../../images/radio-0.png';
                    $rootScope.$broadcast("CONDITION_FILTER_EV", conditionId, null);
                    return;
                }
                if (cur_index != -1) {
                    scope.items[cur_index].src = '../../images/radio-0.png';
                    scope.items[cur_index].selected = false;
                }
                scope.items[index].src = "../../images/radio-1.png";
                scope.items[index].selected = true;
                cur_index = index;

                $rootScope.$broadcast("CONDITION_FILTER_EV", conditionId, scope.items[index].text);
            }
        },
        templateUrl: '/trend-BI/html/app/widget/radio.html'
    }
}]);
DIRECTIVES.directive('checkboxFilter', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            var conditionId = attr.conditionid;
            var config = tools.data.getItem('itemlist')['checkboxlist'][conditionId];

            scope.items = [];
            scope.filtername = config.filtername;

            tools.get({
                url: '/Intelligence-Business-Management/getSelectDatasByConditionId.htm',
                data: {
                    conditionId: conditionId
                },
                succ: function (resp) {
                    if (resp.success) {
                        angular.forEach(resp.value, function (item, index, array) {
                            array[index] = {
                                text: item,
                                selected: false,
                                src: '../../images/checkbox-0.png'
                            }
                        });
                        scope.items = resp.value;
                    }
                }
            });

            scope.select = function (index) {
                if (scope.items[index].selected) {
                    scope.items[index].selected = false;
                    scope.items[index].src = '../../images/checkbox-0.png';
                    broadcast();
                    return;
                }

                scope.items[index].selected = true;
                scope.items[index].src = "../../images/checkbox-1.png";
                broadcast();
            }

            function broadcast() {
                var selected = [];
                angular.forEach(scope.items, function (item, index, array) {
                    if (item.selected) {
                        selected.push(item.text);
                    }
                });
                $rootScope.$broadcast("CONDITION_FILTER_EV", conditionId, selected.length ? selected.join(',') : null);
            }
        },
        templateUrl: '/trend-BI/html/app/widget/checkbox.html'
    }
}]);
DIRECTIVES.directive('valueFilter', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            var conditionId = attr.conditionid;
            var config = tools.data.getItem('itemlist')['betweenlist'][conditionId];

            scope.filtername = config.filtername;

            var ball_before = document.querySelector('.value-ball-before');
            var ball_after = document.querySelector('.value-ball-after');
            var w = window.screen.width * 0.05 / 2;
            var min, max;

            scope.min = "";
            scope.max = "";
            scope.cur_min = "";
            scope.cur_max = "";

            ball_before.addEventListener('touchmove', function (event) {
                ball_before.style.left = event.touches[0].clientX - w + 'px';
                if (parseInt(ball_before.style.left) < 0) {
                    ball_before.style.left = '0px';
                }
                event.stopPropagation();
            });
            ball_before.addEventListener('touchend', function (event) {
                $timeout(function () {
                    scope.cur_min = Math.floor(scope.min + parseInt(ball_before.style.left) / (window.screen.width * 0.9 - 20) * (scope.max - scope.min));
                    $rootScope.$broadcast("CONDITION_FILTER_EV", conditionId, scope.cur_min + ',' + scope.cur_max);
                }, 0);
                event.stopPropagation();
            });
            ball_after.addEventListener('touchmove', function (event) {
                ball_after.style.left = event.touches[0].clientX - w + 'px';
                if (parseInt(ball_after.style.left) > window.screen.width * 0.9 - 20) {
                    ball_after.style.left = window.screen.width * 0.9 - 20 + 'px';
                }
                event.stopPropagation();
            });
            ball_after.addEventListener('touchend', function (event) {
                $timeout(function () {
                    scope.cur_max = Math.floor(scope.min + parseInt(ball_after.style.left) / (window.screen.width * 0.9 - 20) * (scope.max - scope.min));
                    $rootScope.$broadcast("CONDITION_FILTER_EV", conditionId, scope.cur_min + ',' + scope.cur_max);
                }, 0);
                event.stopPropagation();
            });

            tools.get({
                url: '/Intelligence-Business-Management/getRangeDatasByConditionId.htm',
                data: {
                    conditionId: conditionId
                },
                succ: function (resp) {
                    if (resp.success) {
                        scope.cur_min = scope.min = min = Number(resp.value.min);
                        scope.cur_max = scope.max = max = Number(resp.value.max);
                    }
                }
            });
        },
        templateUrl: '/trend-BI/html/app/widget/value.html'
    }
}]);
DIRECTIVES.directive('dateFilter', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            var conditionId = attr.conditionid;
            scope.filtername = "日期";
            scope.min = "2012-01-01";
            scope.max = "2016-01-01";

            tools.get({
                url: '/Intelligence-Business-Management/getRangeDatasByConditionId.htm',
                data: {
                    conditionId: conditionId
                },
                succ: function (resp) {
                    if (resp.success) {
                        /*scope.cur_min = scope.min = min = Number(resp.value.min);
                         scope.cur_max = scope.max = max = Number(resp.value.max);*/
                    }
                }
            });
            $('.date_min,.date_max').pickadate({
                format: 'yyyy-mm-dd',
                monthsFull: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
            });
            scope.query = function () {
                var date_min = $('.date_min').val();
                var date_max = $('.date_max').val();

                if (date_min && date_max) {
                    $rootScope.$broadcast("CONDITION_FILTER_EV", conditionId, date_min + " 00:00:00" + ',' + date_max + ' 23:59:59');
                } else if (date_min) {
                    $rootScope.$broadcast("CONDITION_FILTER_EV", conditionId, date_min + " 00:00:00" + ',' + date_min + ' 23:59:59');
                } else if (date_max) {
                    $rootScope.$broadcast("CONDITION_FILTER_EV", conditionId, date_max + " 00:00:00" + ',' + date_max + ' 23:59:59');
                } else {

                }
            }
            scope.clear = function () {
                $('.date_min,.date_max').val("");
            }
        },
        templateUrl: '/trend-BI/html/app/widget/date.html'
    }
}]);
DIRECTIVES.directive('myTouchstart', [function () {
    return function (scope, element, attr) {

        element.on('touchstart', function (event) {
            scope.$apply(function () {
                scope.$eval(attr.myTouchstart);
            });
        });
    };
}]).directive('myTouchend', [function () {
    return function (scope, element, attr) {

        element.on('touchend', function (event) {
            scope.$apply(function () {
                scope.$eval(attr.myTouchend);
            });
        });
    };
}]).directive('info', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            scope.content = "";
            $rootScope.$on('info', function (e, content) {
                if (!content)
                    return;

                scope.content = content;
                $(element).slideDown(400);

                $timeout(function () {
                    $(element).slideUp(400);
                }, 2000);
            });
        },
        templateUrl: '/trend-BI/html/app/widget/info.html'
    }
}]).directive('shareList', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            scope.roles = [];

            var PAGE_JSON_READY_EV = $rootScope.$on('PAGE_JSON_READY_EV', function () {
                tools.get({
                    url: '/Intelligence-Business-Management/getShareInfos.htm',
                    data: {
                        tbId: tools.data.getItem("tbId"),
                        pageId: tools.data.getItem('pageId'),
                        tableType: tools.data.getItem("tableType")
                    },
                    succ: function (resp) {
                        if (resp.success) {
                            for (var i in resp.value.roles) {
                                var role = {
                                    roleName: resp.value.roles[i].roleName,
                                    roleId: resp.value.roles[i].roleId,
                                    subUsers: resp.value.roles[i].subUsers
                                }
                                role.src = '../../images/checkbox-0.png';
                                role.selected = false;

                                angular.forEach(role.subUsers, function (user) {
                                    user.src = '../../images/checkbox-0.png';
                                    user.selected = false;
                                });

                                scope.roles.push(role);
                            }
                        }
                    }
                });
            });

            scope.role_toogle = function (index) {
                if (scope.roles[index].selected) {
                    scope.roles[index].selected = false;
                    scope.roles[index].src = '../../images/checkbox-0.png';

                    // 选择本组内所有用户
                    angular.forEach(scope.roles[index].subUsers, function (user) {
                        user.selected = false;
                        user.src = '../../images/checkbox-0.png';
                    });
                } else {
                    scope.roles[index].selected = true;
                    scope.roles[index].src = '../../images/checkbox-1.png';

                    // 选择本组内所有用户
                    angular.forEach(scope.roles[index].subUsers, function (user) {
                        user.selected = true;
                        user.src = '../../images/checkbox-1.png';
                    });
                }
            }
            scope.user_toogle = function (pindex, index) {
                if (scope.roles[pindex].subUsers[index].selected) {
                    scope.roles[pindex].subUsers[index].selected = false;
                    scope.roles[pindex].subUsers[index].src = '../../images/checkbox-0.png';

                    // 只要取消一个组员,则组就取消勾选
                    scope.roles[pindex].selected = false;
                    scope.roles[pindex].src = '../../images/checkbox-0.png';
                } else {
                    scope.roles[pindex].subUsers[index].selected = true;
                    scope.roles[pindex].subUsers[index].src = '../../images/checkbox-1.png';

                    // 如果本组内所有用户都选了,则默认把本组勾上
                    for (var i = 0; i < scope.roles[pindex].subUsers.length; i++) {
                        if (!scope.roles[pindex].subUsers[i].selected) {
                            return;
                        }
                    }
                    scope.roles[pindex].selected = true;
                    scope.roles[pindex].src = '../../images/checkbox-1.png';
                }
            }

            scope.btnText = '确定';
            scope.share = function () {
                var sharedRoles = [], sharedUsers = [];

                angular.forEach(scope.roles, function (role) {
                    if (role.selected) {
                        sharedRoles.push(role.roleId);
                    } else {
                        angular.forEach(role.subUsers, function (user) {
                            if (user.selected) {
                                sharedUsers.push(user.userId);
                            }
                        });
                    }
                });
                if (sharedRoles.length == 0 && sharedUsers.length == 0) {
                    return;
                }
                tools.get({
                    url: '/Intelligence-Business-Management/sharePage.htm',
                    data: {
                        roleIds: sharedRoles.join(','),
                        userIds: sharedUsers.join(','),
                        pageId: tools.data.getItem('pageId')
                    },
                    succ: function (resp) {
                        if (resp.success) {
                            scope.btnText = '分享成功!';
                            $timeout(function () {
                                scope.btnText = '确定';
                            }, 1500);
                        }
                    }
                });
            }

            scope.$on("$destroy", function () {
                PAGE_JSON_READY_EV();
            });
        },
        templateUrl: '/trend-BI/html/app/widget/shareList.html'
    }
}]);
// 汇总表 明细表 交叉表
DIRECTIVES.directive('sheet', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            var $element = $(element);
            var moduleId = Number(attr.moduleid) ? attr.moduleid : "";
            var sheetlist = tools.data.getItem('itemlist')['sheetlist'];
            var sheet = scope.sheet = moduleId && sheetlist[moduleId] ? sheetlist[moduleId] : {
                height: 15,
                width: 30,
                left: Number(attr.left),
                top: Number(attr.top),
                chartType: attr.type,
                isDrill: false,
                config: {
                    measure: [],
                    dimension: [],
                    listheader: []
                },
                ctitle: '',
                moduleId: ''
            };
            $element.css({
                height: typeof sheet.height == 'number' ? sheet.height * tools.gridwidth() : sheet.height,
                width: typeof sheet.width == 'number' ? sheet.width * tools.gridwidth() : sheet.width,
                left: sheet.left * tools.gridwidth(),
                top: sheet.top * tools.gridwidth()
            });

            // 为标题腾出35px高度的空间
            $element.find('.table-container').css('height', $element.height() - 30);

            if (attr.fullscreen) {
                $element.css('position', 'static');
            }

            // 是否正在预览,用于控制是否能选中本组件
            scope.isPreviewing = attr.fullscreen ? true : false;

            var identifier = scope.identifier = tools.identifier();
            // 条件查询对象,条件来源于组件
            var conditionQuery = {};
            // 联动查询对象,来自于其他sheet或者chart
            var linkQuery = {};
            var loading = false;
            var requestSequence = 0;
            // 横表头与纵表头数量
            var lineHeaderSize = 0, listHeaderSize = 0;
            // table数据
            scope.tableData = [];

            // 删除chart的回调函数
            scope.delete_fn = function (e) {
                if (scope.title_edit_show) {
                    return;
                }
                if (moduleId) {
                    editorServ.delete_chart(moduleId, "deleteIbmModuleDataByModuleId", function (resp) {
                        if (resp.success) {
                            delete sheetlist[moduleId];
                            $rootScope.$broadcast('ITEM_REMOVE_EV', attr.identifier, sheet.chartType);
                            $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                            $element.fadeOut(500).remove();
                        } else {
                            alert(resp.message);
                        }
                    });
                } else {
                    $rootScope.$broadcast('ITEM_REMOVE_EV', attr.identifier, sheet.chartType);
                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                    $element.fadeOut(500).remove();
                }
                if (e) {
                    e.preventDefault();
                }
            };
            // 右键菜单
            scope.menus = [
                {
                    text: '修改标题',
                    fn: angular.bind(scope, function (e) {
                        scope.title_edit_show = true;
                        scope.title_edit = scope.title;
                        $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                        if (e) {
                            e.preventDefault();
                        }
                    })
                },
                {
                    text: '删除',
                    fn: angular.bind(scope, function (e) {
                        $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                        scope.delete_fn();
                    })
                }
            ];
            // 是否有右上角的菜单
            scope.hasMenu = attr.fullscreen ? false : true;
            // 右上角操作菜单
            scope.operMenus = [
                {
                    text: '全屏模式',
                    fn: function () {
                        $rootScope.$broadcast('FULL_SCREEN_EV', "sheet", sheetlist[moduleId]);
                    }
                }
            ];
            scope.submenus = [];
            scope.menuShown = false;
            scope.subMenuShown = false;
            scope.top = 0;
            scope.showMenu = function () {
                scope.menuShown = !scope.menuShown;
            }
            scope.showSubMenu = function (i) {
                if (!scope.operMenus[i].submenus || !scope.operMenus[i].submenus.length) {
                    scope.subMenuShown = false;
                    return;
                }
                scope.submenus = scope.operMenus[i].submenus;
                scope.subMenuShown = true;
                scope.top = 24 * i + 'px';
            }

            // 右键,显示菜单上下文
            scope.rightclick = function () {
                $rootScope.$broadcast('CONTEXT_MENU_EV', scope.menus);
            }

            // 标题修改
            scope.title_edit_show = false;
            scope.title_confirm = function () {
                scope.title_edit_show = false;
            }
            scope.title_cancel = function () {
                scope.title_edit_show = false;
            }

            editorServ.adjustPageSize($element);
            $rootScope.$broadcast("POS_AREA_ALIAN_EV", $element);

            // 如果有moduleID,则直接请求数据
            if (moduleId) {
                getTableData(moduleId);
                $(element).css('border-width', 0);
            } else {
                $(element).addClass(sheet.chartType);
            }

            // 维度(行表头)监听
            var DIMENSION_CHANGE_EV_OFF = $rootScope.$on("DIMENSION_CHANGE_EV", function (e, dimension) {
                if (!scope.selected) {
                    return;
                }
                if (!dimension || !dimension.length) {
                    $timeout(function () {
                        sheet.config.dimension.length = 0;
                        scope.tableData.length = 0;
                        $(element).css('border-width', 1).addClass(sheet.chartType);
                    }, 0);
                    return;
                }
                sheet.config.dimension = angular.copy(dimension);
                addIbmModuleTable(sheet.config, sheet.chartType);
            });

            // 度量(汇总)监听
            var MEASURE_CHANGE_EV_OFF = $rootScope.$on("MEASURE_CHANGE_EV", function (e, measure) {
                if (!scope.selected) {
                    return;
                }
                if (!measure || !measure.length) {
                    $timeout(function () {
                        sheet.config.measure.length = 0;
                        scope.tableData.length = 0;
                        $(element).css('border-width', 1).addClass(sheet.chartType);
                    }, 0);
                    return;
                }
                sheet.config.measure = angular.copy(measure);
                addIbmModuleTable(sheet.config, sheet.chartType);
            });

            // 列表头监听
            var LISTHEADER_CHANGE_EV_OFF = $rootScope.$on("LISTHEADER_CHANGE_EV", function (e, listheader) {
                if (!scope.selected) {
                    return;
                }
                if (!listheader || !listheader.length) {
                    $timeout(function () {
                        sheet.config.listheader.length = 0;
                        scope.tableData.length = 0;
                        $(element).css('border-width', 1).addClass(sheet.chartType);
                    }, 0);
                    return;
                }
                sheet.config.listheader = angular.copy(listheader);
                addIbmModuleTable(sheet.config, sheet.chartType);
            });

            // 请求moduleID
            function addIbmModuleTable(config, chartType) {
                if (chartType == 'crosstab') {
                    if (!config.dimension.length || !config.measure.length || !config.listheader.length) {
                        return;
                    }
                } else if (chartType == 'summarytab') {
                    if (!config.dimension.length || !config.measure.length) {
                        return;
                    }
                }
                var lineFieldNames = [];
                var listFieldNames = [];
                var dataFieldNames = [];

                angular.forEach(config.dimension, function (item) {
                    lineFieldNames.push(item.xymetric ? item.xymetric + "_" + item.columnid : item.columnid);
                });
                angular.forEach(config.listheader, function (item) {
                    listFieldNames.push(item.xymetric ? (item.xymetric + "_" + item.columnid) : item.columnid);
                });
                angular.forEach(config.measure, function (item) {
                    dataFieldNames.push(item.xymetric + "_" + item.columnid);
                });

                tools.get({
                    url: '/Intelligence-Business-Management/addIbmModuleTable.htm',
                    data: {
                        moduleId: moduleId,
                        tabType: chartType,
                        tbId: tools.data.getItem("tbId"),
                        pageId: tools.data.getItem('pageid'),
                        tableType: tools.data.getItem("tableType"),
                        lineFieldNames: lineFieldNames.join(','),
                        listFieldNames: listFieldNames.join(','),
                        dataFieldNames: dataFieldNames.join(',')
                    },
                    succ: function (resp) {
                        if (resp.success) {
                            // 如果有旧的模型对象,则先删除
                            if (sheetlist[moduleId]) {
                                delete sheetlist[moduleId];
                            }
                            sheet.moduleId = moduleId = resp.value;
                            sheetlist[moduleId] = sheet;
                            getTableData(moduleId);
                        }
                    }
                });
            }

            // 请求数据
            function getTableData(moduleId) {
                scope.tableData.length = 0;

                if (!$element.hasClass('loading')) {
                    $element.addClass("loading");
                }

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
                            if (!scope.isPreviewing) {
                                tools.data.setItem('cache-' + moduleId, angular.copy(resp));
                            }
                            if (resp.value.requestSequence == requestSequence) {
                                drawTable(resp);
                            }
                        }
                    }
                });
            }

            // 绘制table
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
                    $(element).css('border-width', 0);
                    $(element).removeClass(sheet.chartType);
                }
                $element.removeClass('loading');
                /*                $(element).find('.table-container').height(h - 30);
                 $(element).find('.table-container table').height(h - 30);*/
                if (tools.isPreviewing()) {
                    $element.css('borderWidth', 0);
                }
                // 调整表格高度
                $timeout(function () {
                    headerFix();
                }, 1000);
            }

            var $selected_td = null;
            var selected_x, selected_y;
            // 联动
            scope.link = function (event, pindex, index) {
                if (pindex == selected_x && index == selected_y) {
                    $selected_td.removeClass('selected');
                    selected_x = selected_y = -1;
                    $selected_td = null;

                    $rootScope.$broadcast('LINK_EV', {
                        lineHeaderValue: null,
                        listHeaderValue: null,
                        grangedModuleId: moduleId,
                        grangedModuleType: "table",
                        identifier: identifier
                    });
                    return;
                }
                if ($selected_td) {
                    $selected_td.removeClass('selected');
                }

                $(event.target).addClass('selected');

                var line_header_values = [];
                var list_header_values = scope.tableData[pindex].slice(0, index < listHeaderSize ? index : lineHeaderSize);

                for (var i = 0; i < pindex && i < lineHeaderSize; i++) {
                    line_header_values.push(scope.tableData[i][index]);
                }

                $selected_td = $(event.target);
                selected_x = pindex;
                selected_y = index;

                $rootScope.$broadcast('LINK_EV', {
                    lineHeaderValue: line_header_values.join(','),
                    listHeaderValue: list_header_values.join(','),
                    grangedModuleId: moduleId,
                    grangedModuleType: "table",
                    identifier: identifier
                });
            }

            // 条件过滤
            var CONDITION_FILTER_EV_OFF = $rootScope.$on('CONDITION_FILTER_EV', function (e, conditionId, constr) {
                if (!constr)
                    return;

                requestSequence++;
                if (constr == '-') {
                    conditionQuery["condition-" + conditionId] = null;
                } else {
                    conditionQuery["condition-" + conditionId] = constr;
                }
                getTableData(moduleId);
            });

            // 检测联动事件
            var LINK_EV_OFF = $rootScope.$on('LINK_EV', function (e, linkQuery_) {
                if (linkQuery_.identifier === identifier) {
                    return;
                }
                linkQuery = linkQuery_;
                getTableData(moduleId);
            });

            // 边框尺寸有变动,table监听实时变动
            var WH_RESIZE_EV_OFF = $rootScope.$on("WH_RESIZING_EV", function (e, w, h) {
                if (scope.selected) {
                    $(element).find('.table-container').height(h - 30);
                    // $(element).find('.table-container table').height(h - 30);
                }
            });

            // 预览
            var PREVIEW_EV_OFF = $rootScope.$on('PREVIEW_EV', function (e) {
                $timeout(function () {
                    scope.isPreviewing = true;
                    conditionQuery = {};
                    linkQuery = {};
                    $element.addClass('working');
                }, 10);
            });

            // 取消预览
            var PREVIEW_OFF_EV_OFF = $rootScope.$on('PREVIEW_OFF_EV', function () {
                $timeout(function () {
                    scope.isPreviewing = false;
                    scope.tableData = [];
                    drawTable(angular.copy(tools.data.getItem('cache-' + moduleId)));
                    $element.find('.data-table-box').scrollTop(0).scrollLeft(0);
                    $element.removeClass('working');
                }, 10);
            });

            scope.$on("$destroy", function () {
                LISTHEADER_CHANGE_EV_OFF();
                DIMENSION_CHANGE_EV_OFF();
                CONDITION_FILTER_EV_OFF();
                MEASURE_CHANGE_EV_OFF();
                PREVIEW_OFF_EV_OFF();
                WH_RESIZE_EV_OFF();
                PREVIEW_EV_OFF();
                LINK_EV_OFF();
            });

            // 自适应大小和滚动条
            var scrollTop, scrollLeft;

            function headerFix() {
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
                            line_tds.eq(j).css('min-width', data_tds.eq(j).css('width'));
                        }
                    }
                }

                $(element).find('.table-container').scroll(function () {
                    if ($(this).scrollLeft() != scrollLeft) {
                        scrollLeft = $(this).scrollLeft();
                        if (scrollLeft > 30) {
                            $(element).find('.table-for-list-header').css({
                                left: scrollLeft + 'px',
                                zIndex: 10
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
                        if (scrollTop > 30) {
                            $(element).find(".table-for-line-header").css({
                                top: scrollTop + 'px',
                                zIndex: 10
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
                    if (scrollTop > 200 && scrollLeft > 200) {
                        $(element).find('.table-for-corn-header').css({
                            left: scrollLeft + 'px',
                            top: scrollTop + 'px'
                        }).removeClass('none');
                    }
                });

                scope.fullscreen = function () {
                    $rootScope.$broadcast('FULL_SCREEN_EV', "sheet", sheetlist[moduleId]);
                }
            }
        },
        templateUrl: '/trend-BI/html/widgets/sheet-box.html'
    }
}]);
// 柱状图 折线图 扇形图 仪表盘 雷达图 散点图
DIRECTIVES.directive('chart', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            var moduleId = Number(attr.moduleid) ? attr.moduleid : "";
            var chart = scope.chart = moduleId ? tools.data.getItem('itemlist')['chartlist'][moduleId] : {
                height: Number(attr.height),
                width: Number(attr.width),
                left: Number(attr.left),
                top: Number(attr.top),
                chartType: attr.type,
                isDrill: false,
                config: {
                    areaDatas: []
                },
                ctitle: '',
                moduleId: ''
            };

            $(element).css({
                height: chart.height * tools.gridwidth(),
                width: chart.width * tools.gridwidth(),
                left: chart.left * tools.gridwidth(),
                top: chart.top * tools.gridwidth()
            });

            scope.isPreviewing = false;

            var chartlist = tools.data.getItem('itemlist')['chartlist'];
            var identifier = tools.identifier();
            var $element = $(element);
            var requestSequence = 0;
            var loading = false;

            // 仪表盘区间范围
            var areaDatas = [];
            var option = {};

            // 联动查询条件对象
            var linkQuery = {};
            // 条件查询对象
            var conditionQuery = {};
            // 下钻条件对象
            var drillQuery = scope.drillQuery = {
                implicationValue: [],
                layerNum: 0
            };

            // 下钻以后,返回上一层
            scope.back = function () {
                if (drillQuery.implicationValue.length === 0)
                    return;
                drillQuery.implicationValue.length = drillQuery.implicationValue.length - 1;
                drillQuery.layerNum--;
                getChartData(moduleId);
            }

            // 添加图表背景
            $element.find('.highchart-box').addClass(chart.chartType);

            // 删除chart
            scope.delete_fn = function (e) {
                if (scope.title_edit_show) {
                    return;
                }
                if (moduleId) {
                    editorServ.delete_chart(moduleId, "deleteIbmModuleChartByModuleId", function (resp) {
                        if (resp.success) {
                            delete chartlist[moduleId];
                            $rootScope.$broadcast('ITEM_REMOVE_EV', attr.identifier, chart.chartType);
                            $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                            $element.fadeOut(500).remove();
                        } else {
                            alert(resp.message);
                        }
                    });
                } else {
                    $rootScope.$broadcast('ITEM_REMOVE_EV', attr.identifier, chart.chartType);
                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                    $element.fadeOut(500).remove();
                }
                if (e) {
                    e.preventDefault();
                }
            };

            // 右键菜单
            scope.menus = [
                {
                    text: '修改标题',
                    fn: angular.bind(scope, function (e) {
                        scope.title_edit_show = true;
                        $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                        if (e) {
                            e.preventDefault();
                        }
                    })
                },
                {
                    text: '删除',
                    fn: angular.bind(scope, function () {
                        $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                        scope.delete_fn();
                    })
                }
            ];

            scope.operMenus = [
                {
                    text: '全屏模式',
                    fn: function () {
                        $rootScope.$broadcast('FULL_SCREEN_EV', "chart", scope.option);
                    }
                }
            ];
            scope.submenus = [];
            scope.menuShown = false;
            scope.subMenuShown = false;
            scope.top = 0;
            scope.showMenu = function () {
                scope.menuShown = !scope.menuShown;
            }
            scope.showSubMenu = function (i) {
                if (!scope.operMenus[i].submenus || !scope.operMenus[i].submenus.length) {
                    scope.subMenuShown = false;
                    return;
                }
                scope.submenus = scope.operMenus[i].submenus;
                scope.subMenuShown = true;
                scope.top = 24 * i + 'px';
            }

            // 右键显示菜单
            scope.rightclick = function () {
                $rootScope.$broadcast('CONTEXT_MENU_EV', scope.menus);
                scope.context_mune_showing = true;
            }


            // 标题修改
            scope.title = (chart && chart.ctitle) ? chart.ctitle : "";
            scope.title_edit_show = false;
            scope.title_confirm = function () {
                option.title = {
                    text: scope.title,
                    style: {
                        fontSize: '16px'
                    }
                };

                $element.find('div.w.h').highcharts(option);
                scope.title_edit_show = false;
                chart.ctitle = scope.title;
            }
            scope.title_cancel = function () {
                scope.title_edit_show = false;
            }

            editorServ.adjustPageSize($element);

            // 请求父容器帮助对齐网格线
            $rootScope.$broadcast("POS_AREA_ALIAN_EV", $element);

            // 如果有moduleId那么直接绘图
            if (moduleId) {
                getChartData(moduleId);
            }

            // 监听横坐标事件
            var DIMENSION_CHANGE_EV_OFF = $rootScope.$on("DIMENSION_CHANGE_EV", function (e, dimension) {
                if (!scope.selected) {
                    return;
                }
                if (!dimension || !dimension.length) {
                    $element.find('div.highchart-box').html("").addClass(chart.chartType);
                    if (chart.config.dimension) {
                        chart.config.dimension.length = 0;
                    }
                    option = null;
                    return;
                }

                chart.config.dimension = angular.copy(dimension);
                addIbmModuleChart(chart.config, chart.chartType);
            });

            // 监听纵坐标事件
            var MEASURE_CHANGE_EV_OFF = $rootScope.$on("MEASURE_CHANGE_EV", function (e, measure) {
//                y轴数据
                scope.yData = measure[0].columntxt + "(" + measure[0].xymetricname + ")";
                if (!scope.selected) {
                    return;
                }

                if (!measure || !measure.length) {
                    $element.find('div.highchart-box').html("").addClass(chart.chartType);
                    if (chart.config.measure) {
                        chart.config.measure.length = 0;
                    }
                    option = null;
                    return;
                }

                chart.config.measure = angular.copy(measure);
                addIbmModuleChart(chart.config, chart.chartType);
            });

            // 监听分类事件
            var CATEGORY_CHANGE_EV_OFF = $rootScope.$on("CATEGORY_CHANGE_EV", function (e, category) {
                if (!scope.selected) {
                    return;
                }

                chart.config.category = angular.copy(category);
                addIbmModuleChart(chart.config, chart.chartType);
            });

            // 请求moduleId
            function addIbmModuleChart(config, chartType) {
                var $chartEle = $element.find('.highchart-box');

                // 如果是仪表盘的话,只有在区间还未设置的情况下才不去请求
                if (chart.chartType == 'SpeedometerInstrumentChart') {
                    if (areaDatas.length == 0) {
                        return;
                    }
                } else if (chart.chartType == 'StandardScatterchart') {
                    if (!chart.config.measure || chart.config.measure.length < 2) {
                        return;
                    }
                } else {
                    if (!chart.config.dimension || !chart.config.measure || !chart.config.dimension.length || !chart.config.measure) {
                        return;
                    }
                }

                $chartEle.animate({
                    opacity: 0.3
                }, 400);

                loading = true;

                var dataFieldNames = [];
                var dimensionFieldName = [];
                var implicationFieldName = [];

                angular.forEach(chart.config.dimension, function (item) {
                    implicationFieldName.push(item.xymetric ? item.xymetric + "_" + item.columnid : item.columnid);
                });
                angular.forEach(chart.config.measure, function (item) {
                    dataFieldNames.push(item.xymetric ? (item.xymetric + "_" + item.columnid) : item.columnid);
                });
                angular.forEach(chart.config.category, function (item) {
                    dimensionFieldName.push("group_" + item.columnid);
                });
                if (chart.chartType == "StandardAreaChart") {
                    var chartType1 = "StandardAreaChart";
                    chart.chartType = "StandardPieChart";
                }
                tools.get({
                    url: '/Intelligence-Business-Management/addIbmModuleChart.htm',
                    data: {
                        areaDatas: chart.chartType == 'SpeedometerInstrumentChart' ? areaDatas.join(',') : null,
                        implicationFieldName: implicationFieldName.join(','),
                        dimensionFieldName: dimensionFieldName.join(','),
                        dataFieldName: dataFieldNames.join(','),
                        tableType: tools.data.getItem("tableType"),
                        pageId: tools.data.getItem('pageid'),
                        tbId: tools.data.getItem("tbId"),
                        chartId: chart.chartType,
                        moduleId: moduleId
                    },
                    succ: function (resp) {
                        if (resp.success) {
                            if (chartType1) {
                                chart.chartType = chartType1;
                            }
                            if (moduleId) {
                                delete chartlist[moduleId];
                            }
                            moduleId = chart.moduleId = resp.value;
                            chartlist[moduleId] = chart;
                            getChartData(moduleId);
                        }
                    }
                });
            }

            // 请求chart数据
            function getChartData(moduleId) {
                var $chartEle = $element.find('.highchart-box');
                if (!loading) {
                    $chartEle.animate({
                        opacity: 0.3
                    }, 800);
                    loading = true;
                }

                // 合并条件查询对象,联动查询对象
                var query = {
                    requestSequence: requestSequence,
                    moduleId: moduleId,
                    chartStyle: 'Hchart'
                };
                angular.extend(query, linkQuery, conditionQuery);
                // angular.extend(query, conditionQuery);

                // 如果正在下钻,则添加下钻条件
                if (chart.isDrill) {
                    query.layerNum = drillQuery.layerNum;
                    query.downDrillValue = drillQuery.implicationValue.join('-');
                }

                tools.get({
                    url: '/Intelligence-Business-Management/getChartByModuleId.htm',
                    data: query,
                    succ: function (resp) {
                        if (resp.success && resp.value.requestSequence == requestSequence) {
                            drawChart(resp);
                            if (!scope.isPreviewing) {
                                tools.data.setItem('cache-' + moduleId, resp);
                            }
                        }
                        loading = false;
                    }
                });
            }

            //绘制area
            function piantArea() {
                //随机颜色
                function getColor() {
                    return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6);
                }

                $element.find('.highchart-box').html("").append($("<div class='area-box' style='position:relative;'></div>"));
                var $chartEle = $element.find('.area-box');

                scope.dataArea = angular.copy(option.series[0].data);
                scope.sumValue = 0;
                angular.forEach(scope.dataArea, function (item) {
                    scope.sumValue += Number(item[1]);
                });

                // 排序
                for (var i = 0; i < scope.dataArea.length - 1; i++) {
                    for (var j = i; j < scope.dataArea.length; j++) {
                        if (scope.dataArea[i][1] < scope.dataArea[j][1]) {
                            var temp = scope.dataArea[i][1];
                            scope.dataArea[i][1] = scope.dataArea[j][1];
                            scope.dataArea[j][1] = temp;
                        }
                    }
                }

                scope.width = Number($element.width());
                scope.height = Number($element.height());
                $chartEle.css({
                    width: $element.width() + 'px',
                    height: $element.height() + 'px',
                    overflow: 'hidden'
                });

                angular.forEach(scope.dataArea, function (item, index) {
                    fgbox(Number(item[1]), item[0], index);
                });

                function fgbox(value, text, index) {
                    if (index % 2 == 0) {//偶数 竖着分
                        var width = value / scope.sumValue * scope.width; //宽度

                        var left = 0;
                        var top = 0;
                        if (index == 0) {
                            left = 0;
                            top = 0;
                        } else {
                            var obj2 = $chartEle.children('div').eq(index - 2);//
                            left = obj2.width() + obj2.position().left;
                            var obj1 = $chartEle.children('div').eq(index - 1);//
                            top = obj1.height() + obj1.position().top;
                        }

                        if (width > 20) {
                            $chartEle.append($('<div>' + text + '</div>'));
                        } else {
                            $chartEle.append($('<div title=' + text + '></div>'));
                        }

                        $chartEle.children('div:last').css({
                            background: getColor(),
                            width: width + 'px',
                            height: scope.height + 'px',
                            lineHeight: scope.height + 'px',
                            'text-align': 'center',
                            left: left + 'px',
                            top: top + 'px',
                            zIndex: 999 - index,
                            position: 'absolute'
                        });
                        scope.width -= Math.round(width);
                        scope.sumValue -= value;
                    } else { //奇数 横着切
                        var height = value / scope.sumValue * scope.height; //高度

                        var left = 0;
                        var top = 0;
                        if (index == 1) {
                            var obj = $chartEle.children('div').eq(index - 1);
                            left = obj.width() + obj.position().left;
                            top = 0;
                        } else {
                            var obj2 = $chartEle.children('div').eq(index - 2);
                            top = obj2.height() + obj2.position().top;
                            var obj1 = $chartEle.children('div').eq(index - 1);
                            left = obj1.width() + obj1.position().left;
                        }
                        if (height > 20) {
                            $chartEle.append($('<div>' + text + '</div>'));
                        } else {
                            $chartEle.append($('<div title=' + text + '></div>'));
                        }

                        $chartEle.children('div:last').css({
                            background: getColor(),
                            width: scope.width + 'px',
                            height: height + 'px',
                            'line-height': height + 'px',
                            'text-align': 'center',
                            left: left + 'px',
                            top: top + 'px',
                            'z-index': 999 - index,
                            position: 'absolute'
                        });
                        scope.height -= Math.round(height);
                        scope.sumValue -= value;
                    }
                }
            }

            // 绘制图,同时添加联动和下钻的操作
            function drawChart(resp) {
                if (!resp)
                    return;

                var $chartEle = $element.find('.highchart-box');

                if (resp.success) {
                    scope.option = option = resp.value.option;

                    if (!option.plotOptions) {
                        option.plotOptions = {};
                    }
                    if (!option.chart) {
                        option.chart = {};
                    }

                    option.chart.backgroundColor = "";

                    //绘制Area
                    if (chart.chartType == 'StandardAreaChart') {
                        piantArea();
                        $chartEle.css('cursor', 'pointer');
                        if (scope.menus[0].text == "修改标题") {
                            scope.menus.splice(0, 1);
                        }
                    }
                    // 联动
                    option.plotOptions.series = {
                        allowPointSelect: true,
                        events: {
                            click: function (e) {
                                var name = chart.chartType == 'StandardPieChart' ? e.point.name : e.point.category;
                                var $target = $(e.target);
                                if ($target.data('activate')) {
                                    $target.data('activate', false);
                                    $rootScope.$broadcast('LINK_EV', {
                                        identifier: identifier
                                    });
                                    return;
                                }
                                $target.data('activate', true);

                                $rootScope.$broadcast('LINK_EV', {
                                    implicationValue: drillQuery.implicationValue.length ? drillQuery.implicationValue.join('-') + '-' + name : name,
                                    dimensionValue: e.point.series.name,
                                    grangedModuleType: 'chart',
                                    grangedModuleId: moduleId,
                                    identifier: identifier
                                });
                            },
                            mouseover: function (e) {
                                $(e.target).css('cursor', 'pointer');
                            }
                        }
                    };

                    // 制作chart标题
                    if (scope.title) {
                        option.title = {
                            text: scope.title,
                            style: {
                                fontSize: '16px'
                            }
                        };
                    } else {
                        var measures = [];
                        var dimensions = [];

                        angular.forEach(chart.config.measure, function (item) {
                            measures.push(item.columntxt);
                        });
                        angular.forEach(chart.config.dimension, function (item) {
                            dimensions.push(item.columntxt);
                        });
                        option.title = {
                            text: dimensions.join(',') + '-' + measures.join(','),
                            style: {
                                fontSize: '16px'
                            }
                        };
                    }

                    // 绘制
                    if (chart.chartType == "StandardAreaChart") {
                        $chartEle.css({
                            opacity: 0.7,
                            overflow: 'hidden'
                        }).animate({
                            opacity: 1
                        }, 1500, function () {
                            loading = false;
                        });
                    } else {
                        $chartEle.css('zIndex', 0).highcharts(option).animate({
                            opacity: 1
                        }, 1500, function () {
                            loading = false;
                        });
                    }

                    $element.find('.highchart-box').removeClass(chart.chartType);

                    // 下钻操作
                    var labels = $chartEle.find('.highcharts-xaxis-labels text').length ? $chartEle.find('.highcharts-xaxis-labels text') : $chartEle.find('.highcharts-data-labels text');
                    labels.click(function (e) {
                        e.stopPropagation();

                        if (chart.config.dimension.length == 1 || !chart.isDrill || drillQuery.layerNum + 1 == chart.config.dimension.length) {
                            return;
                        }
                        drillQuery.implicationValue.push(chart.chartType == 'StandardPieChart' ? $(this).text().split(':')[0] : $(this).text());
                        drillQuery.layerNum++;
                        getChartData(moduleId);
                    });

                    // 设置可下钻的标志:下划线
                    if (chart.isDrill && chart.config.dimension.length > 1 && drillQuery.layerNum + 1 != chart.config.dimension.length) {
                        $chartEle.find('tspan').css('text-decoration', 'underline');
                    }
                } else {
                    $chartEle.html(resp.message);
                }

                if (scope.isPreviewing) {
                    $element.css('borderWidth', 0);
                }
                loading = false;
            }

            // 边框尺寸有变动
            var WH_RESIZE_EV_OFF = $rootScope.$on("WH_RESIZE_EV", function () {
                if (scope.selected && option && moduleId) {
                    $timeout(function () {
                        if (chart.chartType == "StandardAreaChart") {
                            piantArea();
                            return;
                        }
                        $element.find('div.w.h').highcharts(option);
                    }, 30);
                }
            });

            // 风格变化，重新绘制
            var THEME_OFF = $rootScope.$on('theme', function () {
                // $rootScope.$broadcast('CHART_REDRAW_EV');
            });

            // 条件过滤
            var CONDITION_FILTER_EV_OFF = $rootScope.$on('CONDITION_FILTER_EV', function (e, conditionId, constr) {
                if (!constr)
                    return;

                requestSequence++;

                if (constr == '-') {
                    conditionQuery["condition-" + conditionId] = null;
                } else {
                    conditionQuery["condition-" + conditionId] = constr;
                }
                getChartData(moduleId);
            });

            // 检测联动事件
            var LINK_EV_OFF = $rootScope.$on('LINK_EV', function (e, linkQuery_) {
                if (linkQuery_.identifier === identifier) {
                    return;
                }
                linkQuery = linkQuery_;
                getChartData(moduleId);
            });

            // 监听是否层级下钻
            var IS_DRILL_EV_OFF = $rootScope.$on('IS_DRILL_EV', function (e, isDrill_) {
                if (scope.selected) {
                    chart.isDrill = isDrill_;
                    getChartData(moduleId);
                }
            });

            // 预览
            var PREVIEW_EV_OFF = $rootScope.$on('PREVIEW_EV', function (e) {
                $timeout(function () {
                    scope.isPreviewing = true;
                    $element.css('border-width', 0);
                    $element.addClass('working');
                    linkQuery = {};
                    conditionQuery = {};
                    drillQuery.implicationValue.length = 0;
                    drillQuery.layerNum = 0;
                }, 10);
            });

            // 取消预览
            var PREVIEW_OFF_EV_OFF = $rootScope.$on('PREVIEW_OFF_EV', function () {
                $timeout(function () {
                    scope.isPreviewing = false;
                    $element.css('border-width', 1); // tools.data.setItem('cache-' + moduleId, resp);
                    $element.removeClass('working');
                    drawChart(tools.data.getItem('cache-' + moduleId));
                }, 10);
            });

            // 更新字体颜色
            var FONT_COLOR_EV_OFF = $rootScope.$on('FONT_COLOR_EV', function (e, newcolor) {
                scope.option.xAxis.labels = {
                    color: newcolor
                };
                $element.find('.highchart-box').highcharts(scope.option);
            });

            if (chart.chartType == 'SpeedometerInstrumentChart') {
                $rootScope.$on('DASHBOARD_RANGE_EV', function (e, range) {
                    chart.config.areaDatas = areaDatas = range;
                    addIbmModuleChart(chart.config, chart.chartType);
                });
            }

            var NUM_MODE_EV_OFF = $rootScope.$on('NUM_MODE_EV', function (e, mode) {
                if (!scope.selected) {
                    return;
                }
            });

            scope.$on("$destroy", function () {
                DIMENSION_CHANGE_EV_OFF();
                CONDITION_FILTER_EV_OFF();
                CATEGORY_CHANGE_EV_OFF();
                MEASURE_CHANGE_EV_OFF();
                PREVIEW_OFF_EV_OFF();
                FONT_COLOR_EV_OFF();
                WH_RESIZE_EV_OFF();
                IS_DRILL_EV_OFF();
                NUM_MODE_EV_OFF();
                PREVIEW_EV_OFF();
                LINK_EV_OFF();
                THEME_OFF();
            });
        },
        templateUrl: '/trend-BI/html/widgets/chart-box.html'
    }
}]);
// 日期组件
DIRECTIVES.directive('dateFilter', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            scope.cur_year = scope.cur_month = "";
            scope.date_mode = "day";
            scope.dates = [[], [], [], [], [], []];

            // 下一个月
            scope.next_month = function () {
                scope.cur_month++;
                if (scope.cur_month == 13) {
                    scope.cur_month = 1;
                    scope.cur_year++;
                }
                scope.list_date(scope.cur_year, scope.cur_month);
            }
            // 上一个月
            scope.prev_month = function () {
                scope.cur_month--;
                if (scope.cur_month == 0) {
                    scope.cur_month = 12;
                    scope.cur_year--;
                }
                scope.list_date(scope.cur_year, scope.cur_month);
            }
            // 下一年
            scope.next_year = function () {
                scope.list_date(++scope.cur_year, scope.cur_month);
            }
            // 上一年
            scope.prev_year = function () {
                scope.list_date(--scope.cur_year, scope.cur_month);
            }
            // 罗列日期
            scope.list_date = function (year, month) {
                var daysCntYear = [31, editorServ.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                var daysCntMonth = daysCntYear[month - 1];
                var dates = [];
                var date_min_seconds = editorServ.makeDateFromStr(scope.min_date).getTime();
                var date_max_seconds = editorServ.makeDateFromStr(scope.max_date).getTime();

                // 填充本月的天数
                for (var i = 1; i < daysCntMonth + 1; i++) {
                    var date_curr_seconds = new Date(scope.cur_year, scope.cur_month - 1, i);
                    if (date_curr_seconds >= date_min_seconds && date_curr_seconds <= date_max_seconds) {
                        dates.push({n: i, selectable: true, selected: false});
                    } else {
                        dates.push({n: i, selectable: false, selected: false});
                    }
                }

                // 本月1号是星期几，据此往前填充几天，比如本月1号是星期五，那么前面就要填补5天
                var weekOfFirstDay = (new Date(year, month - 1, 1)).getDay();

                // 填充上月末的天数
                var daysCntLastMonth = daysCntYear[(month - 1 == 0 ? 12 : month - 1) - 1];
                for (var j = 0; j < weekOfFirstDay; j++) {
                    dates.unshift({n: daysCntLastMonth--, selectable: false, selected: false});
                }

                // 填充下一月天数
                for (var len = dates.length, k = len + 1; k < 43; k++) {
                    dates.push({n: k - len, selectable: false, selected: false});
                }

                // 把dates 分割成二维数组用于显示
                for (var i = 0; i < scope.dates.length; i++) {
                    for (var j = 0; j < 7; j++) {
                        scope.dates[i][j] = dates[i * 7 + j];
                    }
                }

                isInPeriod();
            }

            var dayCopy0 = null;
            var dayCopy1 = null;
            var period_date_0 = "";
            var period_date_1 = "";
            var period_time_0 = 0;
            var period_time_1 = 0;

            // 选择一个日期
            scope.select = function (e, day) {
                if (!day.selectable) {
                    return;
                }
                if (day.selected) {
                    if (scope.date_mode == 'day') {
                        day.selected = false;
                        return $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, '-');
                    }
                }
                if (scope.date_mode == 'day') {
                    day.selected = true;

                    if (dayCopy0) {
                        dayCopy0.selected = false;
                    }
                    dayCopy0 = day;
                    $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, editorServ.makeStdDateStr(scope.cur_year, scope.cur_month, day.n, " 00:00:00") + ',' + editorServ.makeStdDateStr(scope.cur_year, scope.cur_month, day.n, " 23:59:59"));
                    day.high = true;
                } else {
                    if (dayCopy0 && dayCopy1) {
                        dayCopy0.selected = false;
                        dayCopy1.selected = false;
                        dayCopy0 = null;
                        dayCopy1 = null;
                        period_time_0 = period_time_1 = 0;
                        clear();

                        day.selected = true;
                        dayCopy0 = day;
                        period_date_0 = editorServ.makeStdDateStr(scope.cur_year, scope.cur_month, day.n, " 00:00:00");
                        period_time_0 = new Date(scope.cur_year, scope.cur_month, day.n).getTime();
                    } else if (!dayCopy0) {
                        day.selected = true;
                        dayCopy0 = day;
                        period_date_0 = editorServ.makeStdDateStr(scope.cur_year, scope.cur_month, day.n, " 00:00:00");
                        period_time_0 = new Date(scope.cur_year, scope.cur_month, day.n).getTime();
                    } else if (!dayCopy1) {
                        day.selected = true;
                        dayCopy1 = day;
                        period_date_1 = editorServ.makeStdDateStr(scope.cur_year, scope.cur_month, day.n, " 23:59:59");
                        period_time_1 = new Date(scope.cur_year, scope.cur_month, day.n).getTime();
                    }

                    isInPeriod();
                }
            }
            // 切换模式,日期与时间段
            scope.switch_date_mode = function (date_mode) {
                scope.date_mode = date_mode;
                dayCopy0 && (dayCopy0.selected = false);
                dayCopy1 && (dayCopy1.selected = false);
                period_time_0 = period_time_1 = 0;
                dayCopy0 = null;
                dayCopy1 = null;
                clear();
            }
            //  清除因为在某一个时间段内而被选中的格子背景色
            function clear() {
                for (var i = 0; i < scope.dates.length; i++) {
                    for (var j = 0; j < 7; j++) {
                        scope.dates[i][j].selected = false;
                    }
                }
            }

            // 检查是否在某一个时间段内,是的话着色
            function isInPeriod() {
                if (!period_time_0 || !period_time_1) {
                    return;
                }

                for (var i = 0; i < scope.dates.length; i++) {
                    for (var j = 0; j < 7; j++) {
                        if (scope.dates[i][j].selectable) {
                            var t = new Date(scope.cur_year, scope.cur_month, scope.dates[i][j].n).getTime();
                            if (period_time_0 > period_time_1) {
                                if (t >= period_time_1 && t <= period_time_0) {
                                    scope.dates[i][j].selected = true;
                                }
                            } else {
                                if (t >= period_time_0 && t <= period_time_1) {
                                    scope.dates[i][j].selected = true;
                                }
                            }
                        }
                    }
                }
            }

            // 在时间段的模式下,点击确定
            scope.confirm = function () {
                if (period_date_0 && period_date_1) {
                    $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, period_time_0 < period_time_1 ? period_date_0 + ',' + period_date_1 : period_date_1 + ',' + period_date_0);
                } else if (period_date_0) {
                    var s = /\d{4}-\d{2}-\d{2}/gi.exec(period_date_0)[0] + ' 00:00:00,' + /\d{4}-\d{2}-\d{2}/gi.exec(period_date_0)[0] + ' 23:59:59';
                    $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, s);
                } else if (period_date_1) {
                    var s = /\d{4}-\d{2}-\d{2}/gi.exec(period_date_1)[0] + ' 00:00:00,' + /\d{4}-\d{2}-\d{2}/gi.exec(period_date_1)[0] + ' 23:59:59';
                    $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, s);
                }
            }
            scope.getConditionData = function (conditionId) {
                editorServ.getRangeDatasByConditionId(conditionId, function (resp) {
                    showdata(resp);
                });
            }
            scope.recoverFilter = function () {

            }
            // 展示数据
            function showdata(resp) {
                if (resp.success) {
                    scope.min_date = resp.value.min.split(' ')[0];
                    scope.max_date = resp.value.max.split(' ')[0];
                    scope.cur_year = Number(/\d{4}/gi.exec(scope.max_date)[0]);
                    scope.cur_month = Number(/\d{4}-(\d{2})-\d{2}/gi.exec(scope.max_date)[1]);

                    scope.list_date(scope.cur_year, scope.cur_month);

                    $(element).css('background', '#fff');
                    editorServ.adjustPageSize($(element));
                }
            }

            scope.clrConditionData = function () {
                scope.dates = [[], [], [], [], [], []];
                $(element).css('background', '');
                scope.filter.conditionId = 0;
            }
            editorServ.adjustPageSize($(element));
        },
        templateUrl: '/trend-BI/html/widgets/date-filter.html'
    };
}]);
// 阈值组件
DIRECTIVES.directive('valueFilter', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            var $element = $(element);
            scope.min_ = scope.min = scope.max_ = scope.max = "";

            scope.ball_min_percent = 0;
            scope.ball_max_percent = 0;

            var $ball_min = $(element).find('.value-min');
            var $ball_max = $(element).find('.value-max');
            var ball_pagex = 0, ball_left = 0;

            var WH_RESIZE_EV_OFF = $rootScope.$on("WH_RESIZE_EV", function () {
                if (scope.selected) {
                    $ball_max.css('left', $(element).width() - 20 + 'px');
                }
            });

            // 当阈值条长短变化的时候动态更新小球的位置,由resizeAble指令发出
            $rootScope.$on('CHART_REDRAW_EV', function () {
                if (scope.selected) {
                    $ball_min.css('left', 0);
                    $ball_max.css('left', $(element).width() - 20 + 'px');
                }
            });

            // 监听移动小球事件
            $ball_min.on('mousedown', function (e) {
                ball_pagex = e.pageX;
                ball_left = $ball_min.position().left;
                $ball_min.data('moving', true);
                $ball_max.data('moving', false);
            });
            $ball_max.on('mousedown', function (e) {
                ball_pagex = e.pageX;
                ball_left = $ball_max.position().left;
                $ball_min.data('moving', false);
                $ball_max.data('moving', true);
            });
            // 监听拖放结束
            $element.on('mouseup', function (e) {
                // 判断是否在预览模式并且是拖动小球结束
                if (scope.isPreviewing && ($ball_min.data('moving') || $ball_max.data('moving'))) {
                    $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, scope.min + ',' + scope.max);
                }
                $ball_min.data('moving', false);
                $ball_max.data('moving', false);
            });
            // 拖动小球
            $document.on('mousemove', function (e) {
                if (!$ball_min.data('moving') && !$ball_max.data('moving'))
                    return;

                ball_left = ball_left + (e.pageX - ball_pagex);

                if (ball_left < 0 || ball_left > $(element).width() - 20) {
                    return;
                }

                if ($ball_min.data('moving')) {
                    $ball_min.css('left', ball_left + 'px');
                } else if ($ball_max.data('moving')) {
                    $ball_max.css('left', ball_left + 'px');
                }
                if ($ball_min.position().left < 0) {
                    $ball_min.css('left', 0);
                }
                if ($ball_min.position().left + 20 > $(element).width()) {
                    $ball_min.css('left', $(element).width() - 20 + 'px');
                }
                if ($ball_max.position().left < 0) {
                    $ball_max.css('left', 0);
                }
                if ($ball_max.position().left + 20 > $(element).width()) {
                    $ball_max.css('left', $(element).width() - 20 + 'px');
                }
                ball_pagex = e.pageX;
                changeValue();
            });

            // 根据小球位置算出当前阈值范围
            function changeValue() {
                var total_width = $element.width() - 20;
                $timeout(function () {
                    scope.min = Math.floor($ball_min.position().left / total_width * (scope.max_ - scope.min_) + scope.min_);
                    scope.max = Math.floor($ball_max.position().left / total_width * (scope.max_ - scope.min_) + scope.min_);
                    if (scope.min > scope.max) {
                        var max = scope.max;
                        scope.max = scope.min;
                        scope.min = max;
                    }
                }, 0);
            }

            scope.getConditionData = function (conditionId) {
                editorServ.getRangeDatasByConditionId(conditionId, function (resp) {
                    tools.data[conditionId] = angular.copy(resp);
                    showdata(resp);
                });
            }

            scope.recoverFilter = function () {
                $ball_min.css('left', 0);
                $ball_max.css('left', $(element).width() - 20 + 'px');
            }

            function showdata(resp) {
                if (resp.success) {
                    $ball_min.css('left', 0);
                    $ball_max.css('left', $(element).width() - 20 + 'px');
                    $element.removeClass('value-filter-box').css('background', '#fff');
                    scope.min_ = scope.min = Number(resp.value.min);
                    scope.max_ = scope.max = Number(resp.value.max);
                } else {

                }
            }

            scope.clrConditionData = function () {
                scope.dates = [[], [], [], [], [], []];
                scope.filter.conditionId = 0;
                $element.addClass('value-filter-box').css('background', '');
            }

            editorServ.adjustPageSize($(element));
        },
        templateUrl: '/trend-BI/html/widgets/value-filter.html'
    };
}]);
// 下拉框组件
DIRECTIVES.directive('selectFilter', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            scope.items = [];
            scope.op = {
                selected: scope.filter.filtername + '下拉选择'
            };

            scope.getConditionData = function (conditionId) {
                editorServ.getSelectDatasByConditionId(conditionId, function (resp) {
                    showdata(resp);
                });
            }
            function showdata(resp) {
                if (resp.success) {
                    $(element).removeClass('select-filter-box');
                    scope.items = resp.value;
                    scope.items.unshift(scope.filter.filtername + '下拉选择');
                } else {

                }
            }

            scope.clrConditionData = function () {
                $timeout(function () {
                    scope.items.length = 0;
                    scope.filter.conditionId = 0;
                    $(element).addClass('select-filter-box').css('background', '');
                }, 0);
            }

            scope.recoverFilter = function () {
                scope.op.selected = "*";
            }

            scope.$watch('op.selected', function (nv, ov) {
                if (nv === '*' || nv.indexOf('下拉选择') != -1) {
                    $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, '-');
                    return;
                }
                $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, nv);
            });

            editorServ.adjustPageSize($(element));
        },
        templateUrl: '/trend-BI/html/widgets/select-filter.html'
    };
}]);
// 多选框组件
DIRECTIVES.directive('checkBoxFilter', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            scope.items = [];
            scope.op = {
                selected: ''
            };

            scope.getConditionData = function (conditionId) {
                editorServ.getSelectDatasByConditionId(conditionId, function (resp) {
                    showdata(resp);
                });
            }
            function showdata(resp) {
                if (resp.success) {
                    $(element).removeClass('check-box-filter-box');
                    scope.items.length = 0;
                    angular.forEach(resp.value, function (item) {
                        scope.items.push({
                            str: item,
                            selected: false
                        });
                    });
                    $timeout(function () {
                        var $labels = $(element).find('.filter-box-module').find('label');
                        var mostlen = 0;
                        $labels.each(function () {
                            if ($(this).width() > mostlen) {
                                mostlen = $(this).width();
                            }
                        });
                        $labels.each(function () {
                            $(this).width(mostlen + 2 + 'px');
                        });
                        $(element).css({
                            height: $(element).find('.item-box').height() + 20
                        });
                    }, 50);
                }
            }

            scope.clrConditionData = function () {
                $timeout(function () {
                    scope.items.length = 0;
                    scope.filter.conditionId = 0;
                    $(element).addClass('check-box-filter-box').css('background', '');
                }, 0);
            }

            scope.recoverFilter = function () {
                angular.forEach(scope.items, function (item) {
                    item.selected = false;
                });
            }

            scope.select = function (item) {
                var selected = [];
                angular.forEach(scope.items, function (item) {
                    if (item.selected) {
                        selected.push(item.str);
                    }
                });
                if (selected.length) {
                    $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, selected.join(','));
                } else {
                    $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, "-");
                }
            }

            editorServ.adjustPageSize($(element));
        },
        templateUrl: '/trend-BI/html/widgets/check-box-filter.html'
    };
}]);
// 单选框组件
DIRECTIVES.directive('radioFilter', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            scope.items = [];
            scope.selectedItem = "*";
            scope.selectedIndex = -1;

            scope.getConditionData = function (conditionId) {
                editorServ.getSelectDatasByConditionId(conditionId, function (resp) {
                    if (resp.success) {
                        showdata(resp);
                    }
                });
            }

            function showdata(resp) {
                $(element).removeClass('radio-filter-box');
                scope.items = resp.value;

                $timeout(function () {
                    var $labels = $(element).find('.filter-box-module').find('label');
                    var mostlen = 0;
                    $labels.each(function () {
                        if ($(this).width() > mostlen) {
                            mostlen = $(this).width();
                        }
                    });
                    if (mostlen < 30) {
                        mostlen = 30;
                    }
                    $labels.each(function () {
                        $(this).width(mostlen + 'px');
                    });
                    $(element).css({
                        height: $(element).find('.item-box').height() + 20
                    });
                    editorServ.adjustPageSize($(element));
                }, 50);
            }

            scope.clrConditionData = function () {
                $timeout(function () {
                    scope.items.length = 0;
                    scope.filter.conditionId = 0;
                    $(element).addClass('radio-filter-box').css('background', '');
                }, 0);
            }

            scope.recoverFilter = function () {
                scope.selectedItem = "*";
                scope.selectedIndex = -1;
            }

            scope.select = function (index, item) {
                if (scope.selectedIndex == index) {
                    scope.selectedItem = '*';
                    scope.selectedIndex = -1;
                    $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, '-');
                    return;
                }
                scope.selectedIndex = index;
                scope.selectedItem = item;
                $rootScope.$broadcast("CONDITION_FILTER_EV", scope.filter.conditionId, scope.selectedItem);
            }

            function adjuseSize() {

            }

            editorServ.adjustPageSize($(element));
        },
        templateUrl: '/trend-BI/html/widgets/radio-filter.html'
    };
}]);
// 文本组件
DIRECTIVES.directive('note', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            var conditionId = attr.conditionid == '0' ? tools.makeConditionId() : attr.conditionid;
            var widget = scope.widget = conditionId && tools.data.getItem('itemlist').notelist[conditionId] ? tools.data.getItem('itemlist').notelist[conditionId] : {
                height: Number(attr.height),
                width: Number(attr.width),
                left: Number(attr.left),
                top: Number(attr.top),
                chartType: attr.type,
                conditionId: conditionId,
                notetext: attr.notetext,
                style: {}
            };

            if (scope.widget.style) {
                $(element).find('.content').css(scope.widget.style);
            }

            $rootScope.$on('NOTE-' + conditionId, function (e, obj) {
                scope.widget.notetext = obj.notetext;
                scope.widget.style = angular.copy(obj);

                $(element).find('.content').css(scope.widget.style);
            });

            var $element = $(element);


            if (!tools.data.getItem('itemlist').notelist[conditionId]) {
                tools.data.getItem('itemlist').notelist[conditionId] = widget;
            }

            $element.css({
                height: Number(widget.height) * tools.gridwidth() + 'px',
                width: Number(widget.width) * tools.gridwidth() + 'px',
                left: Number(widget.left) * tools.gridwidth() + 'px',
                top: Number(widget.top) * tools.gridwidth() + 'px'
            });
            $element.find('.content').css({
                'height': "100%",
                'line-height': Number(widget.height) * tools.gridwidth() + 'px'
            });

            // 右键菜单
            scope.menus = [
                {
                    text: '删除',
                    fn: angular.bind(scope, function (e) {
                        $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                        scope.delete_fn();
                    })
                }
            ];
            scope.rightclick = function () {
                $rootScope.$broadcast('CONTEXT_MENU_EV', scope.menus);
            }
            scope.delete_fn = function (e) {
                $rootScope.$broadcast("confirm",
                    {
                        'title': '删除提醒',
                        'content': '删除之后将不再可见，确定删除吗?',
                        'btns': [
                            {
                                'text': '是',
                                'style': 'btn-primary',
                                'fn': function () {
                                    delete tools.data.data.itemlist.notelist[conditionId];
                                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                                    $(element).remove();
                                }
                            },
                            {
                                'text': '否',
                                'style': 'btn-primary',
                                'fn': function () {
                                }
                            }
                        ]
                    }
                );
            };

            scope.isPreviewing = false;
            editorServ.adjustPageSize($(element));
            $rootScope.$broadcast("POS_AREA_ALIAN_EV", $element);

            // 预览
            var PREVIEW_EV_OFF = $rootScope.$on('PREVIEW_EV', function (e) {
                $timeout(function () {
                    scope.isPreviewing = true;
                }, 10);
            });

            // 取消预览
            var PREVIEW_OFF_EV_OFF = $rootScope.$on('PREVIEW_OFF_EV', function () {
                $timeout(function () {
                    scope.isPreviewing = false;
                }, 10);
            });

            // 边框尺寸有变动
            var WH_RESIZE_EV_OFF = $rootScope.$on("WH_RESIZE_EV", function () {
                if (scope.selected) {
                    $element.find('.content').css({
                        height: $element.height() + 'px',
                        lineHeight: $element.height() + 'px'
                    });
                }
            });
        },
        templateUrl: '/trend-BI/html/widgets/note-condition.html'
    };
}]);
// 动态数字组件
DIRECTIVES.directive('syncdata', ["$rootScope", 'tools', "$document", "$timeout", "$interval", "editorServ", function ($rootScope, tools, $document, $timeout, $interval, editorServ) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            var intv, $element = $(element);
            var moduleId = Number(attr.moduleid) ? attr.moduleid : "";
            var syncdatalist = tools.data.getItem('itemlist')['syncdatalist'];
            var sync = scope.sync = moduleId ? tools.data.getItem('itemlist')['syncdatalist'][moduleId] : {
                height: Number(attr.height),
                width: Number(attr.width),
                left: Number(attr.left),
                top: Number(attr.top),
                chartType: attr.type,
                config: {},
                moduleId: moduleId,
                style: {}
            };

            $rootScope.$on('SYNCDATA-' + moduleId, function (e, obj) {
                sync.style = angular.copy(obj);

                $element.find('.dataValue').css(sync.style);
            });

            $element.css({
                height: sync.height * tools.gridwidth(),
                width: sync.width * tools.gridwidth(),
                left: sync.left * tools.gridwidth(),
                top: sync.top * tools.gridwidth()
            });

            if (sync.style) {
                $element.find('.dataValue').css(sync.style).css('lineHeight', $element.height() + 'px');
            }
            scope.isPreviewing = false;

            scope.delete_fn = function (e) {
                if (scope.title_edit_show) {
                    return;
                }
                if (moduleId) {
                    editorServ.delete_chart(moduleId, "deleteIbmModuleChartByModuleId", function (resp) {
                        if (resp.success) {
                            // 更新chartlist
                            delete syncdatalist[moduleId];
                            // 通知容器删除此chart
                            $rootScope.$broadcast('ITEM_REMOVE_EV', attr.identifier, sync.chartType);
                            $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                            $element.fadeOut(500).remove();
                            $interval.cancel(intv);
                        } else {
                            alert(resp.message);
                        }
                    });
                } else {
                    $rootScope.$broadcast('ITEM_REMOVE_EV', attr.identifier, sync.chartType);
                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                    $interval.cancel(intv);
                    $(element).remove();
                }
                if (e) {
                    e.preventDefault();
                }
            };

            // 右键菜单
            scope.menus = [
                {
                    text: '删除',
                    fn: angular.bind(scope, function () {
                        $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                        scope.delete_fn();
                    })
                }
            ];
            scope.rightclick = function () {
                $rootScope.$broadcast('CONTEXT_MENU_EV', scope.menus);
                scope.context_mune_showing = true;
            }

            editorServ.adjustPageSize($element);

            // 请求父容器帮助对齐网格线
            $rootScope.$broadcast("POS_AREA_ALIAN_EV", $element);

            // 如果有moduleId那么直接绘图
            if (moduleId) {
                getSyncData(moduleId);
            }

            // 监听字段事件
            var MEASURE_CHANGE_EV_OFF = $rootScope.$on("MEASURE_CHANGE_EV", function (e, measure) {
                if (!scope.selected) {
                    return;
                }
                if (!measure || measure.length == 0) {
                    $(element).addClass('syncdata');
                    sync.config = {};
                    sync.moduleId = 0;
                    $timeout(function () {
                        scope.dataValue = "";
                    }, 0);
                    $interval.cancel(intv);
                    return;
                }
                sync.config.measure = angular.copy(measure);
                addIbmModuleChart(sync.config, sync.chartType);
            });

            // 请求conditionId
            function addIbmModuleChart(config, chartType) {
                if (!sync.config.measure || !sync.config.measure.length) {
                    return;
                }
                tools.get({
                    url: '/Intelligence-Business-Management/addIbmModuleTable.htm',
                    data: {
                        lineFieldNames: sync.config.measure[0].xymetric ? sync.config.measure[0].xymetric + "_" + sync.config.measure[0].columnid : sync.config.measure[0].columnid,
                        // lineFieldNames: sync.config.measure[0].columnid,
                        tabType: 'syncdata',
                        tableType: tools.data.getItem("tableType"),
                        pageId: tools.data.getItem('pageid'),
                        tbId: tools.data.getItem("tbId"),
                        chartId: sync.chartType,
                        moduleId: moduleId
                    },
                    succ: function (resp) {
                        if (resp.success) {
                            if (moduleId) {
                                delete syncdatalist[moduleId];
                            }
                            moduleId = sync.moduleId = resp.value;
                            syncdatalist[moduleId] = sync;
                            getSyncData(moduleId);
                        }
                    }
                });
            }

            scope.dataValue = "";

            // 请求chart数据
            function getSyncData(moduleId) {
                tools.get({
                    url: '/Intelligence-Business-Management/getDatasByModuleId.htm',
                    data: {
                        moduleId: moduleId
                    },
                    succ: function (resp) {
                        if (resp.success) {
                            scope.dataValue = resp.value.datas;
                            $(element).removeClass('syncdata');
                        }
                    }
                });
            }

            // 边框尺寸有变动
            var WH_RESIZE_EV_OFF = $rootScope.$on("WH_RESIZE_EV", function () {
                if (scope.selected && moduleId) {
                    $element.find('.dataValue').css('lineHeight', $element.height() + 'px');
                }
            });

            // 预览
            var PREVIEW_EV_OFF = $rootScope.$on('PREVIEW_EV', function (e) {
                $timeout(function () {
                    scope.isPreviewing = true;
                }, 10);
            });

            // 取消预览
            var PREVIEW_OFF_EV_OFF = $rootScope.$on('PREVIEW_OFF_EV', function () {
                $timeout(function () {
                    scope.isPreviewing = false;
                }, 10);
            });

            intv = $interval(function () {
                if (moduleId) {
                    getSyncData(moduleId);
                }
            }, 10000);

            scope.$on("$destroy", function () {
                MEASURE_CHANGE_EV_OFF();
                PREVIEW_OFF_EV_OFF();
                WH_RESIZE_EV_OFF();
                PREVIEW_EV_OFF();
                $interval.cancel(intv);
            });
        },
        templateUrl: '/trend-BI/html/widgets/syncdata-condition.html'
    };
}]);
// 右键显示上下文
DIRECTIVES.directive('contextMenu', ["$parse", "$rootScope", "tools", "$compile", function ($parse, $rootScope, tools, $compile) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        templateUrl: "/trend-BI/html/widgets/context-menu.html",
        link: function (scope, element, attrs) {
            scope.menus = [];
            $rootScope.$on('CONTEXT_MENU_EV', function (e, menus_) {
                scope.menus = menus_;
            });
            $rootScope.$on('CONTEXT_MENU_HIDE_EV', function () {
                $(".rightMenu").hide();
            });
            //右击菜单的隐藏
            $(document).click(function (e) {
                var obj = angular.element(e.target);
                if (obj.parent("ul").attr("id") == "navMenu" || obj.children("ul").hasClass("nav")) {
                    return;
                }
                $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                scope.context_mune_showing = false;
            });
            //时间 json数据
            scope.nav_content = [{
                text: '年', c: [{
                    year: "2014年", fn: function () {
                        alert(1);
                    }
                }, {
                    year: "2015年", fn: function () {
                        alert(1);
                    }
                }, {
                    year: "2016年", fn: function () {
                        alert(1);
                    }
                }]
            }, {
                text: "月", c: [{
                    year: "1", fn: function () {
                        alert(1);
                    }
                }, {
                    year: "2", fn: function () {
                    }
                }, {
                    year: "3", fn: function () {
                    }
                }]
            }, {
                text: "季度", c: [{
                    year: "5", fn: function () {
                        alert(1);
                    }
                }, {
                    year: "6", fn: function () {
                    }
                }, {
                    year: "7", fn: function () {
                    }
                }]
            }];
            //新建 array
            scope.xinj = [{
                text: "pp", fn: function () {
                    alert(1);
                }
            }, {
                text: "tt", fn: function () {
                    alert(1);
                }
            }, {
                text: "oo", fn: function () {
                    alert(1);
                }
            }];
            //多级菜单
            scope.showNav = function (index) {
                var obj = $("#navMenu").children("li").eq(index);
                if (obj.html() == "时间") {
                    //angular
                    var html = "<ul class='nav'><li ng-mouseover='showNav2($index,$event)' ng-repeat='item in nav_content'>{{item.text}}</li></ul>";
                    createDom(html, obj);
                    bindEvent(obj);
                }
                if (obj.html() == "新建") {
                    if (scope.xinj.length > 0) {
                        var html = "<ul class='nav'><li ng-click='item.fn()' ng-repeat='item in xinj'>{{item.text}}</li></ul>";
                        createDom(html, obj);
                    }
                }
            }
            //angular mouseover
            scope.showNav2 = function (index, event) {
                var obj = angular.element(event.target);
                if (obj.html() == scope.nav_content[index].text) {  //text->json:text
                    scope.arry = [];
                    scope.arry = scope.nav_content[index].c;
                    var html = "<ul class='nav'><li ng-click='item.fn()' ng-repeat='item in arry'>{{item.year}}</li></ul>";
                    createDom(html, obj);
                    obj.mouseleave(function () {
                        $(this).children(".nav").remove();
                    });
                }
            }
            //angular html to dom
            function createDom(html, obj) {
                var template = angular.element(html);
                var dom = $compile(template)(scope);
                obj.append(dom);
                bindEvent(obj);
                obj.css("position", "relative");
                obj.children(".nav").css({"left": obj.outerWidth() + 'px', 'top': '0px'});
            }

            function bindEvent(obj) {
                obj.mouseover(function () {
                    $(this).children(".nav").show();
                });
                obj.mouseleave(function () {
                    $(this).children(".nav").hide();
                });
            }
        }
    }
}]);
// 每个组件公用的指令
DIRECTIVES.directive('filter', ["$rootScope", 'tools', "$document", "$timeout", "$parse", "editorServ", function ($rootScope, tools, $document, $timeout, $parse, editorServ) {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attr) {
            var conditionId = scope.conditionid = Number(attr.conditionid) ? attr.conditionid : "";
            var chartType = attr.type;
            var listType = "";

            scope.isPreviewing = false;

            switch (chartType) {
                case 'radio':
                    listType = "radiolist";
                    break;
                case 'checkbox':
                    listType = "checkboxlist";
                    break;
                case 'select':
                    listType = "selectlist";
                    break;
                case 'date':
                    listType = "datelist";
                    break;
                case 'between':
                    listType = "betweenlist";
                    break;
            }

            var $element = $(element);
            editorServ.adjustPageSize($element);

            var filter = scope.filter = conditionId && tools.data.getItem('itemlist')[listType][conditionId] ? tools.data.getItem('itemlist')[listType][conditionId] : {
                height: Number(attr.height),
                width: Number(attr.width),
                left: Number(attr.left),
                top: Number(attr.top),
                chartType: chartType,
                config: [],
                filtername: '',
                conditionId: ''
            };

            $element.css({
                height: Number(filter.height) * tools.gridwidth() + 'px',
                width: Number(filter.width) * tools.gridwidth() + 'px',
                left: Number(filter.left) * tools.gridwidth() + 'px',
                top: Number(filter.top) * tools.gridwidth() + 'px'
            });

            if (filter.conditionId) {
                $timeout(function () {
                    scope.getConditionData(filter.conditionId, false);
                }, 500);
            }

            // 删除chart的回调函数
            scope.delete_fn = function (e) {
                if (filter.conditionId) {
                    editorServ.delete_chart(filter.conditionId, "deletePageCondition", function (resp) {
                        if (resp.success) {
                            // 更新chartlist
                            delete tools.data.getItem('itemlist')[listType][filter.conditionId];
                            // 通知容器删除此组件
                            $rootScope.$broadcast('ITEM_REMOVE_EV', attr.identifier, chartType);
                            $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                            $(element).fadeOut(500).remove();
                        } else {
                            alert(resp.message);
                        }
                    });
                } else {
                    $rootScope.$broadcast('ITEM_REMOVE_EV', attr.identifier, chartType);
                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                }
                if (e) {
                    e.preventDefault();
                }
            };

            // 请求父容器帮助对齐网格线
            $rootScope.$broadcast("POS_AREA_ALIAN_EV", $element);

            // 右键菜单
            scope.menus = [
                {
                    text: '删除',
                    fn: angular.bind(scope, function (e) {
                        if (e) {
                            e.preventDefault();
                        }
                        $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                        scope.delete_fn();
                    })
                }
            ];
            scope.rightclick = function () {
                $rootScope.$broadcast('CONTEXT_MENU_EV', scope.menus);
            }

            var conditionTypes = {
                radio: 'equal',
                checkbox: 'in',
                select: 'equal',
                date: 'between',
                between: 'between'
            };

            // 监听拖放事件
            var CONDITION_CHANGE_EV_OFF = $rootScope.$on('CONDITION_CHANGE_EV', function (e, config_) {
                if (!scope.selected) {
                    return;
                }
                if (!config_.length) {
                    filter.conditionId = "";
                    filter.config.length = 0;
                    scope.clrConditionData();
                    scope.$digest();
                    return;
                }

                filter.config[0] = config_[0];
                filter.filtername = config_[0].columntxt;

                editorServ.addPageCondition(filter.config, filter.conditionId, conditionTypes[chartType], chartType, function (resp) {
                    if (resp.success) {
                        if (scope.filter.conditionId) {
                            delete tools.data.getItem('itemlist')[listType][scope.filter.conditionId];
                        }
                        scope.filter.conditionId = resp.value.conditionId;
                        scope.getConditionData(scope.filter.conditionId, true, scope.filter);
                        tools.data.getItem('itemlist')[listType][scope.filter.conditionId] = scope.filter;
                    } else {
                        alert(resp.message);
                    }
                });
            });

            // 预览
            var PREVIEW_EV_OFF = $rootScope.$on('PREVIEW_EV', function (e) {
                $timeout(function () {
                    scope.isPreviewing = true;
                }, 10);
            });

            // 取消预览
            var PREVIEW_OFF_EV_OFF = $rootScope.$on('PREVIEW_OFF_EV', function () {
                $timeout(function () {
                    scope.isPreviewing = false;
                    // 组件复原
                    scope.recoverFilter();
                }, 10);
            });
            scope.$on("$destroy", function () {
                CONDITION_CHANGE_EV_OFF();
                PREVIEW_OFF_EV_OFF();
                PREVIEW_EV_OFF();
            });
        }
    }
}]);
// 用于让sheet chart filter 可移动
DIRECTIVES.directive('moveAble', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attr) {
            var $element = $(element), $parent = $element.parent(), $charts_container = $('#charts-container');
            var left = 0, top = 0, moveX = 0, moveY = 0, pageX = 0, pageY = 0;

            // 按下鼠标，记录位置
            $(element).on('mousedown', function (event) {
                if (event.button != 0)
                    return;
                pageX = event.pageX;
                pageY = event.pageY;
                top = $parent.position().top;
                left = $parent.position().left;

                $document.on('mouseup', mouseup);
                $document.on('mousemove', mousemove);

                $element.css({
                    cursor: 'move'
                });
                event.preventDefault();
                event.stopPropagation();
            });

            function mousemove(event) {
                if (attr.isResizing) {
                    return;
                }

                attr.isMoving = true;
                moveX = event.pageX - pageX;
                moveY = event.pageY - pageY;
                pageX = event.pageX;
                pageY = event.pageY;
                left += moveX;
                top += moveY;

                if (left < 0) {
                    left = 0;
                }
                if (top < 0) {
                    top = 0;
                }
                if (left + $parent.width() > $charts_container.width()) {
                    left = $charts_container.width() - $parent.width();
                }
                $parent.css({
                    left: left + 'px',
                    top: top + 'px'
                });

                // 如果页面高度不够就增加
                if (top + $element.height() > $charts_container.height() - 20) {
                    $charts_container.height($charts_container.height() + 50);
                    $rootScope.$broadcast('AUXILIARY_LINE_EV');
                }
            }

            function mouseup(ev) {
                ev.preventDefault();
                ev.stopPropagation();

                $document.off('mousemove', mousemove);
                $document.off('mouseup', mouseup);

                $timeout(function () {
                    attr.isMoving = false;
                }, 30);

                // 更新chart对象
                if (scope.chart) {
                    scope.chart.left = editorServ.countpos(left / tools.gridwidth());
                    scope.chart.top = editorServ.countpos(top / tools.gridwidth());
                } else if (scope.sheet) {
                    scope.sheet.left = editorServ.countpos(left / tools.gridwidth());
                    scope.sheet.top = editorServ.countpos(top / tools.gridwidth());
                } else if (scope.filter) {
                    scope.filter.left = editorServ.countpos(left / tools.gridwidth());
                    scope.filter.top = editorServ.countpos(top / tools.gridwidth());
                } else if (scope.widget) {
                    scope.widget.left = editorServ.countpos(left / tools.gridwidth());
                    scope.widget.top = editorServ.countpos(top / tools.gridwidth());
                } else if (scope.sync) {
                    scope.sync.left = editorServ.countpos(left / tools.gridwidth());
                    scope.sync.top = editorServ.countpos(top / tools.gridwidth());
                }
                // 移动结束通知位置贴边
                $rootScope.$broadcast("POS_AREA_ALIAN_EV", $parent);
            }
        }
    }
}]);
// 用于让sheet chart filter 可拉伸
DIRECTIVES.directive('resizeAble', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attr) {
            var $element = $(element), $parent = $element.parent(), $charts_container = $('#charts-container');
            var moveX, moveY, pageX, pageY, width, height, mode, base_y, base_x;

            $(element).delegate('b.point', 'mousedown', function (event) {
                var $tar = $(event.target);

                if ($tar.hasClass('point_rm')) {
                    mode = "right";
                } else if ($tar.hasClass('point_br')) {
                    mode = "right-bottom";
                } else if ($tar.hasClass('point_bm')) {
                    mode = "bottom";
                } else if ($tar.hasClass('point_tr')) {
                    mode = "right-top";
                } else if ($tar.hasClass('point_tm')) {
                    mode = 'top-middle';
                } else if ($tar.hasClass('point_lm')) {
                    mode = "left-middle";
                } else if ($tar.hasClass('point_bl')) {
                    mode = 'bottom-left';
                } else if ($tar.hasClass('point_tl')) {
                    mode = "top-left";
                }

                pageX = event.pageX;
                pageY = event.pageY;
                width = $parent.width();
                height = $parent.height();
                base_y = pageY + height;
                base_x = pageX + width;

                attr.isResizing = true;

                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
                // event.stopPropagation();
            });

            $element.delegate('b.point', 'mouseover', function (event) {
                var $ele = $(event.target);
                if ($ele.hasClass('point_rm')) {
                    $ele.css('cursor', 'e-resize');
                } else if ($ele.hasClass('point_br')) {
                    $ele.css('cursor', 'se-resize');
                } else if ($ele.hasClass('point_bm')) {
                    $ele.css('cursor', 's-resize');
                }
            });

            function mousemove(event) {
                if (attr.isMoving) {
                    return;
                }

                moveX = event.pageX - pageX;
                moveY = event.pageY - pageY;
                pageX = event.pageX;
                pageY = event.pageY;
                width += moveX;
                height += moveY;

                switch (mode) {
                    case 'right':
                        $parent.css({
                            width: width + 'px'
                        });
                        break;
                    case 'bottom':
                        $parent.css({
                            height: height + 'px'
                        });
                        break;
                    case 'right-bottom':
                        $parent.css({
                            width: width + 'px',
                            height: height + 'px'
                        });
                        break;
                    case 'right-top':
                        $parent.css({
                            width: width + 'px',
                            height: base_y - pageY + 'px',
                            top: $parent.position().top + moveY + 'px'
                        });
                        break;
                    case 'top-middle':
                        $parent.css({
                            height: base_y - pageY + 'px',
                            top: $parent.position().top + moveY + 'px'
                        });
                        break;
                    case 'left-middle':
                        $parent.css({
                            width: base_x - pageX + 'px',
                            left: $parent.position().left + moveX + 'px'
                        });
                        break;
                    case 'bottom-left':
                        $parent.css({
                            width: base_x - pageX + 'px',
                            height: height + 'px',
                            left: $parent.position().left + moveX + 'px'
                        });
                        break;
                    case 'top-left':
                        $parent.css({
                            width: base_x - pageX + 'px',
                            height: base_y - pageY + 'px',
                            left: $parent.position().left + moveX + 'px',
                            top: $parent.position().top + moveY + 'px'
                        });
                        break;
                }

                $parent.find('.interactive').css({
                    width: '100%',
                    height: '100%'
                });

                if ($parent.position().top + $parent.height() >= $charts_container.height() - 20) {
                    $charts_container.height($charts_container.height() + 50);
                    $rootScope.$broadcast('AUXILIARY_LINE_EV');
                }
                if ($parent.position().left + $parent.width() > $charts_container.width()) {
                    $parent.css('width', $charts_container.width() - $parent.position().left + 'px');
                }

                $rootScope.$broadcast('WH_RESIZING_EV', $parent.find('.interactive').width(), $parent.find('.interactive').height());
            }

            function mouseup() {
                $document.off('mousemove', mousemove);
                $document.off('mouseup', mouseup);

                var content_height = 0;
                $parent.find('.filter-box-module').each(function () {
                    content_height += $(this).height();
                });

                var interactive_height = $parent.find('.interactive').height();
                if (interactive_height < content_height) {
                    $parent.find('.interactive').height(content_height);
                    $parent.height(content_height);
                    attr.height = content_height;
                }

                $timeout(function () {
                    attr.isResizing = false;
                }, 30);

                var w = $parent.width();
                var h = $parent.height();

                if (scope.chart) {
                    scope.chart.width = editorServ.countpos(w / tools.gridwidth());
                    scope.chart.height = editorServ.countpos(h / tools.gridwidth());
                } else if (scope.sheet) {
                    scope.sheet.width = editorServ.countpos(w / tools.gridwidth());
                    scope.sheet.height = editorServ.countpos(h / tools.gridwidth());
                } else if (scope.filter) {
                    scope.filter.width = editorServ.countpos(w / tools.gridwidth());
                    scope.filter.height = editorServ.countpos(h / tools.gridwidth());
                } else if (scope.widget) {
                    scope.widget.width = editorServ.countpos(w / tools.gridwidth());
                    scope.widget.height = editorServ.countpos(h / tools.gridwidth());
                } else if (scope.sync) {
                    scope.sync.width = editorServ.countpos(w / tools.gridwidth());
                    scope.sync.height = editorServ.countpos(h / tools.gridwidth());
                }

                // 拉伸结束通知位置贴边
                $rootScope.$broadcast("POS_AREA_ALIAN_EV", $parent);
                // 通知对应的chart或者sheet或者组件更新样式
                $rootScope.$broadcast('WH_RESIZE_EV');
            }
        }
    }
}]);
// 用于让sheet chart filter 可被选中
DIRECTIVES.directive('selectAble', ["$rootScope", 'tools', "$document", "$timeout", "editorServ", function ($rootScope, tools, $document, $timeout, editorServ) {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attr) {
            var identifier = tools.identifier();
            var selected = false;

            function markSelected() {
                var $ele = $(element), $parent = $ele.parent();
                $parent.css('z-index', '50');
                selected = true;
                scope.selected = true;

                (function (arr) {
                    for (var i = 0; i < arr.length; i++) {
                        $ele.append('<b class = "' + "point point_" + arr[i] + '"></b>');
                    }
                })(["tr", "tl", "br", "bl", "tm", "bm", "lm", "rm"]);

                $rootScope.$broadcast('UNSELECTED_EV', identifier);

                if ($(element).parent().hasClass('chart-box')) {
                    var config = angular.copy(scope.chart.config);
                    config.isDrill = scope.chart.isDrill;
                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', angular.copy({
                        chartType: scope.chart.chartType,
                        data: config
                    }));
                } else if ($(element).parent().hasClass('table-box')) {
                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', angular.copy({
                        chartType: scope.sheet.chartType,
                        data: scope.sheet.config
                    }));
                } else if ($(element).parent().hasClass('filter-box')) {
                    scope.$parent.selected = true;
                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', angular.copy({
                        chartType: "condition",
                        data: {
                            condition: scope.filter.config
                        }
                    }));
                } else if ($(element).parent().hasClass('note-condition')) {
                    scope.$parent.selected = true;

                    var data = scope.widget.style ? angular.extend(scope.widget.style, {
                        conditionId: scope.widget.conditionId,
                        notetext: scope.widget.notetext
                    }) : {
                        conditionId: scope.widget.conditionId,
                        notetext: scope.widget.notetext
                    };

                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', angular.copy({
                        chartType: "note",
                        data: data
                    }));
                } else if ($(element).parent().hasClass('syncdata-condition')) {
                    scope.$parent.selected = true;

                    var data = angular.extend(scope.sync.style, {
                        moduleId: scope.sync.moduleId,
                        measure: scope.sync.config.measure
                    });
                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', angular.copy({
                        chartType: "syncdata",
                        data: data
                    }));
                }
            }

            $(element).on('click', function (ev) {
                if (scope.context_mune_showing) {
                    $rootScope.$broadcast('CONTEXT_MENU_HIDE_EV');
                    scope.context_mune_showing = false;
                    return;
                }
                var $ele = $(ev.target);
                if (selected) {
                    if (attr.isResizing || attr.isMoving) {
                        return;
                    }
                    selected = false;
                    scope.selected = false;
                    $ele.css('cursor', 'pointer').find('.point').remove();
                    // $ele.parent().css('z-index', 1);

                    $rootScope.$broadcast('DIMENSION_RECOVERY_EV', null);
                    return;
                }
                markSelected();
                ev.stopPropagation();
            });

            $rootScope.$on('UNSELECTED_EV', function (e, identifier_) {
                var $ele = $(element);
                // 如果点击了container的空白地方
                if (identifier_ === undefined) {
                    /*if (scope.selected) {
                     $(element).data('selected', false).parent().css('z-index', '0');
                     $ele.css('cursor', 'pointer').find('.point').remove();
                     selected = false;
                     scope.selected = false;
                     }*/
                    return;
                }
                if (identifier == identifier_) {
                    return;
                }
                $(element).data('selected', false).parent().css('z-index', 1);
                $ele.css('cursor', 'pointer').find('.point').remove();
                scope.selected = selected = false;
            });
            $timeout(function () {
                if ($(element).parent().attr('data-moduleid') == '0' || $(element).parent().attr('data-conditionid') == '0') {
                    markSelected();
                }
            }, 50);
        }
    }
}]);
// sheet chart filter 的鼠标右击事件
DIRECTIVES.directive('ngRightClick', ["$parse", "$rootScope", "tools", function ($parse, $rootScope, tools) {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs) {
            var fn = $parse(attrs.ngRightClick);
            element[0].addEventListener('contextmenu', function (e) {
                if (e.button == 2) {
                    scope.$apply(function () {
                        e.preventDefault();
                        fn(scope, {$event: e});
                    });
                    $(".rightMenu").show().css({"top": e.clientY, "left": e.clientX});
                } else {
                    $(".rightMenu").hide();
                }
                return false;
            });
            element[0].addEventListener('mouseup', function (e) {
                if (e.button == 0) {
                    $(".rightMenu").hide();
                }
            });
        }
    }
}]);
// sheet chart filter 监听键盘按键事件,主要监听delete backspace
DIRECTIVES.directive("keydownListen", ["$rootScope", "tools", "$document", "editorServ", "$parse", function ($rootScope, tools, $document, editorServ, $parse) {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs) {
            var $element = $(element);
            var gridWidth = tools.gridwidth();
            var delete_fn = $parse(attrs.ngDeleteFn);
            var $charts_container = $('#charts-container');
            $element.on('keydown', function (e) {
                if (!scope.selected) {
                    return;
                }
                var code = e.keyCode, top = $element.position().top, left = $element.position().left;

                switch (code) {
                    case 8: // backspace
                        scope.$apply(function () {
                            delete_fn(scope, {$event: e});
                        });
                        break;
                    case 46: // delte
                        scope.$apply(function () {
                            delete_fn(scope, {$event: e});
                        });
                        break;
                }
            });
        }
    }
}]);
// 为以上sheet chart filter服务的公用函数,大部分都是和后端交互的函数
SERVICES.factory("editorServ", ['tools', "$rootScope", "$document", function (tools, $rootScope, $document) {
    return {
        // 增加条件组件
        addPageCondition: function (config, conditionId, conditionType, frontElementType, cb) {
            if (config.length == 0) {
                return;
            }
            tools.get({
                url: '/Intelligence-Business-Management/addPageCondition.htm',
                data: {
                    pageId: tools.data.getItem('pageid'),
                    conditionId: conditionId,
                    tableType: config[0].tabletype,
                    columnId: config[0].columnid,
                    tbId: config[0].tabid,
                    conditionType: conditionType,
                    frontElementType: frontElementType
                },
                succ: function (resp) {
                    cb && cb(resp);
                }
            });
        },
        // 获取组件范围值
        getRangeDatasByConditionId: function (conditionId, cb) {
            tools.get({
                url: '/Intelligence-Business-Management/getRangeDatasByConditionId.htm',
                data: {
                    conditionId: conditionId
                },
                succ: function (resp) {
                    cb && cb(resp);
                }
            });
        },
        // 获取下拉框的数值
        getSelectDatasByConditionId: function (conditionId, cb) {
            tools.get({
                url: '/Intelligence-Business-Management/getSelectDatasByConditionId.htm',
                data: {
                    conditionId: conditionId
                },
                succ: function (resp) {
                    cb && cb(resp);
                }
            });
        },
        // 删除组件
        deletePageCondition: function (conditionId, cb) {
            tools.get({
                url: '/Intelligence-Business-Management/deletePageCondition.htm',
                data: {
                    pageId: tools.data.getItem('pageid'),
                    conditionId: conditionId
                },
                succ: function (resp) {
                    cb && cb(resp);
                }
            });
        },
        // 删除一个chart
        deleteIbmModuleChartByModuleId: function (moduleId, cb) {
            tools.get({
                url: '/Intelligence-Business-Management/deleteIbmModuleChartByModuleId.htm',
                data: {
                    moduleId: moduleId
                },
                succ: function (resp) {
                    cb && cb(resp);
                }
            });
        },
        // 删除一个sheet
        deleteIbmModuleDataByModuleId: function (moduleId, cb) {
            tools.get({
                url: '/Intelligence-Business-Management/deleteIbmModuleDataByModuleId.htm',
                data: {
                    moduleId: moduleId
                },
                succ: function (resp) {
                    cb && cb(resp);
                }
            });
        },
        makeDateFromStr: function (datestr) {
            var year = Number(/\d{4}/gi.exec(datestr)[0]);
            var month = Number(/\d{4}-(\d{2})/gi.exec(datestr)[1]);
            var day = Number(/\d{4}-\d{2}-(\d{2})/gi.exec(datestr)[1]);
            return new Date(year, month - 1, day);
        },
        isLeapYear: function (year) {
            if (year % 100 != 0 && year % 4 == 0) {
                return true;
            }
            if (year % 100 == 0 && year % 400 == 0) {
                return true;
            }
            return false;
        },
        makeStdDateStr: function (year, month, day, flg) {
            if (("" + month).length == 1) {
                month = "0" + month;
            }
            if (("" + day).length == 1) {
                day = "0" + day;
            }
            if (flg) {
                return year + "-" + month + "-" + day + flg;
            } else {
                return year + "-" + month + "-" + day;
            }
        },
        delete_chart: function (id, delfn, cb) {
            var self = this;
            $rootScope.$broadcast("confirm",
                {
                    'title': '删除提醒',
                    'content': '删除之后将不再可见，确定删除吗?',
                    'btns': [
                        {
                            'text': '是',
                            'style': 'btn-primary',
                            'fn': function () {
                                self[delfn](id, cb);
                            }
                        },
                        {
                            'text': '否',
                            'style': 'btn-primary',
                            'fn': function () {
                            }
                        }
                    ]
                }
            );
        },
        adjustPageSize: function ($ele, flag) {
            var $charts_container = $('#charts-container');
            if ($ele.position().top + tools.gridwidth() + $ele.height() > $charts_container.height() - 100) {
                $charts_container.height($ele.position().top + tools.gridwidth() + $ele.height() + 100);
                $rootScope.$broadcast('AUXILIARY_LINE_EV');
            }
        },
        countpos: function (n) {
            if (n - Math.floor(n) < Math.ceil(n) - n) {
                return Math.floor(n);
            } else {
                return Math.ceil(n);
            }
        }
    }
}]);
DIRECTIVES.directive('fullScreen', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
            scope.shown = false;
            scope.chart_box_shown = false;
            scope.sheet_box_shown = false;
            scope.sheetlist = [];

            $(element).find('.full-screen-chart-box,.full-screen-sheet-box').css({
                width: $(element).width(),
                height: $(element).height()
            });
            $rootScope.$on('FULL_SCREEN_EV', function (e, type, args) {
                if (type == 'chart') {
                    scope.chart_box_shown = true;
                    scope.sheet_box_shown = false;
                    $(element).find('.full-screen-chart-box').highcharts(args);
                } else {
                    scope.sheet_box_shown = true;
                    scope.chart_box_shown = false;
                    scope.sheetlist.length = 0;
                    args.width = '96%';
                    args.height = '96%';
                    args.left = 0;
                    args.top = 0;
                    $timeout(function () {
                        console.log(args);
                        scope.sheetlist.push(args);
                    }, 10);
                }
                scope.shown = true;
            });
            scope.close = function () {
                scope.shown = false;
            }

            // 取消预览
            var PREVIEW_OFF_EV_OFF = $rootScope.$on('PREVIEW_OFF_EV', function () {
                scope.close();
            });

            scope.$on("$destroy", function () {
                PREVIEW_OFF_EV_OFF();
            });
        },
        templateUrl: "/trend-BI/html/widgets/fullScreen.html"
    }
}]);
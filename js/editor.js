MAIN.controller('editorCtrl', ["$scope", "$rootScope", "tools", "$timeout", "$routeParams", "$location", function ($scope, $rootScope, tools, $timeout, $routeParams, $location) {
    // 截屏函数
    $scope.screenCapture = tools.screenCapture;
    var pagename = '';
    var pageid = '';
    $scope.choosechart = true;
    var chartType = 'default';
    $scope.showtabletype = '';
    $scope.setpage = false;
    $scope.savepagename = false;
    $scope.showsummarytab = false;
    $scope.showdetailtab = false;
    //初始化x,y,h,l,s的数组begin
    $scope.ycolumns = [];
    $scope.xcolumns = [];
    $scope.hcolumns = [];
    $scope.lcolumns = [];
    $scope.scolumns = [];
    $scope.speedometerinstrumentinplist = [
        {
            'num':'',
            'classname':''
        },
        {
            'num':'',
            'classname':''
        }
    ];
    //初始化x,y,h,l,s的数组end
    //初始化图表，组件，表格数组begin
    $scope.chartlist = [];
    $scope.sheetlist = [];
    $scope.betweenlist = [];
    $scope.radiolist = [];
    $scope.checkboxlist = [];
    $scope.selectlist = [];
    $scope.datelist = [];
    $scope.notelist = [];
    $scope.syncdatalist = [];
    $scope.itemlist = {
        chartlist: {},
        checkboxlist: {},
        radiolist: {},
        betweenlist: {},
        selectlist: {},
        datelist: {},
        sheetlist: {},
        notelist: {},
        syncdatalist: {}

    };

    // share
    $scope.sharepage = function(){
        var sharecontent = {
            'pageId':tools.data.getItem("pageid"),
            'tbId':tools.data.getItem("tbId"),
            'tableType':tools.data.getItem("tableType")
        };

    	$rootScope.$broadcast('share',sharecontent)
    	// if(pageId){
    	// 	$rootScope.$broadcast('share',pageId)
    	// } else {
    		
    	// }
    	
    };

    // 仪表盘区间设置
    $scope.speedometerinstrumentAdd = function(){
        $scope.speedometerinstrumentinplist.push({'num':'','classname':''});
    };

    $scope.speedometerinstrumentDel = function(){

        if($scope.speedometerinstrumentinplist.length <= 2){
            return false;
        } else {
            $scope.speedometerinstrumentinplist.splice($scope.speedometerinstrumentinplist.length-1,1)
        }
        
    };

    $scope.SpeedometerInstrumentsubmit = function(){
        var speedometerinstrumentinplist =[];
        speedometerinstrumentinplist[0]=$scope.speedometerinstrumentinplist[0].num;
        for(var i = 1; i < $scope.speedometerinstrumentinplist.length; i++){
            if(!$scope.speedometerinstrumentinplist[i-1].num && $scope.speedometerinstrumentinplist[i-1].num!='0'){
                //console.log($scope.speedometerinstrumentinplist[i-1])
                $scope.speedometerinstrumentinplist[i-1] = {'classname':'error','num':''};
                return false;
            } else {
                $scope.speedometerinstrumentinplist[i-1].classname = '';
            };
            
            if(parseInt($scope.speedometerinstrumentinplist[i].num) <= $scope.speedometerinstrumentinplist[i-1].num || !$scope.speedometerinstrumentinplist[i].num){
                $scope.speedometerinstrumentinplist[i] = {'classname':'error','num':''};
                return false;
            } else {
                $scope.speedometerinstrumentinplist[i].classname = '';
                speedometerinstrumentinplist[i]=$scope.speedometerinstrumentinplist[i].num;
            }
        };
        $rootScope.$broadcast('DASHBOARD_RANGE_EV',speedometerinstrumentinplist);

        
    }

    tools.data.setItem('itemlist', $scope.itemlist);
    $scope.username = tools.storage.getItem('userName');
    //初始化图表，组件，表格数组begin
    $scope.model = {
        tablist: [],
        showtab: {}
    };
    //保存时像后台传递数据时用

    var tid = '';
    var ttype = '';
    //是否层级下来
    $scope.triplevelchange = function (isDrill) {
        $scope.isDrill = isDrill;
        $rootScope.$broadcast('IS_DRILL_EV', isDrill)
    }

    //预览页面
    $scope.viewclick = function () {
        $(".conbody").css({'top': '-100%', 'opacity': '0'});
        $rootScope.$broadcast('PREVIEW_EV');
        $scope.showsystem = true;
        $('.fade').css('background',$("#pagebgcolor").val())
        $(".conbody").height($(window).height() - 30);
        $(".conbody").width(tools.dragcontentwidth() + 15);
        $(".conbody").css('left', ($(window).width() - tools.dragcontentwidth()) / 2);
        $(".conbody").animate({top: "0%", opacity: '1'}, 1000);
        $(document).keyup(function (event) {
            if (event.keyCode == 27) {
                $scope.closesystem();
            }
        });
        

    };
    //关闭预览页面
    $scope.closesystem = function () {
        // $timeout(function () {
        //     $scope.showsystem = false;
        //     $(".conbody").height($(window).height() - 225);
    
        //     $(".conbody").width($('.drag-charts').width());
        // }, 0)

        // $rootScope.$broadcast('PREVIEW_OFF_EV');
        // $('.bgwhite').css({'background':'#333'})
       
        $scope.showsystem = false;
        $(".conbody").height($(window).height() - 225);
        $(".conbody").width($('.drag-charts').width());
        $rootScope.$broadcast('PREVIEW_OFF_EV');
        $('.bgwhite').css({'background':'#333'})
    };

    //返回度量
    var gocondition = function () {
        $(".sidebar-nav-left").scrollTop($("#measuretop").height() + $("#dimensiontop").height() + 20)
    };
    var gomeasure = function () {
        $(".sidebar-nav-left").scrollTop(10)
    };
    var godimension = function () {
        $(".sidebar-nav-left").scrollTop($("#measuretop").height() + 10)
    };

    $('.drag-content').click(function () {
        $rootScope.$broadcast('UNSELECTED_EV');
    })
    //删除页面
    $scope.deletePage = function () {
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
                                'pageId': pageid
                            },
                            succ: function (data) {
                                if (data.success) {
                                    //alert('删除成功');
                                    window.location.href = '#/index';

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

    //保存页面
    $scope.saveform = function (cb) {
        tools.screenCapture();
        $scope.saveformclick = true;
        $('.saveprogressbar').css({'width': '0%'});
        $rootScope.$broadcast('CHART_SAVE_EV');
        //$scope.chartboxlist.length = 0;
        if (!chartStyle) {
            chartStyle = 'default';
        };


        $('.saveprogressbar').animate({width: '100%', text: '100%'}, 5000, function () {
            // $('.saveprogressbar').text('保存成功');
            $timeout(function () {
                $scope.saveformclick = false;
            }, 500);

        });
        var  set = {
            setpagejson:{
                'background':$('#pagebgcolor').val(),
                'color':$('#pagefontcolor').val()
            },
            itemlist:tools.data.getItem('itemlist')
        }
      
        $.post(
            '/Intelligence-Business-Management/updatePage.htm',
            {
                'pageJson': "{'jsonObject':" + JSON.stringify(set) + '}',
                'pageId': pageid,
                'pageName': pagename,
                'chartStyle': chartStyle,
                'tableType': ttype,
                'tbId': tid,
                
                
            },
            function (data) {
                var data = JSON.parse(data);
                $timeout(function () {
                    //$scope.saveformclick = false;
                    if (data.success) {

                        if (!cb) {

                            //alert("保存成功");
                        } else {
                            cb();
                        }
                    } else {
                        if (data.message != 'session expired') {
                            alert(data.message)
                        }

                    }
                    ;

                }, 5501);

            }
        );
        //截图并上传
        $timeout(function () {
            $.post(
                '/Intelligence-Business-Management/uploadPagePicture.htm',
                {
                    'pageId': pageid,
                    'pagePic': $('.imgsrc').val()
                },
                function (data) {

                }
            );
        }, 5000)

    }
    //点击新建，弹出弹框
    $scope.setnewpage = function () {
        if (pageid) {
            $rootScope.$broadcast("confirm", {
                'title': '保存提醒',
                'content': '是否对之前页面进行保存',
                'btns': [
                    {
                        'text': '否',
                        'style': 'btn-default',
                        'fn': function () {
                            //$rootScope.$broadcast('setnewpage-event-no');
                            $scope.getcolumn();
                            $scope.setpage = true;
                        }
                    },
                    {
                        'text': '是',
                        'style': 'btn-primary',
                        'fn': function () {
                            //$rootScope.$broadcast('setnewpage-event-yes');
                            $scope.saveform(function () {
                                $scope.getcolumn();
                                $scope.setpage = true;
                            });
                        }
                    },
                ]
            });
        } else {
            $scope.getcolumn();
            $scope.setpage = true;

        }
    }

    //点击新建弹框中的单选，选择使用表格
    $scope.radiochk = function (tids, ttypes) {
        tid = tids;
        ttype = ttypes;

    }
    //保存新建页面,返回pageid
    $scope.savepage = function () {
        if ($(".pagename").val() == '') {
            alert('页面名称不能为空');
            return false;
        } else if (tid == '') {
            alert('请选择表格');
            return false;
        }
        ;
        tools.get({
            url: '/Intelligence-Business-Management/updatePage.htm',
            data: {
                'pageName': $(".pagename").val(),
                'tbId': tid,
                'tableType': ttype,
                'pageJson': {'jsonObject': []},
                'chartStyle': 'default',
            },
            succ: function (data) {
                if (data.success) {
                    tools.data.setItem('tbId', tid);
                    tools.data.setItem('tableType', ttype);
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
    //监听拖拽图表，画出图表
    var onchartlist = $rootScope.$on("chartlist", function (e, name) {
        $scope.xcolumns.length = $scope.ycolumns.length = 0;
        if (name.chartType == 'summarytab' || name.chartType == 'crosstab' || name.chartType == 'detailtab') {
            // $scope.showtable = true;
            $scope.sheetlist.push(name);
        } else if (name.chartType == 'syncdata') {
            $scope.syncdatalist.push(name);
        } else {
            $scope.chartlist.push(name);
        };
        $timeout(function () {
        }, 0)
    });
    //删除图表调用方法
    var delchartitem = function (chartitemlist, itemidentifier) {
        for (var i = 0; i < chartitemlist.length; i++) {
            if (chartitemlist[i].identifier == itemidentifier) {
                //chartitemlist.splice(i,1);
                chartitemlist[i].del = true;
                break;
            }
        }
    }
    //删除图表
    var onitemremoveev = $rootScope.$on('ITEM_REMOVE_EV', function (e, itemidentifier, itemtype) {
        //console.log($scope.chartlist)
        if (itemtype == 'StandardLineChart' || itemtype == 'StandardBarChart' || itemtype == 'StandardPieChart') {
            delchartitem($scope.chartlist, itemidentifier);
        } else if (itemtype == 'summarytab' || itemtype == 'crosstab' || itemtype == 'detailtab') {
            delchartitem($scope.sheetlist, itemidentifier);
        } else if (itemtype == 'radio') {
            delchartitem($scope.radiolist, itemidentifier);
        } else if (itemtype == 'checkbox') {
            delchartitem($scope.checkboxlist, itemidentifier);
        } else if (itemtype == 'select') {
            delchartitem($scope.selectlist, itemidentifier);
        } else if (itemtype == 'date') {
            delchartitem($scope.datelist, itemidentifier);
        } else if (itemtype == 'between') {
            delchartitem($scope.betweenlist, itemidentifier);
        };
        $timeout(function () {
        }, 0);
    })
    //监听拖拽组件，画出组件
    var onassemblylist = $rootScope.$on("assemblylist", function (e, name) {
        //console.log(name)
        if (name.chartType == 'radio') {
            $scope.radiolist.push(name);
        } else if (name.chartType == 'checkbox') {
            $scope.checkboxlist.push(name);
        } else if (name.chartType == 'select') {
            $scope.selectlist.push(name);
        } else if (name.chartType == 'date') {
            $scope.datelist.push(name);
        } else if (name.chartType == 'between') {
            $scope.betweenlist.push(name);
        } else if (name.chartType == 'note') {
            $scope.notelist.push(name);
        };
        $timeout(function () {
        }, 0)
    })

    //左边菜单生成，显示所选表格数据
    $scope.choosetable = function (tableid, tableType) {
        $(".drag-charts").width($(".main").width());
        if (tableid) {
            $scope.choosetabid = tableid;
            $scope.model.showtab = {};
            tools.get({
                url: '/Intelligence-Business-Management/getTable.htm?tbId=' + tableid + '&tableType=' + tableType,
                succ: function (data) {
                    if (data.success == true) {
                        $timeout(function () {
                            $scope.model.showtab = data.value;
                            //$scope.tableType = tableType;
                            //$scope.tbId = tableid;
                        }, 0);
                    } else {
                        if (data.message != 'session expired') {
                            alert(data.message)
                        }
                    }
                }
            });
        } else {
            return false;
        }


    };
    //监听pagelist，用于切换页面时刷新页面数据
    var onpagelist = $rootScope.$on("pagelist", function (e, pagelist) {
        tools.data.delItem('itemlist');
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
            chartlist: {},
            checkboxlist: {},
            radiolist: {},
            betweenlist: {},
            selectlist: {},
            datelist: {},
            sheetlist: {},
            notelist: {},
            syncdatalist: {}
        };

        if(pagelist.pageJson.setpagejson){
            $('#pagebgcolor').val(pagelist.pageJson.setpagejson.background);
            $('#pagefontcolor').val(pagelist.pageJson.setpagejson.color);
            $('.conbody').css({'background':$('#pagebgcolor').val(),'color':$('#pagefontcolor').val()});
        }


        if (pagelist.pageJson.itemlist && !(pagelist.pageJson.itemlist instanceof Array)) {
            $scope.itemlist = pagelist.pageJson.itemlist;

            angular.forEach($scope.itemlist.chartlist, function (item) {
                $scope.chartlist.push(item);
            });
            angular.forEach($scope.itemlist.checkboxlist, function (item) {
                $scope.checkboxlist.push(item);
            });
            angular.forEach($scope.itemlist.radiolist, function (item) {
                $scope.radiolist.push(item);
            });
            angular.forEach($scope.itemlist.betweenlist, function (item) {
                $scope.betweenlist.push(item);
            });
            angular.forEach($scope.itemlist.selectlist, function (item) {
                $scope.selectlist.push(item);
            });
            angular.forEach($scope.itemlist.datelist, function (item) {
                $scope.datelist.push(item);
            });
            angular.forEach($scope.itemlist.sheetlist, function (item) {
                $scope.sheetlist.push(item);
            });
            angular.forEach($scope.itemlist.notelist, function (item) {
                $scope.notelist.push(item);
            });
            angular.forEach($scope.itemlist.syncdatalist, function (item) {
                $scope.syncdatalist.push(item);
            });
        }

        tools.data.setItem('itemlist', $scope.itemlist);
        pageid = pagelist.pageId;
        tools.data.setItem("pageid", pageid);
        tools.data.setItem("tbId", pagelist.tbId);
        tools.data.setItem("tableType", pagelist.tableType);
        pagename = pagelist.pageName;
        chartStyle = pagelist.chartStyle;
        tid = pagelist.tbId;
        ttype = pagelist.tableType;
        $timeout(function () {
            $scope.choosetable(pagelist.tbId, pagelist.tableType);
        }, 0);

    })
    //监听图表风格选择
    var ontheme = $rootScope.$on('theme', function (e, themename) {
        chartStyle = themename;
    })
    //xy全部删除
    $scope.delallxy = function () {
        $scope.ycolumns.length = $scope.xcolumns.length = $scope.lcolumns.length = 0;
        $rootScope.$emit('DIMENSION_CHANGE_EV', []);
        $rootScope.$emit('MEASURE_CHANGE_EV', []);
        $rootScope.$emit('CONDITION_CHANGE_EV', []);
        $rootScope.$emit('LISTHEADER_CHANGE_EV', []);

    }
    //xy整体交换
    $scope.xychangeall = function () {
        var midcolumns = [];
        midcolumns = $scope.xcolumns;
        $scope.xcolumns = $scope.ycolumns;
        $scope.ycolumns = midcolumns;
        $rootScope.$emit('DIMENSION_CHANGE_EV', $scope.xcolumns);
        $rootScope.$emit('MEASURE_CHANGE_EV', $scope.ycolumns);
    }

    /*xy单个删除掉用方法*/
    var delxy = function (xycolumns, columnid, broadcastname) {
        for (var i = 0; i < xycolumns.length; i++) {
            if (columnid == xycolumns[i].columnid) {
                xycolumns.splice(i, 1);
            }
        };
        $rootScope.$broadcast(broadcastname, xycolumns);
    }
    //单个删除
    $("body").delegate(".del", "click", function () {
        if ($(this).parents('#chartx').length > 0) {
            delxy($scope.xcolumns, $(this).parents(".inptext").attr("columnid"), 'DIMENSION_CHANGE_EV');
        } else if ($(this).parents('#charty').length > 0) {
            delxy($scope.ycolumns, $(this).parents(".inptext").attr("columnid"), 'MEASURE_CHANGE_EV');
        } else if ($(this).parents('#dragcolorx').length > 0) {
            delxy($scope.dragcolorcons, $(this).parents(".inptext").attr("columnid"), 'CATEGORY_CHANGE_EV');
        } else if ($(this).parents('#tablel').length > 0) {
            delxy($scope.lcolumns, $(this).parents(".inptext").attr("columnid"), 'LISTHEADER_CHANGE_EV');
        };
        if ($(this).parents('.condition').length > 0) {
            delxy($scope.xcolumns, $(this).parents(".inptext").attr("columnid"), 'CONDITION_CHANGE_EV');
        }
        $timeout(function () {
        }, 0)
        //$(this).parents(".inptext").remove();

    });
    /*xy拖拽释放调用方法*/
    var setxy = function (xycolumns, dragarr, broadcastname) {
        var xypush = true;
        for (var i = 0; i < xycolumns.length; i++) {
            if (xycolumns[i].columnid == dragarr.columnid) {
                alert("不能重复拖拽相同字段");
                //xypush = false;
                return false;
            }
        }

        var len = xycolumns.length;


        $timeout(function () {
            xycolumns[len] = dragarr;
            /*xycolumns.push(dragarr);*/
            $rootScope.$broadcast(broadcastname, xycolumns);
        }, 0)
    };
    //监听图表点击
    $scope.xyfn = {"title": "图表x轴y轴设置", "xname": "x轴设置(维度)", "yname": "y轴设置(度量)"};
    var onDIMENSIONRECOVERYEV = $rootScope.$on("DIMENSION_RECOVERY_EV", function (e, name) {
/*

        document.getElementById("EventScroll").onmousewheel=function(e){
            if(e.wheelDelta>0){
//                up
                $("div.data-table-box").scrollTop($("div.data-table-box").scrollTop()-100);
            }
            if(e.wheelDelta<0){
//                down
                $("div.data-table-box").scrollTop($("div.data-table-box").scrollTop()+100);
            }
        };*/


    	var dchartheight = $('.drag-charts').height();
        $timeout(function(){
            $('.conbody').height($(window).height() - $('.drag-charts').height()-82);
            $('.drag-charts').css({'line-height':($('.drag-charts').height()-38)+'px'})
        },100);
        $("span.inptext").remove();
        $scope.note = {};
        $scope.syncdata = {};
        $scope.xcolumns.length = $scope.ycolumns.length = $scope.lcolumns.length = $scope.dragcolorcons = 0;
        $scope.speedometerinstrumentinplist = [
            {
                'num':'',
                'classname':''
            },
            {
                'num':'',
                'classname':''
            }
        ];
        if (!name) {
            $scope.choosechart = true;
            $('.drag-charts').height(dchartheight);
            $('.drag-charts').css({'line-height':(dchartheight-38)+'px'})
            return false;
        } else {
        	$('.drag-charts').height('auto');
            $scope.choosechart = false;
            $scope.choosecharttype = name.chartType;
            gomeasure();
            if (name.chartType == 'StandardPieChart') {
                if (name.data) {
                    $scope.isDrill = name.data.isDrill;
                }
                //扇形图
                $scope.showdetailtab = false;
                $scope.xyfn = {"title": "图表x轴y轴设置", "xname": "维度", "yname": "度量",'drag':false};
            } else if(name.chartType =='SpeedometerInstrumentChart'){
                $scope.xyfn = {"title": "仪表盘设置", "yname": "度量",'drag':false};
                //仪表盘
            } else if(name.chartType == 'StandardScatterchart'){
                $scope.xyfn = {"title": "散点图设置(度量必须要有两个,维度可以为空)", "xname": "维度", "yname": "度量",'drag':false};
            } else if (name.chartType == 'summarytab') {
                //汇总表
                $scope.showdetailtab = false;
                $scope.xyfn = {"title": "表格元素设置", "xname": "表头(维度)", "yname": "汇总(度量)",'drag':false};
            } else if (name.chartType == 'crosstab') {
                //交叉表
                $scope.showdetailtab = false;
                $scope.xyfn = {"title": "表格元素设置", "xname": "行表头(维度)", "yname": "汇总(度量)", "lname": "列表头(维度)",'drag':true};
            } else if (name.chartType == 'detailtab') {
                //明细表
                $scope.showdetailtab = true;
                $scope.xyfn = {"title": "表格元素设置", "xname": "度量/维度",'drag':false};
            } else if (name.chartType == 'condition') {
                //gocondition();
                $scope.showdetailtab = false;
                $scope.xyfn = {"title": "组件元素设置", "xname": "组件",'drag':false};
            } else if (name.chartType == 'note') {
                $scope.showdetailtab = false;
                $scope.xyfn = {"title": "文本元素设置",'drag':false};
            } else if (name.chartType == 'syncdata') {
                $scope.showdetailtab = false;
                $scope.xyfn = {"title": "动态数字设置", "yname": "度量", 'drag':false};
                $scope.syncdata = {
                    'fontSize':name.data.fontSize,
                    'textAlign':name.data.textAlign,
                    'background':name.data.background,
                    'color':name.data.color,
                    'moduleId':name.data.moduleId
                }
            } else {
                if (name.data) {
                    $scope.isDrill = name.data.isDrill;
                }
                $scope.showdetailtab = false;
                $scope.xyfn = {"title": "图表x轴y轴设置", "xname": "x轴设置(维度)", "yname": "y轴设置(度量)",'drag':false};
             
            };
            if (name.data) {
                if (name.data.dimension && name.data.dimension.length > 0) {
                    $scope.xcolumns = name.data.dimension;
                };
                if (name.data.measure && name.data.measure.length > 0) {
                    $scope.ycolumns = name.data.measure;
                };
                if (name.data.listheader && name.data.listheader.length > 0) {
                    $scope.lcolumns = name.data.listheader;
                };
                if (name.data.condition && name.data.condition.length > 0) {
                    $scope.xcolumns = name.data.condition;
                };
                if (name.data.category && name.data.category.length > 0) {
                    $scope.dragcolorcons = name.data.category;
                };

                if(name.data.areaDatas && name.data.areaDatas.length > 0){
                    for(var i = 0; i < name.data.areaDatas.length; i++){
                        $scope.speedometerinstrumentinplist[i].num = name.data.areaDatas[i];
                    }
                }

                if(name.chartType == 'note') {
                    $scope.note = {
                        'notetext':name.data.notetext,
                        'conditionId':name.data.conditionId,
                        'fontSize':name.data.fontSize,
                        'textAlign':name.data.textAlign,
                        'background':name.data.background,
                        'color':name.data.color
                    };
                };
            }
        };
        
    });

    var watchtext = $scope.$watch('note.notetext', function (newValue, oldValue, scope) {
        if ($scope.note) {
            $rootScope.$broadcast('NOTE-' + $scope.note.conditionId, $scope.note)
        }
    });

    var watchalign = $scope.$watch('note.textAlign', function (newValue, oldValue, scope) {
        if ($scope.note) {
            $rootScope.$broadcast('NOTE-' + $scope.note.conditionId, $scope.note)
        }
    });

    var watchsize = $scope.$watch('note.fontSize', function (newValue, oldValue, scope) {
        if ($scope.note) {
            $rootScope.$broadcast('NOTE-' + $scope.note.conditionId, $scope.note)
        }
    });

    var watchbgcolor = $scope.$watch('note.background', function (newValue, oldValue, scope) {
        if ($scope.note) {
            $rootScope.$broadcast('NOTE-' + $scope.note.conditionId, $scope.note)
        }
    });

    var watchfontcolor = $scope.$watch('note.color', function (newValue, oldValue, scope) {
        if ($scope.note) {
            $rootScope.$broadcast('NOTE-' + $scope.note.conditionId, $scope.note)
        }
    });

    // var watchtext = $scope.$watch('note.notetext', function (newValue, oldValue, scope) {
    //     if ($scope.note) {
    //         $rootScope.$broadcast('NOTE-' + $scope.note.conditionId, $scope.note)
    //     }
    // });
    
 
    var watchdatavalue = $scope.$watch('datavalue',function(newValue,oldValue,scope){
        $rootScope.$broadcast('NUM_MODE_EV', $scope.datavalue)
    })

    var watchsyncdataalign = $scope.$watch('syncdata.textAlign', function (newValue, oldValue, scope) {
        if ($scope.syncdata) {
            $rootScope.$broadcast('SYNCDATA-' + $scope.syncdata.moduleId, $scope.syncdata)
        }
    });

    var watchsyncdatasize = $scope.$watch('syncdata.fontSize', function (newValue, oldValue, scope) {
        if ($scope.syncdata) {
            $rootScope.$broadcast('SYNCDATA-' + $scope.syncdata.moduleId, $scope.syncdata)
        }
    });

    var watchsyncdatabgcolor = $scope.$watch('syncdata.background', function (newValue, oldValue, scope) {
        if ($scope.syncdata) {
            $rootScope.$broadcast('SYNCDATA-' + $scope.syncdata.moduleId, $scope.syncdata)
        }
    });

    var watchsyncdatafontcolor = $scope.$watch('syncdata.color', function (newValue, oldValue, scope) {
        if ($scope.syncdata) {
            $rootScope.$broadcast('SYNCDATA-' + $scope.syncdata.moduleId, $scope.syncdata)
        }
    });

    var onhaspageid = $rootScope.$on("haspageid", function (ev) {
        $scope.savepagename = true;
        $(".drag-content").width(window.screen.width * 0.95);
        $(".conbody").height($(window).height() - 225);
        var gridwidth = tools.gridwidth;
        $(".drag-content").width(tools.dragcontentwidth());
    });
    //监听拖拽释放位置，设置xyhls等值
    var onydimemsions = $rootScope.$on("y-dimemsions", function (e, name) {
        /*$scope.setxy($scope.ycolumns,name,'Y_CHANGE_EV');*/
        if ($scope.choosecharttype == 'StandardPieChart' || $scope.choosecharttype == 'crosstab' || $scope.choosecharttype == 'SpeedometerInstrumentChart') {



            //扇形图,交叉表,y轴只能有一个值
            $timeout(function () {
                $scope.ycolumns = [name];
                $rootScope.$broadcast('MEASURE_CHANGE_EV', $scope.ycolumns);
            }, 0)
        } else {

            setxy($scope.ycolumns, name, 'MEASURE_CHANGE_EV');


        }
    });

    var onxdimemsions = $rootScope.$on("x-dimemsions", function (e, name) {
        if(name.dragindex){
            if(name.dropindex){
                $scope.xcolumns.splice(parseInt(name.dropindex)+1, 0, name);
                if(name.dropindex > name.dragindex){
                    $scope.xcolumns.splice(name.dragindex,1);
                } else {
                    $scope.xcolumns.splice(parseInt(name.dragindex)+1,1);
                };
                $rootScope.$broadcast('DIMENSION_CHANGE_EV', $scope.xcolumns);
            } else {
                $scope.xcolumns.splice(parseInt($scope.xcolumns.length)+1, 0, name);
                $scope.xcolumns.splice(name.dragindex,1);
                $timeout(function(){},0)
            }
        } else {
            setxy($scope.xcolumns, name, 'DIMENSION_CHANGE_EV');
        }

        // if(name.dropindex && name.dragindex){
        //     $scope.xcolumns.splice(parseInt(name.dropindex)+1, 0, name);
        //     if(name.dropindex > name.dragindex){
        //         $scope.xcolumns.splice(name.dragindex,1);
        //     } else {
        //         $scope.xcolumns.splice(parseInt(name.dragindex)+1,1);
        //     };
        //     $rootScope.$broadcast('DIMENSION_CHANGE_EV', $scope.xcolumns);
        // } else {
        //     setxy($scope.xcolumns, name, 'DIMENSION_CHANGE_EV');
            
        // };
    });
    var onldimemsions = $rootScope.$on("l-dimemsions", function (e, name) {
        setxy($scope.lcolumns, name, 'LISTHEADER_CHANGE_EV');
    });

    //监听y轴下拉中的度量选择
    var onYMETRICEV = $rootScope.$on("Y_METRIC_EV", function (e, name) {
        for (var i = 0; i < $scope.ycolumns.length; i++) {
            if (name.columnid == $scope.ycolumns[i].columnid) {
                $scope.ycolumns[i].xymetric = name.xymetric;
                $scope.ycolumns[i].xymetricname = name.xymetricname;
            }
        }
        ;
        $rootScope.$broadcast('MEASURE_CHANGE_EV', $scope.ycolumns)
    });

    $scope.dragcolorcons = [];
    //监听拖拽颜色字段
    var onCATCHANGEEV = $rootScope.$on('cat-dimemsions', function (e, name) {
        $timeout(function () {
            $scope.dragcolorcons = [name];
            $rootScope.$broadcast('CATEGORY_CHANGE_EV', $scope.dragcolorcons);
        }, 0)
    });

    var oncondimemsions = $rootScope.$on('con-dimemsions', function (e, name) {
        $timeout(function () {
            $scope.xcolumns = [name];
            $rootScope.$broadcast('CONDITION_CHANGE_EV', $scope.xcolumns);
        }, 0)
    });

    // 离开页面前对页面进行保存
    // window.onbeforeunload = function(event) { 
    //     if($routeParams.pageid){
    //         $scope.saveform();
    //     }
    // }

    $scope.$on("$destroy", function () {
        onchartlist();
        onassemblylist();
        onpagelist();
        ontheme();
        onhaspageid();
        onxdimemsions();
        onydimemsions();
        onldimemsions();
        onYMETRICEV();
        onCATCHANGEEV();
        onDIMENSIONRECOVERYEV();
        oncondimemsions();
        onitemremoveev();

    })
}]);

/*拖拽目标*/
//var DIRECTIVES = angular.module("DIRECTIVES", ["SERVICES"]);
DIRECTIVES.directive('draggable', ["tools","$rootScope", function (tools,$rootScope) {
    return {
        restrict: 'AE',
        scope: false,
        link: function (scope, element, attr) {
            var el = element[0];
            el.draggable = true;
            
            el.addEventListener('dragstart', function (e) {

                e.dataTransfer.effectAllowed = 'move';
                if (attr.dragimg) {
                    //拖拽图表
                    e.dataTransfer.setData('Img', $(this).attr("data-img"));
                    e.dataTransfer.setData('charttype', $(this).attr("data-type"));

                } else if (attr.dragassembly) {
                    //拖拽组件
                    e.dataTransfer.setData('assembly', $(this).attr('data-assembly'));
                } else if (attr.dragassemblytext) {
                    //拖拽组件字段
                    var a = {
                        "columntxt": $(this).attr("data-txt"),
                        "tabletype": $(this).attr('tabletype'),
                        "tabid": $(this).attr('tabid'),
                        'columnid': $(this).attr('columnid')
                    };
                    e.dataTransfer.setData('assemblydrag', JSON.stringify(a));
                } else if (attr.dragxtext) {
                    //x轴
                    var dragxjson = {
                        "columntxt": $(this).attr("data-txt"),
                        "tabletype": $(this).attr('tabletype'),
                        "tabid": $(this).attr('tabid'),
                        'columnid': $(this).attr('columnid'),
                        "xymetric": 'group',
                        "dragindex":$(this).attr('dindex'),
                        "dropindex":''
                    
                    };
                    
                    //console.log(e.target)
                    e.dataTransfer.setData('dragxtext', JSON.stringify(dragxjson));

                } else if (attr.dragytext) {
                    //y轴
                    var dragyjson = {
                        "columntxt": $(this).attr("data-txt"),
                        "tabletype": $(this).attr('tabletype'),
                        "tabid": $(this).attr('tabid'),
                        'columnid': $(this).attr('columnid'),
                        "xymetric": 'sum',
                        "xymetricname": '总和'

                    };
                    e.dataTransfer.setData('dragytext', JSON.stringify(dragyjson));
                }
                return true;
            });

            el.addEventListener('dragend', function (e) {
                    return false;
                },
                false
            );
            //new
        }

    }
}]);

/*拖拽释放*/
DIRECTIVES.directive('droppable', ["tools", "$rootScope", "$compile", function (tools, $rootScope, $compile) {
    return {
        restrict: 'AE',
        scope: false,
        link: function (scope, element, attr) {
        	var el = element[0];
            el.addEventListener('dragover', function (e) {
                e.dataTransfer.dropEffect = 'move';
                e.preventDefault();
            })

            el.addEventListener('drop', function (e) {
                    e.preventDefault();
                    if (attr.dropimg) {
                        if (e.dataTransfer.getData('assembly')) {
                            //组件拖拽
                            var data = e.dataTransfer.getData('assembly');
                            var x = event.pageX - 225 - 100 + $(".conbody").scrollLeft();
                            var y = event.pageY - 53 - $(".drag-charts").height() - 50 + $(".conbody").scrollTop();

                            if (x < 0) {
                                x = 0;
                            }
                            ;
                            if (y < 0) {
                                y = 0;
                            }
                            ;
                            if (data) {
                                $rootScope.$broadcast('assemblylist', {
                                    "chartType": data,
                                    "left": Math.floor(x / tools.gridwidth()),
                                    "top": Math.floor(y / tools.gridwidth()),
                                    "width": Math.floor(300 / tools.gridwidth()),
                                    "height": Math.floor(150 / tools.gridwidth()),
                                    'conditionId': 0,
                                    'identifier': tools.identifier(),
                                    // 'text' : tools.makeConditionId()
                                });
                            }
                        } else {
                            //图表拖拽
                            var data = e.dataTransfer.getData('Img');
                            var charttype = e.dataTransfer.getData('charttype')
                            var x = event.pageX - 225 - 100 + $(".conbody").scrollLeft();
                            var y = event.pageY - 53 - $(".drag-charts").height() - 50 + $(".conbody").scrollTop();
                            if (x < 0) {
                                x = 0;
                            }
                            if (y < 0) {
                                y = 0;
                            }
                            if (data) {
                                $rootScope.$broadcast('chartlist', {
                                    "chartType": charttype,
                                    "left": Math.floor(x / tools.gridwidth()),
                                    "top": Math.floor(y / tools.gridwidth()),
                                    "width": Math.floor(300 / tools.gridwidth()),
                                    "height": Math.floor(150 / tools.gridwidth()),
                                    "identifier": tools.identifier(),
                                    "moduleId": 0,
                                });

                            }
                        }


                    } else if (attr.droptext) {
                        if (e.dataTransfer.getData('dragxtext')) {
                            /*x轴释放*/
                            var data = JSON.parse(e.dataTransfer.getData('dragxtext'));
                            if (data && data != 'undefined') {
                                if ($(this).parent('#chartx').length > 0) {
                                    if($('.standardscatterchart').length>0){
                                        data.xymetric = '';
                                    } else {
                                        data.xymetric = 'group';
                                    };

                                    if($(e.target).attr('dindex')){
                                        data.dropindex = $(this).attr('dindex');
                                    } else if($(e.target).parent('.inptext').attr('dindex')){
                                        data.dropindex = $(e.target).parent('.inptext').attr('dindex');
                                    }
                                    //x轴
                                    $rootScope.$broadcast('x-dimemsions', data);
                                } else if ($(this).parent("#dragcolorx").length > 0) {
                                    //颜色
                                    $rootScope.$broadcast('cat-dimemsions', data);
                                } else if ($(this).parent('.detailtab').length > 0) {
                                    //明细表
                                    $rootScope.$broadcast('x-dimemsions', data);
                                } else if ($(this).parent('#tablel').length > 0) {
                                    //列表头
                                    $rootScope.$broadcast('l-dimemsions', data);
                                }
                            }

                        } else if (e.dataTransfer.getData('dragytext')) {
                            /*y轴释放*/
                            var data = JSON.parse(e.dataTransfer.getData('dragytext'));
                            if (data && data != 'undefined') {
                                if ($(this).parent('#charty').length > 0) {
                                	//散点图没有汇总
                    				if($(this).parent('.hidemetric').length > 0){
                    					data.xymetric = '';
                    					data.xymetricname = ''
                    				} else {
                    					data.xymetric = 'sum';
                    					data.xymetricname = '总和'
                    				};
                                    $rootScope.$broadcast('y-dimemsions', data);
                                } else if ($(this).parent('#chartx').length > 0) {
                                    if($(".detailtab").length > 0){
                                        //明细表
                                        $rootScope.$broadcast('x-dimemsions', data);
                                    }
                                    
                                }
                            };
                        } else if (e.dataTransfer.getData('assemblydrag')) {
                            //组件字段
                            var data = JSON.parse(e.dataTransfer.getData('assemblydrag'))
                            if (data && data != 'undefined') {
                                console.log(data)
                                if ($('.condition').length > 0) {
                                    $rootScope.$broadcast('con-dimemsions', data);
                                }

                            }
                        }

                    }

                    return false;
                },
                false
            );
        }
    }
}]);

/*全选*/
DIRECTIVES.directive('datekeys', ["tools", function (tools) {
    return {
        restrict: 'AE',
        scope: false,
        link: function (scope, element) {
            window.addEventListener("keydown", function (e) {
                //全选效果
                if (e.ctrlKey) {
                    if (e.keyCode == 65) {
                        e.preventDefault();
                        selectText(element[0])
                    }
                }

                if (e.keyCode == 46) {
                    if (window.getSelection) {
                        selectText()
                    }
                }
            })

            function selectText(containder) {
                if (document.selection) {
                    if (containder) {
                        var range = document.body.createTextRange();
                        range.moveToElementText(containder);
                        range.select();
                    }

                } else if (window.getSelection) {
                    var range = document.createRange();
                    if (containder) {
                        range.selectNode(containder);
                        window.getSelection().addRange(range);
                    }
                }

            }
        }
    }

}]);
// 禁止全选
DIRECTIVES.directive('selectfalse', ["tools", function (tools) {
    return {
        restrict: 'AE',
        scope: false,
        link: function (scope, element) {
            if(document.all){
                document.onselectstart= function(){return false;}; //for ie
            }
            document.onselectstart = new Function('event.returnValue=false;');
                        

            
        }
    }

}]);
/*画辅助线*/
DIRECTIVES.directive('drawline', ["tools", "$rootScope", "$timeout", "$interval", function (tools, $rootScope, $timeout, $interval) {
    return {
        restrict: 'AE',
        scope: false,
        link: function (scope, element, attr) {
            var count = 80;
            var ewidth = 0;
            var drawline = function (ewidth, eheight) {
                $(".line-w,.line-h").remove();
                var top = 0;
                var left = 0;
                var w = tools.gridwidth();
                for (var i = 0; i < count; i++) {
                    left += w;
                    $(element).append('<div class="line-h" style="left:' + left + 'px;"></div>');
                }
                while (top < (eheight - w)) {
                    top += w;
                    $(element).append('<div class="line-w" style="top:' + top + 'px;"></div>');
                }
            };
            $rootScope.$on("AUXILIARY_LINE_EV", function () {
                drawline(tools.dragcontentwidth(), $('.drag-content').height());
            });

            $rootScope.$on("POS_AREA_ALIAN_EV", function (e, $elem) {
                ewidth = $(element).width();
                drawline(ewidth, $(element).height())
                var w = tools.gridwidth();
                var droptop = (Math.round(parseFloat($elem.css("top")) / w)) * w;
                var dropleft = (Math.round(parseFloat($elem.css("left")) / w)) * w;
                var elemwidth = Math.round(parseFloat($elem.css("width")) / w) * w;
                var elemheight = Math.round(parseFloat($elem.css("height")) / w) * w;
                $elem.css({"top": droptop, "left": dropleft, "width": elemwidth, "height": elemheight})
            })
        }


    }
}]);
/*图表风格选择*/
DIRECTIVES.directive('themelist', ["$rootScope", "tools", "$timeout", function ($rootScope, tools, $timeout) {
    return {
        restrict: 'AE',
        scope: false,
        replace: true,
        link: function (scope, element, attr) {
            scope.themelist = [
                {'themetext': '默认', 'themename': 'default'},
                {'themetext': '网格 (grid)', 'themename': 'grid'},
                {'themetext': 'grid-light', 'themename': 'gridlight'},
                {'themetext': '天空 (skies)', 'themename': 'skies'},
                {'themetext': '灰色 (gray)', 'themename': 'gray'},
                {'themetext': '深蓝 (dark-blue)', 'themename': 'darkblue'},
                {'themetext': '深绿 (dark-green)', 'themename': 'darkgreen'},
                {'themetext': 'dark-unica', 'themename': 'darkunica'},
                {'themetext': 'sand-signika', 'themename': 'sandsignika'},
            ];
            scope.choosethemename = '默认';
            var HCDefaults = $.extend(true, {}, Highcharts.getOptions(), {});
            //清除之前选择风格
            function restoptions() {
                var defaultOptions = Highcharts.getOptions();
                for (var prop in defaultOptions) {
                    if (typeof defaultOptions[prop] !== 'function')
                        delete defaultOptions[prop];
                }
                ;
                Highcharts.setOptions(HCDefaults);
            }

            //选择表格风格
            scope.choosetheme = function (themename, themetext) {

                if (themename == 'sandsignika') {
                    Highcharts.wrap(Highcharts.Chart.prototype, 'getContainer', function (proceed) {
                        proceed.call(this);
                        this.container.style.background = 'url(http://www.highcharts.com/samples/graphics/sand.png)';
                    });
                };

                if (themename == 'default') {
                    scope.choosethemename = themetext;
                    restoptions();
                    Highcharts.setOptions(HCDefaults);
                } else {
                    scope.choosethemename = themetext;
                    restoptions();
                    Highcharts.setOptions(THEME[themename]);
                }
                $rootScope.$broadcast('theme', themename);
            }
            $rootScope.$on('pagelist', function (e, pagelist) {
                restoptions();
                angular.forEach(scope.themelist, function (item) {
                    if (item.themename == pagelist.chartStyle) {
                        scope.choosetheme(item.themename, item.themetext)

                    }
                });
            });
        },
        templateUrl: "/trend-BI/html/widgets/themelist.html"
    }
}]);
/*页面选择*/
DIRECTIVES.directive('pagelist', ["$rootScope", "tools", "$routeParams", "$location", "$timeout", function ($rootScope, tools, $routeParams, $location, $timeout) {
    return {
        restrict: 'AE',
        scope: false,
        replace: true,
        link: function (scope, element, attr) {
            var backediotrlist = {};
            scope.pagelist = [];
            scope.choosepagename = '页面选择';
            // 获取所有页面属性
            tools.get({
                url: '/Intelligence-Business-Management/getPages.htm',
                succ: function (data) {
                    if (data.success) {
                        for (var i = 0; i < data.value.length; i++) {
                            scope.pagelist.push({
                                "pagename": data.value[i].pageName,
                                "pageid": data.value[i].pageId,
                                "chartStyle": data.value[i].chartStyle,
                                "tbId": data.value[i].tbId,
                                "tableType": data.value[i].tableType
                            });
                        }
                        ;
                    } else {
                        if (data.message != 'session expired') {
                            alert(data.message)
                        }
                    }
                }
            });

            // 点击选择页面
            scope.choosepage = function (pageid) {

                $location.search({"pageid": pageid});
                tools.get({
                    url: '/Intelligence-Business-Management/getPageByPageId.htm',
                    data: {
                        'pageId': pageid
                    },
                    succ: function (data) {
                        if (data.success) {
                            scope.choosepagename = data.value.pageName;
                            $rootScope.$broadcast('pagelist', {
                                'pageId': data.value.pageId,
                                'pageName': data.value.pageName,
                                'pageJson': data.value.pageObject.jsonObject,
                                'chartStyle': data.value.chartStyle,
                                'tbId': data.value.tbId,
                                'tableType': data.value.tableType
                            });
                        } else {
                            if (data.message != 'session expired') {
                                alert(data.message)
                            }
                        }
                    }
                });
            };
            if ($routeParams.pageid) {
                $rootScope.$broadcast('haspageid');
                scope.choosepage($routeParams.pageid);
            }


        },
        templateUrl: "/trend-BI/html/widgets/pagelist.html"
    }
}]);

/*confirm*/
DIRECTIVES.directive("confirm", ["$rootScope", "tools", function ($rootScope, tools) {
    return {
        restrict: 'AE',
        scope: false,
        link: function (scope, element, attrs) {
            /* scope.shown = false;*/
            scope.title = '';
            scope.content = '';
            $rootScope.$on("confirm", function (e, confirmcontent) {
                scope.title = confirmcontent.title;
                scope.content = confirmcontent.content;
                scope.btns = confirmcontent.btns;
                scope.shown = true;
            });

            scope.colse = function () {
                scope.shown = false;
            }

        },
        templateUrl: '/trend-BI/html/widgets/confirm.html'
    }
}]);

/*多级下拉*/
DIRECTIVES.directive("multileveldrop", ["$rootScope", "tools", function ($rootScope, tools) {
    return {
        restrict: 'AE',
        scope: false,
        replace: true,
        link: function (scope, element, attrs) {
            scope.showmetric = false;
            if (($(element).parents('#charty').length > 0 && $(element).parents('.hidemetric').length <= 0) || $(element).parents('#tables').length > 0) {
                scope.showmetric = true;
            } else {
                scope.showmetric = false;
            };

            if (tools.data.getItem('aaa')) {
                return;
            } else {
                $('body').delegate('.xydorpdown-toggle', 'click', function (e) {
                    e.stopPropagation();
                    $(this).find(".xy-downul li").removeClass('active');
                    $(this).find(".xy-downul li ul").hide();
                    $(this).find(".xy-downul").toggle();
                });
                $('body').delegate('.xy-downul li', 'click', function (e) {
                    e.stopPropagation();
                    $(this).parent().find('ul').hide();
                    $(this).parent().find('ul li').removeClass("active");
                    $(this).addClass('active').siblings().removeClass("active");

                    if ($(this).find("ul").length > 0) {
                        $(this).find("ul").toggle();
                    } else {
                        if ($(this).attr('data-name')) {
                            $rootScope.$emit('Y_METRIC_EV', {
                                'columnid': $(this).parents('.inptext').attr('columnid'),
                                'xymetric': $(this).attr('data-name'),
                                'xymetricname': $(this).attr('data-txt')
                            });
                            $(this).parents('.inptext').find('.xymetricname').text($(this).attr('data-txt'));
                        }
                        $(this).parents(".xy-downul").hide();
                    }
                });

                $('body').click(function () {
                    $(".xy-downul").hide();
                });
                tools.data.setItem('aaa', true);

            }
        },
        templateUrl: '/trend-BI/html/widgets/multi-level-drop.html'
    }
}]);

/*字段设置*/
DIRECTIVES.directive("setcolumn", ["$rootScope", "tools", "$routeParams", function ($rootScope, tools, $routeParams) {
    return {
        restrict: 'AE',
        scope: false,
        replace: true,
        link: function (scope, element, attrs) {
            // 选择要翻译字段
            scope.columnclick = function (columnDesc, fieldName, fieldType, tbId, tableType) {
                scope.chooosecolumnname = columnDesc;
                scope.choosecollist = [];
                var pageid = $routeParams.pageid;
                var fieldname = fieldName;

                tools.get({
                    url: '/Intelligence-Business-Management/getPageSwitchMeanings.htm',
                    data: {
                        'pageId': pageid,
                        'fieldName': fieldName,
                        'tbId': tbId,
                        'tableType': tableType,
                        'fieldType': fieldType
                    },
                    succ: function (data) {
                        if (data.success) {
                            for (var i in data.value) {

                                scope.choosecollist.push({'formerly': i, 'alias': data.value[i]})
                            }

                        } else {
                            if (data.message != 'session expired') {
                                alert(data.message)
                            }
                        }
                    }
                });
                // 添加别名
                scope.addPageSwitchMeaning = function () {
                    //console.log(scope.choosecollist)
                    var str = '';
                    var switchmeanings = scope.choosecollist;
                    for (var i = 0; i < switchmeanings.length; i++) {
                        if (switchmeanings[i].alias && switchmeanings[i].alias != 'null') {
                            //switchmeanings = scope.choosecollist[i];
                            for (var j = i + 1; j < scope.choosecollist.length; j++) {
                                if (scope.choosecollist[i].alias == switchmeanings[j].alias) {
                                    scope.choosecollist[j].alias = '';
                                    alert('别名必须是唯一的');
                                    return false;
                                }
                            }

                        }
                        ;

                    }
                    ;
                    for (var k = 0; k < scope.choosecollist.length; k++) {
                        if (scope.choosecollist[k].alias && scope.choosecollist[k].alias != 'null')
                            str += scope.choosecollist[k].formerly + '=' + scope.choosecollist[k].alias + ';'
                    }

                    tools.get({
                        url: '/Intelligence-Business-Management/addPageSwitchMeaning.htm',
                        data: {
                            'pageId': pageid,
                            'fieldName': fieldname,
                            'switchMeanings': str
                        },
                        succ: function (data) {
                            if (data.success) {
                                alert('修改成功')
                            } else {
                                if (data.message != 'session expired') {
                                    alert(data.message)
                                }
                            }

                        }
                    });
                };
                // 取消
                scope.choosecancel = function () {
                    scope.chooosecolumnname = '';
                    scope.choosecollist = [];
                }
            }
        },
        templateUrl: '/trend-BI/html/widgets/setcolumn.html'
    }
}]);

/*页面样式设置*/
DIRECTIVES.directive("setpagestyle", ["$rootScope", "tools", "$routeParams", function ($rootScope, tools, $routeParams) {
    return {
        restrict: 'AE',
        scope: false,
        replace: true,
        link: function (scope, element, attrs) {
            scope.setpagestyleclick = function(){
                scope.showpagestyle = true;

            };
            scope.pagecolorcancel = function(){

                $('#pagebgcolor').val('#ffffff');
                $('#pagefontcolor').val('#333333');
                scope.showpagestyle = false;
            };
            scope.pagecoloradd = function(){
                $('.conbody').css({'background':$('#pagebgcolor').val(),'color':$('#pagefontcolor').val()});
                $('.bgset').css({'background':$('#pagebgcolor').val()});
                $rootScope.$broadcast('FONT_COLOR_EV',$('#pagefontcolor').val())
                scope.showpagestyle = false;
                
            };

        },
        templateUrl: '/trend-BI/html/widgets/setpagestyle.html'
    }
}]);

/*share*/
DIRECTIVES.directive("share", ["$rootScope", "tools", function ($rootScope, tools) {
    return {
        restrict: 'AE',
        scope: false,
        link: function (scope, element, attrs) {
            
            $rootScope.$on("share", function (e, sharecontent) {
            	scope.shareshow = true;
                scope.grouplist = [];//组及其成员
                scope.userlist = [];//未分组成员
                //获取所有角色
                tools.get({
                    url: '/Intelligence-Business-Management/getShareInfos.htm',
                    data:{
                        'pageId':sharecontent.pageId,
                        'tbId':sharecontent.tbId,
                        'tableType':sharecontent.tableType
                    },
                    succ: function (data) {
                        if (data.success) {
                            scope.grouplist = data.value.roles;
                            scope.userlist = data.value.users;
                        } else {
                            if (data.message != 'session expired') {
                                alert(data.message)
                            }
                        }

                    }
                });

                // 选择组
                scope.selectGroupOrNot = function(isSelectGroup,roleId){
                    for(var i in scope.grouplist[roleId].subUsers){
                        scope.grouplist[roleId].subUsers[i].shared = isSelectGroup;
                    };
                };
                scope.selectPersonOrNot = function(isSelectPreson,roleId){
                    for(var i in scope.grouplist[roleId].subUsers){
                        if(scope.grouplist[roleId].subUsers[i].shared == false){
                            scope.grouplist[roleId].shared = false;
                            break;
                        }
                    }

                };

                scope.shareadd = function(){
                   var sharegrouplist = [];
                   var shareuserlist = [];
                    for(var i in scope.grouplist){
                        if(scope.grouplist[i].shared){
                            sharegrouplist.push(scope.grouplist[i].roleId)
                        } else {
                            for(var j in scope.grouplist[i].subUsers){
                                if(scope.grouplist[i].subUsers[j].shared){
                                    shareuserlist.push(scope.grouplist[i].subUsers[j].userId)
                                }
                            }
                        }
                    };
                    //未分组成员
                    for(var k in scope.userlist){
                        if(scope.userlist[k].shared){
                            shareuserlist.push(scope.userlist[k].userId)
                        }
                    };
                    
                    tools.get({
                        url: '/Intelligence-Business-Management/sharePage.htm',
                        data:{
                            'pageId':sharecontent.pageId,
                            'roleIds':sharegrouplist.join(','),
                            'userIds':shareuserlist.join(',')
                        },
                        succ: function (data) {
                            if (data.success) {
                                //scope.grouplist = data.value;
                                scope.shareshow = false;
                            } else {
                                if (data.message != 'session expired') {
                                    alert(data.message)
                                }
                            }

                        }
                    });
                };
            });

        },
        templateUrl: '/trend-BI/html/widgets/share.html'
    }
}]);
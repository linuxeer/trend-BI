DIRECTIVES.directive('myDialog', ["$rootScope", "tools","$timeout", function ($rootScope, tools,$timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,

        link: function (scope, element, attr) {
            scope.title='';
            scope.content = '';
            scope.btns=null;
            $rootScope.$on("dialog",function(event,data){
                //element.addClass("css3Animate");
                scope.title=data.title;
                scope.content=data.content;
                scope.btns=data.btns;
                scope.isShow=true;//显示modal-dialog
                //是否要按钮
                if(scope.btns==null){ //没有btns 按钮
                    scope.btnHas=false;
                    $timeout(function(){scope.isShow=false;},2000);
                }else{ //有btns 按钮
                    scope.btnHas=true;
                }

            });


            //close-event
            $rootScope.$on("close-event",function(){
                //alert(0);
                scope.isShow=false;

            });
            //save-event
            $rootScope.$on("save-event",function(){
                /*保存*/

            });
            //关闭close函数
            scope.close=function(){
                scope.isShow=false;
            };


        },
        templateUrl: "/trend-BI/html/widgets/dialog.html"
    }
}]);
DIRECTIVES.directive('account', ["$rootScope", "tools","$timeout", function ($rootScope, tools,$timeout) {
    return {
        restrict: 'AE',
        scope: {},
        replace: true,
        link: function (scope, element, attr) {
        	scope.userType= tools.storage.getItem('userType');
            if(scope.userType!="administrator"){
                return;
            }
            tools.get({
                url: '/Intelligence-Business-Management/getSubUserList.htm',
                succ: function (data) {
                    if (data.success) {
                        scope.data=data.value;
                        scope.ALlROLELIST=[];
                        angular.forEach(scope.data,function(item){
                            scope.ALlROLELIST.push({roleId:item.roleId,roleName:item.roleName});
                        });

                    } else {
                        if(data.message != 'session expired'){
                            alert(data.message)
                        }
                    }
                }
            });


            scope.contactName='';

            scope.index=null;
            scope.name='';
            scope.table='';//选择表的表名

            scope.title='';
            scope.pagename='';
            scope.pagetype='';
            scope.managetype=false;
            $rootScope.$on("account",function(event,data){

                scope.index=data[0];
                scope.title=data[1];
                scope.pagename=data[2];
                scope.pagetype=data[3];
                scope.managetype=data[4];
//              所有表tablelist
                scope.tablelist=angular.copy(scope.$parent.tablelist);
//              所有角色列表

                console.log(scope.roleListView);
                scope.userId=data[5];
                /*
                * 筛选未有的表
                * */
                if(scope.title=="添加子账号私有表"){
//                    console.log("添加子账号私有表");
//                    console.log(scope.index)
//                    console.log(scope.$parent.EditshowRoleTbList);
                    if(scope.$parent.EditshowRoleTbList) {
                        if (scope.$parent.EditshowRoleTbList.length > 0) {
                            for (var i in scope.$parent.EditshowRoleTbList) {
                                for (var j in scope.tablelist) {
                                    if (scope.$parent.EditshowRoleTbList[i].tbId == scope.tablelist[j].tabid) {
                                        scope.tablelist.splice(j, 1);
                                        //alert("J:"+j);
//                                        console.log(scope.tablelist);
                                    }
                                }
                            }
                            if (scope.tablelist.length == 0) {
                                alert("已经全部添加");
                                return;
                            }
                        }
                    }

                }
                if(scope.title=="添加表"){
//                    console.log(scope.index)
//                    console.log(scope.$parent.showRoleTbList);
                    if(scope.$parent.showRoleTbList.length>0) {
                        for (var i in scope.$parent.showRoleTbList) {
                            for (var j in scope.tablelist) {
                                if (scope.$parent.showRoleTbList[i].tbId == scope.tablelist[j].tabid) {
                                    scope.tablelist.splice(j, 1);
                                    //alert("J:"+j);
//                                    console.log(scope.tablelist);
                                }
                            }
                        }
                    }
                    if(scope.tablelist.length==0){
                        alert("已经全部添加");
                        return;
                    }
                }
                scope.role=false;

                /*if(scope.title=="添加部门角色"){
                    scope.roleListView=angular.copy(scope.ALlROLELIST);
                    scope.role=true;
                    for(var i in scope.roleListView){
                        for(var j in  scope.$parent.roleNameList){
                            if(scope.roleListView[i].roleId==scope.$parent.roleNameList[j].roleId){
                                scope.roleListView.splice(i,1);
                            }
                        }
                    }
                }*/
                if(scope.title=="添加角色"){
                    scope.roleListView=angular.copy(scope.ALlROLELIST);
                    scope.role=true;
                    for(var i in scope.roleListView){
                        for(var j in  scope.$parent.EditroleNameList){
                            if(scope.roleListView[i].roleId==scope.$parent.EditroleNameList[j].roleId){
                                scope.roleListView.splice(i,1);
                            }
                        }
                    }
                }

                scope.isShow=true;
            });



            var tableNames=[];
            var table=[];

            //子账号-roleId角色的添加点击--un
            scope.checkRole=function(event){
                if(event.target.checked){
                    table.push(event.target.id);  //页面数据-rolename
                    tableNames.push({roleId:event.target.id,roleName:event.target.value});
                }else{
                    for(var i in table){
                        if(table[i]==event.target.id){
                            table.splice(i,1);
                            tableNames.splice(i,1);
                        }
                    }
                    //table.push(event.target.value);
                }
//                console.log(tableNames);
            }


            /*
            * 角色/子账号----表的添加点击
            * */
            scope.isChecked=function(event){
                if(event.target.checked){
                    tableNames.push(event.target.value);  //表的数据
                    angular.forEach(scope.tablelist,function(item){
                        if(item.tabid==event.target.id){
                            table.push({tbId:item.tabid,tableType:item.tabletype,tableDesc:item.tableDesc});//提交数据
                        }
                    });

                }else{
                    //alert(event.target.id);
                    for(var i in table){
                        if(table[i].tbId==event.target.id){
                            table.splice(i,1);
                            tableNames.splice(i,1);
                        }
                    }
                    //table.push(event.target.value);
                }
                scope.tableName=tableNames.join(',');
//                console.log(tableNames.join(','));
            };

            /*清空值*/
            function clearAll(){

                table=[];
                tableNames=[];
                scope.name='';
                scope.contactName='';
                //scope.table='';
                scope.tableName='';
                $(".tableSelect input").removeAttr("checked");
                scope.isShow=false;
            }

            //关闭close函数
            scope.close=clearAll;
/*
* 保存
* */
            scope.savepage=function(){
                /*
                * 添加角色
                *
                * */
                if(scope.title=="添加角色"){
                    if(table.length==0){
                        alert("没有选择角色");
                        return;
                    }
                    $rootScope.$broadcast('ADD-ROLE',tableNames);

//
//

                    clearAll();
//                    return;
                }

                /*
                * role-角色管理：添加表
                * 已完成
                * */
                else if(scope.title=="添加表") {
                    if(table.length==0){
                        return;
                    }

                    angular.forEach(table,function(item){
                        if(scope.$parent.roleData[scope.index].tbInfos==''){
                            scope.$parent.roleData[scope.index].tbInfos="{tbId="+item.tbId+";tableType="+item.tableType+"}";
                        }else{
                            scope.$parent.roleData[scope.index].tbInfos+=",{tbId="+item.tbId+";tableType="+item.tableType+"}";
                        }
                    });
//                    console.log(scope.$parent.roleData[scope.index].tbInfos);

                    console.log({roleId:scope.$parent.roleData[scope.index].roleId,
                        roleName:scope.$parent.roleData[scope.index].roleName,
                        tbInfos:scope.$parent.roleData[scope.index].tbInfos});
                    /*
                    * 提交
                    * */
                    tools.get({
                        url: '/Intelligence-Business-Management/updateRole.htm',
                        data: {
                            roleId:scope.$parent.roleData[scope.index].roleId,
                            roleName:scope.$parent.roleData[scope.index].roleName,
                            tbInfos:scope.$parent.roleData[scope.index].tbInfos
                        },
                        succ: function (data) {
                            if (data.success) {
                                console.log('添加表成功');

                            } else {
                                if (data.message != 'session expired') {
                                    alert(data.message)
                                }
                            }
                        }
                    });

                    clearAll();
//                    return;

                }

                /*
                * 子账号-getSubUserList：添加子账号私有表
                * 已完成
                * */
                else if(scope.title=="添加子账号私有表"){
                    if(table.length==0){
                        alert("没有选择表");
                        return;
                    }else{
                        $rootScope.$broadcast('ADD-TB',table);
                    }

                    clearAll();
                }

                /*
                * 子账号-getSubUserList：添加子账号
                *
                * */

                else if(scope.title=="添加子账号"){
                    if(scope.name.length==0){
                        alert("请输入子账号名称");
                        return;
                    }
                    if(scope.contactName.length==0){
                        alert("请输入姓名");
                        return;
                    }

                    scope.roleIds=scope.$parent.roleData[scope.index].roleId;

                    console.log( {
                        userName: scope.name,
                        contactName: scope.contactName,
                        roleIds: scope.roleIds
                    });
                    tools.get({
                        url: '/Intelligence-Business-Management/addSubUser.htm',
                        data: {
                            userName: scope.name,
                            contactName: scope.contactName,
                            roleIds: scope.roleIds

                        },
                        succ: function (data) {
                            if (data.success) {
                                console.log('添加子账号成功');
                                $rootScope.$broadcast('add-subUsers',"");
                            } else {
                                if (data.message != 'session expired') {
                                    alert(data.message)
                                }

                            }
                        }
                    });
                    //subUsersName更新
//                    scope.$parent.subUsersName.push(scope.name);
                    clearAll();
//                    return;
                }
                tools.get({
                    url: '/Intelligence-Business-Management/getRoleList.htm',
                    succ: function (data) {
                        if (data.success) {
//                            alert(11);
                            scope.$parent.roleData=data.value;
                            $rootScope.$broadcast('update-role',scope.$parent.roleData);
                        } else {
                            if(data.message != 'session expired'){
                                alert(data.message)
                            }
                        }
                    }
                });

                tools.get({
                    url: '/Intelligence-Business-Management/getSubUserList.htm',
                    succ: function (data) {
                        if (data.success) {
                            scope.$parent.users=data.value;
                            $rootScope.$broadcast('update-users',scope.$parent.users);
//                            scope.$parent.roleNameList=scope.$parent.users[index].subUsers[scope.$parent.delIndex].roleList;
                        } else {
                            if(data.message != 'session expired'){
                                alert(data.message)
                            }
                        }
                    }
                });
            }
        },
        templateUrl: "/trend-BI/html/widgets/account.html"
    }
}]);
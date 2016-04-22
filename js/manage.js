
/**
 * Created by Administrator on 2016/1/15.
 */
MAIN.controller('manageCtrl', ["$scope", "$rootScope", "tools", "$timeout", "$routeParams","$location", function ($scope, $rootScope, tools, $timeout, $routeParams,$location) {
//    $scope.contactName='请输入姓名';
    $scope.usernameAdmin = tools.storage.getItem('userName');
    $scope.userType= tools.storage.getItem('userType');
    if($scope.userType=="administrator"){
        $scope.isAdmin=true;
    }else{
        $scope.isAdmin=false;
        if($routeParams.pwd) {  //密码修改
            $scope.showPage = false;
            $scope.manage = false;
            $scope.pwdshow = true;
            $scope.oldPwd = '';
        $scope.newPwd = '';
        $scope.newPwdConfirm = '';
        $('#oldPwd').focus();
        $scope.reset=function(form){
            $('#oldPwd').focus();
            form.$setPristine();
        };
        $scope.changePwd = function (form) {
            tools.get({
                url: '/Intelligence-Business-Management/updateUserPassword.htm',
                data: {
                    originalPassword: hex_md5($scope.oldPwd),
                    newPassword: hex_md5($scope.newPwd)
                },
                succ: function (data) {
                    if (data.success) {
                        alert("密码修改成功");
                        location.href = 'login.html';
                    } else {
                        if (data.message != 'session expired') {
                            alert(data.message);
                            document.form.reset();
                            form.$setPristine();
                            $('#oldPwd').focus();
                        }

                    }
                }
            });
        };
        }
//        $("account").remove();
//            alert(0);
        return;
    }

    $scope.users=[];
    $scope.showPage=true; //角色管理是否show
    $scope.manage=true;//账号，角色管理切换
    $scope.pageid=0;     //临时页面id
    $scope.id=0; //临时id索引--nav导航--添加对应的数据
    $scope.addRoleName=''; //新增部门角色
    $scope.showRoleTbList=[];
/*
* 角色roleName的修改------start
* */
    $scope.changeTitle2=function(event,keyCode,index){
        if(event.keyCode==13){
            $rootScope.$broadcast("confirm",
                {
                    'title': '修改提醒',
                    'content': '是否修改该角色名称',
                    'btns': [
                        {
                            'text': '是',
                            'style': 'btn-primary',
                            'fn': function () {
                                angular.forEach($scope.roleData,function(item){
                                    if(event.target.innerText==item.roleName&&$scope.roleData[index].roleId==item.roleId){
                                        return;
                                    }
                                    if(event.target.innerText==item.roleName&&$scope.roleData[index].roleId!=item.roleId){
                                        alert("角色名称已经存在");
                                        return;
                                    }
                                });
                                tools.get({
                                    url: '/Intelligence-Business-Management/updateRole.htm',
                                    data: {
                                        roleId : $scope.roleData[index].roleId,		        //角色ID
                                        roleName: event.target.innerText	                //角色名称
                                    },
                                    succ: function (data) {
                                        if (data.success) {
                                            console.log('修改成功');
                                        } else {
                                            if (data.message != 'session expired') {
                                                alert(data.message)
                                            }
                                        }
                                    }
                                });
                                updateRoles();
                            }
                        },
                        {
                            'text': '否',
                            'style': 'btn-primary',
                            'fn': function () {
                                event.target.innerHTML=$scope.roleData[index].roleName;
                            }
                        }
                    ]
                }
            );
        }else{
            return;
        }
    };
    //修改角色roleName---ng-blur
    $scope.changeTitle = function(index,event){
        if(event.target.innerText==''){
            $rootScope.$broadcast('dialog',{title:'角色名称修改',content:'角色名称不能为空'});
            event.target.innerText=$scope.roleData[index].roleName;
            return;
        }
        $rootScope.$broadcast("confirm",
            {
                'title': '修改提醒',
                'content': '是否修改该角色名称',
                'btns': [
                    {
                        'text': '是',
                        'style': 'btn-primary',
                        'fn': function () {
                            angular.forEach($scope.roleData,function(item){
                                if(event.target.innerText==item.roleName&&$scope.roleData[index].roleId==item.roleId){
                                    return;
                                }
                                if(event.target.innerText==item.roleName&&$scope.roleData[index].roleId!=item.roleId){
                                    alert("角色名称已经存在");
                                    return;
                                }
                            });
                            tools.get({
                                url: '/Intelligence-Business-Management/updateRole.htm',
                                data: {
                                    roleId : $scope.roleData[index].roleId,		        //角色ID
                                    roleName: event.target.innerText	                //角色名称
                                },
                                succ: function (data) {
                                    if (data.success) {
                                        console.log('修改成功');
                                    } else {
                                        if (data.message != 'session expired') {
                                            alert(data.message)
                                        }
                                    }
                                }
                            });
                            updateRoles();
                        }
                    },
                    {
                        'text': '否',
                        'style': 'btn-primary',
                        'fn': function () {
                            event.target.innerHTML=$scope.roleData[index].roleName;
                        }
                    }
                ]
            }
        );
    };


//tableList---表 start
    $scope.tablelist=[];
    tools.get({
        url: '/Intelligence-Business-Management/getAllTables.htm',
        succ: function (data) {
            if (data.success == true) {
                for (var i in data.value) {
                    for (var j in data.value[i]) {
                        $scope.tablelist.push({
                            'tabletype': i,
                            'tableDesc': data.value[i][j].tableDesc,
                            'tabid': data.value[i][j].tbId
                            //'classificationColumns': data.value[i][j].classificationColumns
                        });
                    }
                }
//                console.log("$scope.tablelist:");
//                console.log($scope.tablelist);
            } else {
                if(data.message != 'session expired'){
                    alert(data.message)
                }
            }
        }
    });
//-----end

    /*角色
    * roleId	角色ID
    * roleName  角色名称
    * subUserNum   用户数
    * tableNum 数据库表数
    * tbInfos		角色表信息
    * subUserInfos  角色子账号信息
    * */
    $scope.roleData=[];
    //获取role 角色数据---$scope.dataTest
    tools.get({
        url: '/Intelligence-Business-Management/getRoleList.htm',
        succ: function (data) {
            if (data.success) {
                $scope.roleData=data.value;
            } else {
                if(data.message != 'session expired'){
                    alert(data.message)
                }
            }
        }
    });

    function updateUsers(){
        tools.get({
            url: '/Intelligence-Business-Management/getSubUserList.htm',
            succ: function (data) {
                if (data.success) {
                    $scope.users=data.value;
                    selectToUsersData();
                } else {
                    if(data.message != 'session expired'){
                        alert(data.message)
                    }
                }
            }
        });
    }
    function updateRoles(){
        tools.get({
            url: '/Intelligence-Business-Management/getRoleList.htm',
            succ: function (data) {
                if (data.success) {
                    $scope.roleData=data.value;
                    $scope.AllUsersList=[];
                    $scope.showRoleTbList=[];
                    $scope.rolesubUsers=[];
                    angular.forEach($scope.roleData,function(item){
                        angular.forEach(item.subUsers,function(item2){
                            $scope.AllUsersList.push(item2);
                        });
                    });
                    selectToRoleData();

                } else {
                    if(data.message != 'session expired'){
                        alert(data.message)
                    }
                }
            }
        });
    }


//选择子账号对应的数据
    function selectToUsersData(){
        if(!$routeParams.index){
            return;
        }
        $scope.showRoleTbList=[];
        $scope.roleNameList=[];
        $scope.UsersList=[];
//角色里的subusers----人
        if($scope.users[$scope.id].subUsers.length>0){
            $scope.UsersList=$scope.users[$scope.id].subUsers;
            if($scope.delIndex) {
                if($scope.UsersList[$scope.delIndex].tbInfos==null){
                    return;
                }
                if ($scope.UsersList[$scope.delIndex].tbInfos.length > 0) {
                    $scope.roleTbList = $scope.UsersList[$scope.delIndex].tbList;
                    for (var i in $scope.roleTbList) {
                        for (var j in $scope.tablelist) {
                            if ($scope.roleTbList[i].tbId == $scope.tablelist[j].tabid) {
                                $scope.showRoleTbList.push({tableDesc: $scope.tablelist[j].tableDesc, tbId: $scope.tablelist[j].tabid, tableType: $scope.tablelist[j].tableType});
                            }
                        }
                    }
                }
                if ($scope.UsersList[$scope.delIndex].roleList.length > 0) {
                    $scope.roleNameList = $scope.UsersList[$scope.delIndex].roleList;
                }
            }

        }else{
            $scope.indexEditShow=false;
            $scope.UsersList=[];
        }
    }

//选择角色对应的数据
    function selectToRoleData(){
        $scope.showRoleTbList=[];
//角色里的subusers----人
        if($scope.roleData[$scope.id].subUsers.length>0){
            $scope.rolesubUsers=$scope.roleData[$scope.id].subUsers;
        }
//角色里的tblist-----表
        if($scope.roleData[$scope.id].tbList==null){
            return;
        }
        if($scope.roleData[$scope.id].tbList.length>0) {
            $scope.roleTbList = $scope.roleData[$scope.id].tbList;
            for(var i in $scope.roleTbList){
                for(var j in $scope.tablelist){
                    if($scope.roleTbList[i].tbId==$scope.tablelist[j].tabid){
                        $scope.showRoleTbList.push({tableDesc:$scope.tablelist[j].tableDesc,tbId:$scope.tablelist[j].tabid,tableType:$scope.tablelist[j].tableType});
                    }
                }
            }
        }
    }
//    更新
    $rootScope.$on('update-role',function(event,data){
        updateRoles();
    });

    $rootScope.$on('update-users',function(event,data){
        updateUsers();

    });
    $rootScope.$on('add-subUsers',function(event,data){
//        alert("add-subUsers");
        updateUsers();
        $scope.UersShow=true;
    });
    $rootScope.$on("update-usersLi",function(event,data){
        tools.get({
            url: '/Intelligence-Business-Management/getSubUserList.htm',
            succ: function (data) {
                if (data.success) {
                    $scope.users=data.value;
                    $scope.roleNameList=[];

                    $scope.roleTbList=[];
                    $scope.showRoleTbList=[];

                    $scope.UsersList=$scope.users[$scope.id].subUsers;
//                    隐藏

                    $scope.userOne=[];
                    if($scope.UsersList.length==0){
                        $scope.indexEditShow=false;
                        $scope.UersShow=false;
                        return;
                    }
                    if ($scope.UsersList[$scope.delIndex]!=null&&$scope.UsersList[$scope.delIndex].tbInfos!=null){
                        if ($scope.UsersList[$scope.delIndex].tbInfos.length > 0) {
                            $scope.roleTbList = $scope.UsersList[$scope.delIndex].tbList;
                            for (var i in $scope.roleTbList) {
                                for (var j in $scope.tablelist) {
                                    if ($scope.roleTbList[i].tbId == $scope.tablelist[j].tabid) {
                                        $scope.showRoleTbList.push({tableDesc: $scope.tablelist[j].tableDesc, tbId: $scope.tablelist[j].tabid, tableType: $scope.tablelist[j].tableType});
                                    }
                                }
                            }
                        }
                    }else{
                        $scope.showRoleTbList=[];
                    }
                    if ($scope.UsersList[$scope.delIndex]!=null&&$scope.UsersList[$scope.delIndex].roleList.length > 0) {
                        $scope.roleNameList = $scope.UsersList[$scope.delIndex].roleList;
                    }
                    if($scope.UsersList[$scope.delIndex]!=null) {
                        $scope.userOne={
                            userName : $scope.UsersList[$scope.delIndex].userName,
                            department : $scope.UsersList[$scope.delIndex].department,
                            contactSubName : $scope.UsersList[$scope.delIndex].contactName,
                            position : $scope.UsersList[$scope.delIndex].position,
                            editable : $scope.UsersList[$scope.delIndex].editable == true ? "是" : "否"
                        };
                        /*$scope.userName = $scope.UsersList[$scope.delIndex].userName;
                        $scope.department = $scope.UsersList[$scope.delIndex].department;
                        $scope.contactSubName = $scope.UsersList[$scope.delIndex].contactName;
                        $scope.position = $scope.UsersList[$scope.delIndex].position;
                        $scope.editable = $scope.UsersList[$scope.delIndex].editable == true ? "是" : "否";*/
                    }
                } else {
                    if(data.message != 'session expired'){
                        alert(data.message)
                    }
                }
            }
        });

    });
/*
* 页面路由
*
* */
    if($routeParams.index){ //子账号管理
        $scope.ParamsIndex=$routeParams.index;
        //users
        tools.get({
            url: '/Intelligence-Business-Management/getSubUserList.htm',
            succ: function (data) {
                if (data.success) {
                    $scope.users=data.value;

                    if($scope.users[$routeParams.index].subUsers.length==0){
                        $scope.UersShow=false;
                    }
                    selectToUsersData();

                } else {
                    if(data.message != 'session expired'){
                        alert(data.message)
                    }
                }
            }
        });
        $scope.id=$routeParams.index;
        $scope.sublistshow=true;
        $scope.showPage=false;

        $scope.manage=false;    //角色管理隐藏，账号管理显示

    }
    else if($routeParams.page){ //角色管理
        $scope.id=$routeParams.page;
        $scope.curtablename=[];
        //角色里的subusers----人
        $scope.rolesubUsers=[];
        $scope.allRoleList=[];
        $scope.roleTbList=[];
        //角色里的tblist-----表
        $scope.showRoleTbList=[];
        updateRoles();

        $scope.showPage=false;

    }else if($routeParams.pwd){  //密码修改
        $scope.showPage=false;
        $scope.manage=false;
        $scope.pwdshow=true;
        $scope.oldPwd = '';
        $scope.newPwd = '';
        $scope.newPwdConfirm = '';
        $('#oldPwd').focus();
        $scope.reset=function(form){
            $('#oldPwd').focus();
            form.$setPristine();
        };
        $scope.changePwd = function (form) {
            tools.get({
                url: '/Intelligence-Business-Management/updateUserPassword.htm',
                data: {
                    originalPassword: hex_md5($scope.oldPwd),
                    newPassword: hex_md5($scope.newPwd)
                },
                succ: function (data) {
                    if (data.success) {
                        alert("密码修改成功");
                        location.href = 'login.html';
                    } else {
                        if (data.message != 'session expired') {
                            alert(data.message);
                            document.form.reset();
                            form.$setPristine();
                            $('#oldPwd').focus();
                        }

                    }
                }
            });
        };


    }
    else{
        $scope.showPage=true;
    }
    $scope.chosepage=function(pageid){
        $location.search("page="+pageid);
    };
    /*
    *
    * 选择子账号user列表
    * */
    $scope.selectUsers=function(index,event){
        if($scope.editMenu){
            $rootScope.$broadcast("confirm",
                {
                    'title': '修改取消提醒',
                    'content': '是否取消修改',
                    'btns': [
                        {
                            'text': '是',
                            'style': 'btn-primary',
                            'fn': function () {
                                $scope.editMenu=false;
                                $scope.indexEditShow = true;

                                angular.element(event.target).addClass('cur').siblings().removeClass('cur');
                                $scope.delIndex = index;//删除子账号--index-位置

                                $scope.userId = $scope.UsersList[index].userId;
								//绑定数据
                                $scope.userName = $scope.UsersList[index].userName;
                                $scope.department = $scope.UsersList[index].department;
                                $scope.contactSubName = $scope.UsersList[index].contactName;
                                $scope.position = $scope.UsersList[index].position;
                                $scope.editable = $scope.UsersList[index].editable == true ? "是" : "否";
                                $scope.roleNameList = [];

                                $scope.roleTbList = [];
                                $scope.showRoleTbList = [];

                                if ($scope.UsersList[index].tbList.length > 0) {
                                    $scope.roleTbList = $scope.UsersList[index].tbList;
									//$scope.Tbinfos=$scope.UsersList[index];
                                    for (var i in $scope.roleTbList) {
                                        for (var j in $scope.tablelist) {
                                            if ($scope.roleTbList[i].tbId == $scope.tablelist[j].tabid) {
                                                $scope.showRoleTbList.push({tableDesc: $scope.tablelist[j].tableDesc, tbId: $scope.tablelist[j].tabid, tableType: $scope.tablelist[j].tabletype});
                                            }
                                        }
                                    }
                                }

                                if ($scope.UsersList[index].roleList.length > 0) {
                                    $scope.roleNameList = $scope.UsersList[index].roleList;
                                }
                            }
                        },
                        {
                            'text': '否',
                            'style': 'btn-primary',
                            'fn': function () {
                                return;
                            }
                        }
                    ]
                }
            );
            return;
        }
        $scope.indexEditShow=true;

        angular.element(event.target).addClass('cur').siblings().removeClass('cur');
        $scope.delIndex=index;//删除子账号--index-位置
        //子账号信息
        $scope.userOne={
            userId : $scope.UsersList[index].userId,
            userName : $scope.UsersList[index].userName,
            department : $scope.UsersList[index].department,
            contactSubName : $scope.UsersList[index].contactName,
            position : $scope.UsersList[index].position,
            editable : $scope.UsersList[index].editable==true?"是":"否"
        };

        $scope.userId=$scope.UsersList[index].userId;

         /*$scope.userName=$scope.UsersList[index].userName;
        $scope.department=$scope.UsersList[index].department;
        $scope.contactSubName=$scope.UsersList[index].contactName;
        $scope.position=$scope.UsersList[index].position;
        $scope.editable=$scope.UsersList[index].editable==true?"是":"否";*/

        $scope.roleNameList=[];

        $scope.roleTbList=[];
        $scope.showRoleTbList=[];

        if($scope.UsersList[index].tbList.length>0) {
            $scope.roleTbList=$scope.UsersList[index].tbList;
//            $scope.Tbinfos=$scope.UsersList[index];
            for(var i in $scope.roleTbList){
                for(var j in $scope.tablelist){
                    if($scope.roleTbList[i].tbId==$scope.tablelist[j].tabid){
                        $scope.showRoleTbList.push({tableDesc:$scope.tablelist[j].tableDesc,tbId:$scope.tablelist[j].tabid,tableType:$scope.tablelist[j].tabletype});
                    }
                }
            }
        }
//      子账号角色列表
        if($scope.UsersList[index].roleList.length>0){
            $scope.roleNameList=$scope.UsersList[index].roleList;
        }

    };

//根据nav点击的li-id显示表和人
    /*
    * nav roleName列表
    * */
    $scope.selected=function(index,event){
//        alert($scope.editMenu);
        if($scope.editMenu){
//            alert(0);
            $rootScope.$broadcast("confirm",
                {
                    'title': '修改取消提醒',
                    'content': '是否取消修改',
                    'btns': [
                        {
                            'text': '是',
                            'style': 'btn-primary',
                            'fn': function () {
                                //传递索引-id
                                $scope.id=index;
                                $scope.delIndex=null;
                                //修改菜单隐藏
                                $scope.editMenu=false;
                                //显示页面隐藏
                                $scope.indexEditShow=false;
                                $scope.userName="";
                                $scope.department="";
                                $scope.contactSubName="";
                                $scope.editable="";
                                $scope.rolesubUsers=[];
                                //alert($scope.id+" "+index);
                                if(event.target.nodeName=="LI"){
                                    angular.element(event.target).addClass('cur').siblings().removeClass('cur');
                                }
                                $scope.UersShow=true;
                                if($scope.users[index].subUsers.length==0){
                                    $scope.UersShow=false;
                                }
                                selectToUsersData();

                            }
                        },
                        {
                            'text': '否',
                            'style': 'btn-primary',
                            'fn': function () {
                               return;
                            }
                        }
                    ]
                }
            );
            return;
        }
        //传递索引-id
        $scope.id=index;
        $scope.delIndex=null;
        //修改菜单隐藏
        $scope.editMenu=false;
        //显示页面隐藏
        $scope.indexEditShow=false;
        $scope.userName="";
        $scope.department="";
        $scope.contactSubName="";
        $scope.editable="";
        $scope.rolesubUsers=[];
        //alert($scope.id+" "+index);
        if(event.target.nodeName=="LI"){
            angular.element(event.target).addClass('cur').siblings().removeClass('cur');
        }
        /*
        * 角色
        * */
        if($routeParams.page){
//            alert(0)
            $scope.showRoleTbList=[];
            selectToRoleData();
        }

        /*
        * 子账号
        * */
        else{
            $scope.UersShow=true;
            if($scope.users[index].subUsers.length==0){
                $scope.UersShow=false;
            }
            selectToUsersData();
        }

    };

    $rootScope.$on('add-subUsers',function(event,data){
        $scope.indexEditShow=false;
    });


//新建角色
    $scope.setnewpage = function(){
        $scope.addRoleName="";
        $scope.setpage = true;
    };
    $scope.savepage = function(){
        //保存到数据库
        tools.get({
            url: '/Intelligence-Business-Management/addRole.htm',
            data: {
                roleName:$scope.addRoleName,
                tbInfos:'',
                subUserInfos:''
            },
            succ: function (data) {
                if (data.success) {
                    console.log('添加成功');
                    updateRoles();
                } else {
                    if (data.message != 'session expired') {
                        alert(data.message)
                    }

                }
            }
        });
        $scope.setpage = false;
    };
//删除角色
    $scope.delManage=function(){
        $rootScope.$broadcast("confirm",
            {
                'title': '删除提醒',
                'content': '是否删除该角色',
                'btns': [
                    {
                        'text': '是',
                        'style': 'btn-primary',
                        'fn': function () {
                            tools.get({
                                url: '/Intelligence-Business-Management/deleteSubUserRole.htm',
                                data: {
                                    roleId:$scope.roleData[$scope.id].roleId
                                },
                                succ: function (data) {
                                    if (data.success) {
                                        console.log('del成功');
                                    } else {
                                        if (data.message != 'session expired') {
                                            alert(data.message)
                                        }
                                    }
                                }
                            });
                            updateRoles();
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



    }
//添加表----角色管理
    $scope.addtable=function(){
        updateRoles();
        if($scope.roleData[$scope.id].tbList.length==$scope.tablelist.length){
            alert('表中已经无数据可关联');
            return;
        }
//        alert($scope.id);
        $rootScope.$broadcast('account',{0:$scope.id,1:'添加表',2:'表名',3:'所属角色',4:true});
    };
//添加子账号私有表
    $scope.addsubtable=function(){
//        alert($scope.id);
        //userId
        $rootScope.$broadcast('account',{0:$scope.id,1:'添加子账号私有表',2:'表名',3:'所属角色',4:true,5:$routeParams.index});
    };
//添加子账号
    $scope.addperson=function(){
        
        $rootScope.$broadcast('account',{0:$scope.id,1:'添加子账号',2:'子账号',3:'所属角色',4:false});

    };

//配置子账号
    $scope.add=function(){
        updateRoles();
//        updateUsers();
        $scope.showAccount=true;
        $scope.username='';
//        alert($scope.id);
//        console.log("$scope.roleData");
//        console.log($scope.roleData);
        if($scope.roleData[$scope.id].subUsers.length>0){
            $scope.allAcount=$scope.roleData[$scope.id].subUsers;
        }
//        console.log("ALL:");
//        console.log($scope.AllUsersList);
//        del
        $scope.allListUser=[];
        var json={};

        for(var i in $scope.AllUsersList){
            if(!json[$scope.AllUsersList[i].userId]){
                $scope.allListUser.push($scope.AllUsersList[i]);
                json[$scope.AllUsersList[i].userId]=1;
            }
        }
//        console.log($scope.allListUser);

        for(var i in $scope.allListUser){
            for(var j in $scope.allAcount){
                if($scope.allListUser[i].userId==$scope.allAcount[j].userId){
                    $scope.allListUser.splice(i,1);
                }
            }
        }

        var tableNames=[];
        var table=[];
        $scope.selectAdd=function(event,index){
//            alert(index);

            if(event.target.checked){
                tableNames.push({userId:event.target.id});
                table.push('{userId='+$scope.allListUser[index].userId+';userName='+$scope.allListUser[index].userName+';contactName='+$scope.allListUser[index].contactName+'}');

            }else{
                for(var i in tableNames){
                    if(tableNames[i].userId==event.target.id){
                        table.splice(i,1);
                        tableNames.splice(i,1);
                    }
                }

            }
//            console.log(table.join(','));
            $scope.UserListTable=table.join(',');//点击子账号选择的数据

        }
        $scope.saveAdd=function(){
//            console.log($scope.UserListTable);
            if($scope.UserListTable.length>0){
//                console.log("$scope.id:"+$scope.id);
//                console.log($scope.UserListTable);
                var flag=false;
                if($scope.roleData[$scope.id].subUserInfos==""){
                    flag=true;
                }
                $scope.roleData[$scope.id].subUserInfos+=","+$scope.UserListTable;

                if(flag){
                    $scope.roleData[$scope.id].subUserInfos=$scope.roleData[$scope.id].subUserInfos.substring(1);
//                    alert($scope.roleData[$scope.id].subUserInfos);
                }

               /* console.log({
                    roleId : $scope.roleData[$scope.id].roleId,
//                        subUserInfos:$scope.UserListTable
                    subUserInfos :$scope.roleData[$scope.id].subUserInfos

                });*/
                tools.get({
                    url: '/Intelligence-Business-Management/updateRole.htm',
                    data: {
                        roleId : $scope.roleData[$scope.id].roleId,
//                        subUserInfos:$scope.UserListTable
                        subUserInfos :$scope.roleData[$scope.id].subUserInfos
                    },
                    succ: function (data) {
                        if (data.success) {
                            console.log('添加子账号成功');
                        } else {
                            if (data.message != 'session expired') {
                                alert(data.message);
                            }

                        }
                    }
                });
                tools.get({
                    url: '/Intelligence-Business-Management/getRoleList.htm',
                    succ: function (data) {
                        if (data.success) {
                            $scope.roleData=data.value;
                            $scope.AllUsersList=[];
                            angular.forEach($scope.roleData,function(item){
                                angular.forEach(item.subUsers,function(item2){
                                    $scope.AllUsersList.push(item2);
                                });
                            });
                            selectToRoleData();
                        } else {
                            if(data.message != 'session expired'){
                                alert(data.message)
                            }
                        }
                    }
                });

            }else{
                alert("请选择");
            }
            $scope.showAccount=false;
        }
    };

/*
*
* 子账号功能---start
* */
//添加部门角色
    $scope.addroleId=function(){
        $rootScope.$broadcast('account',{0:$scope.id,1:'添加角色',2:'角色名',3:'所属角色',4:false,5:$scope.userId});
    }
//账号管理--跳转路径
    $scope.manageAcount=function(){
        var index=$scope.id;
        $location.search('index='+index);
    }





/*
* 角色管理---start
* */
//修改角色的表
    $scope.delRoleTbList=function(event,index){
//        console.log($scope.showRoleTbList);
        var roleId=$scope.roleData[$scope.id].roleId;
        if (!event.target.checked) {
            event.target.checked = "checked";
//            userId=$scope.rolesubUsers[index].userId;

            $scope.showRoleTbList.splice(index, 1);//前端显示
        }
        var tbInfos='';
        if($scope.showRoleTbList.length>0) {
            angular.forEach($scope.showRoleTbList, function (item, index) {
                if(index==0){
//                    {tbId=123;tableType=base}
                    tbInfos='{tbId='+item.tbId+';tableType='+item.tableType+'}';
                }else {
                    tbInfos +=',{tbId='+item.tbId+';tableType='+item.tableType+'}';
                }
            });
        }
        /*console.log({
            roleId  : roleId,		        //角色ID
            tbInfos : tbInfos	             //角色名称
        });*/
        tools.get({
            url: '/Intelligence-Business-Management/updateRole.htm',
            data: {
                roleId  : roleId,		        //角色ID
                tbInfos : tbInfos	             //角色名称
            },
            succ: function (data) {
                if (data.success) {
                    console.log('修改成功');
//                    console.log("-----update----");
                } else {
                    if (data.message != 'session expired') {
                        alert(data.message)
                    }
                }
            }
        });


    };
//修改配置子账号---删除关联
    $scope.delrolesubUsers=function(index) {
//        console.log($scope.rolesubUsers[index]);
        var roleId;
        roleId=$scope.roleData[$scope.id].roleId;
        if (!event.target.checked) {
            event.target.checked = "checked";
//            userId=$scope.rolesubUsers[index].userId;

            $scope.rolesubUsers.splice(index, 1);//前端显示
        }
        var subUserInfos='';
        if($scope.rolesubUsers.length>0) {
            angular.forEach($scope.rolesubUsers, function (item, index) {
                if(index==0){
//                    userId=123;userName=aaa;contactName=bbb
                    subUserInfos='{userId='+item.userId+';userName='+item.userName+';contactName='+item.contactName+'}';
                }else {
                    subUserInfos +=',{userId='+item.userId+';userName='+item.userName+';contactName='+item.contactName+'}';
                }
            });
        }
        /*console.log({
            roleId  : roleId,		        //角色ID
            subUserInfos : subUserInfos	             //角色名称
        });*/
        tools.get({
            url: '/Intelligence-Business-Management/updateRole.htm',
            data: {
                roleId  : roleId,		        //角色ID
                subUserInfos : subUserInfos	             //角色名称
            },
            succ: function (data) {
                if (data.success) {
                    console.log('修改成功');
//                    console.log("-----update----");
                } else {
                    if (data.message != 'session expired') {
                        alert(data.message)
                    }
                }
            }
        });


    }
// end----角色管理



//修改子账号角色roleIds
    $scope.delRoleIds=function(index,event){
        if(!event.target.checked){
            event.target.checked="checked";
            $scope.EditroleNameList.splice(index,1);
        }
    };
//删除子账号私有表
    $scope.delUserTbList=function(event,index){
        var userId=$scope.userId;
        if (!event.target.checked) {
            event.target.checked = "checked";
//            userId=$scope.rolesubUsers[index].userId;

            $scope.EditshowRoleTbList.splice(index, 1);//前端显示
        }
//        console.log($scope.EditshowRoleTbList);
    };



//显示编辑菜单页
    $scope.editSub=function(){
        $scope.editMenu=true;
        $scope.indexEditShow=false;

        $scope.EditroleNameList=angular.copy($scope.roleNameList);
        $scope.EditshowRoleTbList=[];
        if($scope.showRoleTbList.length>0) {
            $scope.EditshowRoleTbList = angular.copy($scope.showRoleTbList);
        }else{
            $scope.EditshowRoleTbList=[];
        }
        /*console.log("-------------------------");
        console.log($scope.showRoleTbList);
        console.log($scope.EditshowRoleTbList);*/

        $scope.userOneCopy=angular.copy($scope.userOne);
        /*$scope.userOneCopy.Editeditable=$scope.UsersList[$scope.delIndex].editable;
        console.log($scope.userOneCopy);
        $scope.EdituserName=$scope.userName;
        $scope.Editdepartment=$scope.department;
        $scope.Editposition=$scope.position;
        $scope.EditcontactSubName=$scope.contactSubName;*/
        $scope.Editeditable=$scope.UsersList[$scope.delIndex].editable;
        if($scope.Editeditable){
            $("#radio1").prop('checked',true);//true
        }else{
            $("#radio2").prop('checked',true);//false
        }
    };


//    编辑状态-是否单选框点击事件
    $scope.radioSelect=function(event){
//        alert($scope.Editeditable);
        $scope.Editeditable=event.target.value;
//        alert($scope.Editeditable);

    };

//确认修改按钮--保存修改
    $scope.affirm=function(){
        //broadcast--confirm
        $rootScope.$broadcast("confirm",
            {
                'title': '修改提醒',
                'content': '是否确认修改子账号',
                'btns': [
                    {
                        'text': '是',
                        'style': 'btn-primary',
                        'fn': function () {
                            /*console.log({
                                userId:$scope.userId
                            });
                            console.log("EditroleNameList");
                            console.log($scope.EditroleNameList);
                            console.log("EditshowRoleTbList");
                            console.log($scope.EditshowRoleTbList);
                            console.log($scope.showRoleTbList);*/
                            var roleIds='';
                            console.log($scope.EditroleNameList);
                            angular.forEach($scope.EditroleNameList,function(item,index){
                                if(index==0){
                                    roleIds=item.roleId;
                                }else {
                                    roleIds += "," + item.roleId;
                                }
                            });
//                            console.log(roleIds);
                            var tbInfos='';

                            angular.forEach($scope.EditshowRoleTbList,function(item){
                                tbInfos+="{tbId="+item.tbId+";tableType="+item.tableType+"},";
                            });
//                            console.log(tbInfos);
                            tbInfos=tbInfos.slice(0,-1);
//                            console.log(tbInfos);
                            /*
                            * userId 		用户ID
                             userName 	用户名
                             contactName 	姓名
                             department 	部门
                             position 	职位
                             editable 	用户编辑状态
                             tbInfos 	用户特有表信息 {tbId=xxx;tableType=xxx},{tbId=xxx;tableType=xxx}
                             roleIds 	用户所拥有的角色 roleId1,roleId2,roleId3

                             * */
                            console.log( {
                                userId:$scope.userId,
                                userName:$scope.userOneCopy.userName,
                                contactName:$scope.userOneCopy.contactSubName,
                                department:$scope.userOneCopy.department,
                                position:$scope.userOneCopy.position,
                                editable:$scope.Editeditable,
                                tbInfos:tbInfos,
                                roleIds:roleIds
                            });
                            tools.get({
                                url: '/Intelligence-Business-Management/updateSubUser.htm',
                                data: {
                                    userId:$scope.userId,
                                    userName:$scope.userOneCopy.userName,
                                    contactName:$scope.userOneCopy.contactSubName,
                                    department:$scope.userOneCopy.department,
                                    position:$scope.userOneCopy.position,
                                    editable:$scope.Editeditable,
                                    tbInfos:tbInfos,
                                    roleIds:roleIds
                                },
                                succ: function (data) {
                                    if (data.success) {
                                        console.log('修改成功');
                                        if(roleIds.length==0){
                                            $scope.indexEditShow=false;
                                        }
                                        $rootScope.$broadcast('update-usersLi',"");

                                    } else {
                                        if (data.message != 'session expired') {
                                            alert(data.message)
                                        }
                                    }
                                }
                            });
                            $scope.editMenu=false;
                            $scope.indexEditShow=true;
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


//确认修改按钮--取消修改
    $scope.cancel=function(){
        $scope.editMenu=false;
        $scope.indexEditShow=true;
    };

//删除子账号---bug

    $scope.del=function(){
        if($scope.delIndex==null){
            alert("请选择子账号");
            return;
        }
        $rootScope.$broadcast("confirm",
            {
                'title': '删除提醒',
                'content': '删除之后将不再可见，确定删除吗?',
                'btns': [
                    {
                        'text': '是',
                        'style': 'btn-primary',
                        'fn': function () {
                            /*console.log({
                                userId:$scope.userId
                            });*/
                            tools.get({
                                url: '/Intelligence-Business-Management/deleteSubUser.htm',
                                data: {
                                    userId:$scope.userId
                                },
                                succ: function (data) {
                                    if (data.success) {
                                        console.log('del成功');
                                        $scope.indexEditShow=false;
                                    } else {
                                        if (data.message != 'session expired') {
                                            alert(data.message)
                                        }
                                    }
                                }
                            });
                            $scope.delIndex=null;
                            $rootScope.$broadcast('update-role',"");
                            $rootScope.$broadcast('update-users',"");
//                            updateUsers();
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



/*接收rootScope*/
    //添加角色
    $rootScope.$on('ADD-ROLE',function(event,data){
        angular.forEach(data,function(item){
//            console.log(item);
            if($scope.EditroleNameList){
                $scope.EditroleNameList=[];
            }
            $scope.EditroleNameList.push(item);
        });
    });
    //添加表
    $rootScope.$on('ADD-TB',function(event,data){
        angular.forEach(data,function(item){
//            console.log("data:");
//            console.log(item);
//            if();
//            console.log($scope.EditshowRoleTbList);
            if(!$scope.EditshowRoleTbList){
                $scope.EditshowRoleTbList=[];
            }
            $scope.EditshowRoleTbList.push(item);

//            console.log($scope.EditshowRoleTbList);
        });
    });
}]);



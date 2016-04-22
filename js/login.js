/**
 * Created by charsen on 15/12/20.
 */

MAIN.controller('loginCtrl', ["$scope", "$rootScope", "tools", function ($scope, $rootScope, tools) {
    // $scope.userType = "administrator";
//  $scope.userName = "sudgin";
//  $scope.password = "123456";
	window.localStorage.userType="";
    $scope.userName = window.localStorage.userName ? window.localStorage.userName : "";
    $scope.password = window.localStorage.password ? window.localStorage.password : "";

    //isChecked 取缓存中数据check选中
    if (window.localStorage.isChecked == "true") {
        $('#checkbox3').attr('checked', "checked");
    }

    $scope.login = function () {
        if ($('#checkbox3').is(':checked')) { //选中
            window.localStorage.isChecked = true;
            window.localStorage.userType = $scope.userType;
            // window.localStorage.userName = $scope.userName;
            window.localStorage.password = $scope.password;
        } else { //未选中
            window.localStorage.userType = "";
            window.localStorage.userName = "";
            window.localStorage.password = "";
            window.localStorage.isChecked = false;
        }
        if($scope.userName==''){
            $rootScope.$broadcast('dialog',{
               title:'',
                content:'用户名不能为空'
            });
            return;
        }
        if($scope.password==''){
            $rootScope.$broadcast('dialog',{
                title:'',
                content:'密码不能为空'
            });
            return;
        }
        tools.get({
            url: '/Intelligence-Business-Management/login.htm',
            data: {
                // userType: $scope.userType,
                userName: $scope.userName,
                password: hex_md5($scope.password)
            },
            succ: function (resp) {
                if (resp.success) {                    
                    //console.log(resp.value.editable)
                    if (window.localStorage) {
                        window.localStorage.userName = $scope.userName;
                        window.localStorage.userType = resp.value.type;
                        window.localStorage.seteditable = resp.value.editable;
                    }
                    //tools.data.setItem('seteditable',resp.value.editable);
                    window.location.href = window.location.href.replace("login.html", 'main.html#/index');
                }else{
                    $rootScope.$broadcast('dialog',{
                        title:'',
                        content:'用户名或密码错误'
                    });
                }
            }
        });
    }
}]);
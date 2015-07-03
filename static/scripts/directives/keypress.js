'use strict';

app.directive('dbKeypress', 
  [ 
  function () {
    return {

      controller: function($scope){
      // Event handlers
        
        $scope.onKeyDown = function ($event) {
          console.log('key event');
          if($event.keyCode===13){
            //
            document.loginForm.loginButton.click();
          }
          // $scope.onKeyDownResult = getKeyboardEventResult($event, "Key down");
          if($event.keyCode===38){
            //scroll up some
            document.getElementsByClassName('ng-modal-dialog-content')[0].scrollTop -= 50;
          }
          if($event.keyCode===40){
            //scroll down some
            document.getElementsByClassName('ng-modal-dialog-content')[0].scrollTop += 50;
          }

        };
      }
    };
  }]
);


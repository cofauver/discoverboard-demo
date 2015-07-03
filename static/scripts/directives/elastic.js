'use strict';

app.directive('dbElastic', [function() {
      return {
        restrict: 'A',
        link: function($scope, element) {
          var resize = function() {
            return element[0].style.height = "" + element[0].scrollHeight + "px";
          };
          element.on("blur click change", resize);
          element.on("blur keyup change", resize);
        }
      };
    }
  ]);

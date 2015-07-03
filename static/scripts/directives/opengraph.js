'use strict';

app.directive('dbOpengraph', 
	['DetectMobileService', 'WindowSizeService',
	function (DetectMobileService, WindowSizeService) {
		return {
			scope:{
				site: '=',
				count: '='
			},
			restrict:'EA',

			controller:function($scope){

				$scope.isMobile = DetectMobileService.isMobile;
				$scope.windowWidth = WindowSizeService.getWindowWidth();
				$scope.opengraphWidth = document.getElementById('opengraph').offsetWidth;

				// console.log($scope.count);

			},
			templateUrl: '../templates/opengraph.html'
		};
	}]
);

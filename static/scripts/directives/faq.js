'use strict';

app.directive('dbFaq', 
	['BackendService', 
	function (BackendService) {
		return {
			scope:{

			},
			restrict:'EA',

			controller:function($scope){

				BackendService.getMonthlyCost().then(function(monthlyCost){
					$scope.monthlyCost = monthlyCost;
				});
				
			},
			templateUrl: '../templates/faq.html'
		};
	}]
);

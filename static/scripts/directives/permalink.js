'use strict';

app.directive('dbPermalink', 
	[ 
	function () {
		return {
			scope:{
				comment: '='
			},
			restrict:'EA',

			controller:function($scope){
				$scope.permalink = '/posts/'+ $scope.comment.id;
			},
			templateUrl: '../templates/permalink.html'
		};
	}]
);

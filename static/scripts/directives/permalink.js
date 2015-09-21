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
				var domain = 'https://dbo-portfolio1.herokuapp.com';
				$scope.permalink = domain + '/posts/'+ $scope.comment.id;
			},
			templateUrl: '../templates/permalink.html'
		};
	}]
);

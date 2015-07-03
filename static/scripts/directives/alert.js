'use strict';

app.directive('dbAlert',  function () {
	return {
		scope:{
			// modalTitle: '=',
			// contents: '=',
			// targetId: '=',
			// buttonFunction: '&'
		},
		restrict:'EA',

		controller:function($scope){
			$scope.alerts = [
		    	{ type: 'danger', msg: 'Oh snap! Change a few things up and try submitting again.' },
		    	{ type: 'success', msg: 'Well done! You successfully read this important alert message.' }
		  	];

		  	$scope.addAlert = function() {
		    	$scope.alerts.push({msg: 'Another alert!'});
		    	console.log("Alert added!");
		  	};

		  	$scope.closeAlert = function(index) {
		    	$scope.alerts.splice(index, 1);
		  	};

		},
		templateUrl: '../templates/alert.html'
	};
});

'use strict';

app.directive('dbModal',  function () {
	return {
		scope:{
			modalTitle: '=',
			contents: '=',
			targetId: '=',
			buttonFunction: '&',
			data: '='
		},
		restrict:'EA',
		templateUrl: '../templates/modal.html'
	};
});

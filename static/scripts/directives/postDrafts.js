'use strict';

app.directive('dbPostDrafts', 
	['$window', 'BackendService', 'UserService',
	function ($window, BackendService, UserService) {
		return {
			restrict:'EA',

			controller:function($scope){
				var user;
				user = UserService.getUserId();
				BackendService.getPostDrafts(user).then(function(result){
					$scope.drafts = result;
				});

				var removeFromDraftList = function(draft){
					var draftToDelete = $scope.drafts.indexOf(draft);
					$scope.drafts.splice(draftToDelete, 1);
				}

				$scope.draftFunctions.saveDraft = function(draft){
					console.log("saveDraft function executed");
					console.log(draft);
					if(!draft.id){
						BackendService.createDraft(user, draft).then(function(result){
							$scope.workingDraft.id = result.data.draft.id;
							$scope.drafts.splice(0, 0, result.data.draft);
							$scope.userInput.saved = !$scope.userInput.saved;
						});
					}else{
						BackendService.storeDraft(user, draft.id, draft).then(function(result){
							console.log('BackendService.storeDraft');
							$scope.drafts = $scope.drafts.filter(function(obj) {
							  return obj.id !== draft.id;
							});
							$scope.drafts.splice(0, 0, result.data.draft);
							$scope.userInput.saved = !$scope.userInput.saved;
						});
					}
				};

				$scope.loadDraft = function(draft){
					if($scope.workingDraft.html){
						$scope.draftFunctions.saveDraft($scope.workingDraft);
					}
					console.log('loadDraft executing');
					$scope.workingDraft = draft;
					removeFromDraftList(draft);
					var page = document.getElementsByClassName('scrollable-content')[2];
            			page.scrollTop = 0;
				};

				$scope.deleteDraft = function(draft){
					BackendService.deleteDraft(user, draft.id);
					removeFromDraftList(draft);
				};

				$scope.$on('$locationChangeStart', function(){
					if($scope.workingDraft.id){	
						BackendService.storeDraft(user, $scope.workingDraft.id, $scope.workingDraft);
					}else if($scope.workingDraft.html){
						BackendService.createDraft(user, $scope.workingDraft);
					}
				});

				$scope.$watch('workingDraft.html', 
					function(){
						if($scope.userInput.saved){
							$scope.userInput.saved = false;
						}

						angular.forEach($scope.drafts, 
							function(draft, key){
								if($scope.workingDraft.html === draft){
									console.log(draft);
									$scope.userInput.saved = true;
								}
							}
						);
					}
				);


			},
			templateUrl: '../templates/post-drafts.html'
		};
	}]
);

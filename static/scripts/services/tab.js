'use strict';

app.factory('TabService', [function(){

	var service = {
			
			sidebarTab: 1,
			accountTab: 1,

			setSidebarTab:function(sidebarTab){
				this.sidebarTab = sidebarTab;
			},
			getSidebarTab:function(){
				return this.sidebarTab;
			},
			setAccountTab:function(accountTab){
				this.accountTab = accountTab;
			},
			getAccountTab:function(){
				return this.accountTab;
			},
    };

    return service;

}]);

//======================================================
//	Ocugine JavaScript SDK Demo Application
//	This script is an usage demonstration for Ocugine
//	JavaScript SDK Library.
//
//	@name           Ocugine SDK
//  @developer      CodeBits Interactive
//  @version        0.4.0a
//  @build          401
//  @url            https://ocugine.pro/
//  @docs           https://docs.ocugine.pro/
//  @license        MIT
//======================================================
$(document).ready(function(){
	// Initialize Ocugine SDK
	var OSDK = new OcugineSDK({ // App Settings
		app_id: 1,
		app_key: "asd9hj@Qniasdh87nasdb78ADF78as"
	}, { // SDK Settings
		language: "EN"
	}, true);
	
	// Call Test
	OSDK.call("state.get_state", {}, function(data){ 
		console.log(data); 
	}, function(error){
		console.log(error);
	});
	
	// Test Module
	OSDK.module("utils").test();
});
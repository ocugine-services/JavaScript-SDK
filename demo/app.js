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
	let OSDK = new OcugineSDK({ // App Settings
		app_id: 1,
		app_key: "c46361ae80c1679d637c2f23968a4dc5d5ea2a65"
	}, { // SDK Settings
		language: "EN"
	}, true);

	// Test Application Connection
	OSDK.module("utils").testAPPConnection(function(data){
		console.log("Ocugine SDK is Initialized"); // SDK Initialized
	}, function(error){
		console.log(error);
	});

	// Test localization
	
});

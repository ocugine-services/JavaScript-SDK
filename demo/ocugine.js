//======================================================
//	Ocugine JavaScript SDK
//	Sofware Development Kit developed specially for
//  Ocugine Services. With this library you can
//  use all features of Ocugine Services on JS
//
//	@name           Ocugine SDK
//  @developer      CodeBits Interactive
//  @version        0.4.0a
//  @build          401
//  @url            https://ocugine.pro/
//  @docs           https://docs.ocugine.pro/
//  @license        MIT
//======================================================
//======================================================
//	WARNING. Ocugine JavaScript SDK use modern JS
//	features and may be unsupported for old browsers.
//
//	Supported Browsers:
//	Chrome >= v.58 (Apr 2017)
//	Firefox >= v.54 (Jun 2017)
//	Edge >= v.14 (Aug 2016)
//	Safari >= v.10 (Sep 2016)
//	Opera >= v.55 (Aug 2017)
//======================================================
//======================================================
//	Ocugine JavaScript SDK
//======================================================
'use strict';

//======================================================
//	Ocugine SDK Class
//======================================================
//	Application Settings Model (app_settings):
//	(number) app_id - Application ID
//	(string) app_key - Application Key
//
//	SDK Settings Model (sdk_settings):
//	(string) language - Current Language
//======================================================
var modules = {};
class OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			(object) app_settings - Application Settings
	//					(object) sdk_settings - SDK Settings
	//					(bool) debug - Debug Mode
	//	@returns		none
	//======================================================
	constructor(app_settings, sdk_settings, debug){
		// Check Variables Values
		if(this._isEmpty(app_settings) || this._isEmpty(sdk_settings)){
			throw "Failed to initialize Ocugine SDK. Please, check SDK Settings.";
		}

		// Set Base Settings
		this.application = app_settings; 				// Set Application Settings
		this.settings = sdk_settings; 					// Set SDK settings
		this.debug = (this._isEmpty(debug) || !this._isBoolean(debug))?false:debug;	// Set Debug Params

		// Set Another SDK Params
		this.is_https = true;							// HTTP/HTTPs Mode
		this.server_url = "cp.ocugine.pro";				// API Server URL
		this.server_gateway = "api";					// API Server Gateway

		// Set Utils
		this.modules = {};								// Modules
	}

	//======================================================
	//	@method			call()
	//	@usage			Call API Method
	//	@args			(string) method - API Method. Ex: users.get_list
	//					(object) data - Data to send. Ex: { param1: val1, param2: val2 }
	//					(function) success - Done Callback
	//					(function) error - Error Callback
	//	@returns		none
	//  #CALLISHERE
	//======================================================
	call(method, data, success, error){
		//if(method == 'oauth.logout') { debugger; }

		// Check Method
		var _self = this;
		if(this._isEmpty(method) || !this._isString(method)) throw "API Method argument must contain string object and method name. For example: users.get_list";
		let _method = method.split("."); // Split Method
		if(_method.length<2 || _method.length>2) throw "Wrong method name. Please, read documentation";

		// Check Data
		let _data = (this._isEmpty(data))?{}:data; // Set Data

		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback

		// Generate Full URL
		let _url = this._getAPIUrl() + _method[0] + "/" + _method[1] + "/"; // Get URL

		// Sending POST Request
		let xhr = new XMLHttpRequest(); // Create XML HTTP Request
		xhr.open("POST", _url, true); // Open Connection
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); // Set Header

		// XHR Done
		xhr.onreadystatechange = function() {	// Then XHR Status Changed
			if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) { // Complete
				try{ // Trying to parse data
					var _resp = JSON.parse(xhr.responseText); // Parse JSON
					if(_resp.complete){ // Complete Status
						_success(_resp); // Send Success Callback 
					}else{ // Error Status
						_error({ // Call Error 
							message: _resp.message,
							code: (_self._isEmpty(_resp.code) || !_self._isNumber(_resp.code))?-1:_resp.code
						});
					}
				}catch{ // Error
					_error({ // Call Error _
						message: "Failed to decode server response. Please, try again later or contact us.",
						code: 98
					});
				}
			}
		}

		// XHR Error
		xhr.onerror  = function(){ // Then XHR gets error
			_error({ // Call Error
				message: "Failed to send request. Please, check your internet connection and try again.",
				code: 99
			});
		}


		// Send Request
		xhr.send(this._serializeData(data));
	}

	//======================================================
	//	@method			module()
	//	@usage			Load SDK Module
	//	@args			(string) name - Module Name
	//	@returns		(object) module - Module Instance
	//======================================================
	module(name){
		// Check Module Initialized
		if(!this._isEmpty(this.modules[name]) && this._isObject(this.modules[name])){
			return this.modules[name]; // Return Module
		}

		// Initialize Module
		this.modules[name] = new OcugineMapping[name](this);
		return this.modules[name];
	}

	//======================================================
	//	@method			_serializeData()
	//	@usage			Serialize Object to send it
	//	@args			(object) obj - Object to Serialize
	//	@returns		(string) url_part - URL Part
	//======================================================
	_serializeData(obj){
		// Check Object
		if(this._isEmpty(obj) || !this._isObject(obj)) throw "Failed to serialize object to URL parts. Please, check documentation.";

		// Generate String
		let str = Object.keys(obj).map(function(prop) {
		  return [prop, obj[prop]].map(encodeURIComponent).join("=");
		}).join("&");

		// Return
		return str;
	}

	//======================================================
	//	@method			_getAPIUrl()
	//	@usage			Get Full API URL based on
	//					SDK Settings (see constructor)
	//	@args			none
	//	@returns		(string) url - API URL
	//======================================================
	_getAPIUrl(){
		let url = (this.is_https)?"https://":"http://";	// Start from Protocol
		url += this.server_url; // Prepare URL
		url += "/"+this.server_gateway+"/"; // Set Server Gateway
		return url; // Return URL
	}

	//======================================================
	//	@method			_isString()
	//	@usage			Check if variable is string
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is string
	//======================================================
	_isString(variable){
		return typeof variable === 'string' || variable instanceof String;
	}

	//======================================================
	//	@method			_isNumber()
	//	@usage			Check if variable is number
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is number
	//======================================================
	_isNumber(variable){
		return typeof variable === 'number' && isFinite(variable);
	}

	//======================================================
	//	@method			_isArray()
	//	@usage			Check if variable is array
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is array
	//======================================================
	_isArray(variable){
		return variable && typeof variable === 'object' && variable.constructor === Array;
	}

	//======================================================
	//	@method			_isFunction()
	//	@usage			Check if variable is function
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is function
	//======================================================
	_isFunction(variable){
		return typeof variable === 'function';
	}

	//======================================================
	//	@method			_isBoolean()
	//	@usage			Check if variable is boolean
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is boolean
	//======================================================
	_isBoolean(variable){
		return typeof variable === 'boolean';
	}

	//======================================================
	//	@method			_isRegex()
	//	@usage			Check if variable is regex
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is regex
	//======================================================
	_isRegex(variable){
		return variable && typeof variable === 'object' && variable.constructor === RegExp;
	}

	//======================================================
	//	@method			_isError()
	//	@usage			Check if variable is error
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is error
	//======================================================
	_isError(variable){
		return variable instanceof Error && typeof variable.message !== 'undefined';
	}

	//======================================================
	//	@method			_isDate()
	//	@usage			Check if variable is date
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is date
	//======================================================
	_isDate(variable){
		return variable instanceof Date;
	}

	//======================================================
	//	@method			_isSymbol()
	//	@usage			Check if variable is symbol
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is symbol
	//======================================================
	_isSymbol(variable){
		return typeof variable === 'symbol';
	}

	//======================================================
	//	@method			_isObject()
	//	@usage			Check if variable is object
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable is object
	//======================================================
	_isObject(variable){
		return variable && typeof variable === 'object' && variable.constructor === Object;
	}

	//======================================================
	//	@method			_isEmpty()
	//	@usage			Check if variable is null or undefined
	//	@args			(var) Variable to check
	//	@returns		(bool) Variable null/undefined state
	//======================================================
	_isEmpty(variable){
		// Check Variable Exists
		/*if(variable === undefined || variable== null){ // Not Exists or Null
			return false;
		}else{ // Exists
			return true;
		}*/
	}
}

//======================================================
//	Ocugine Auth
//======================================================
class Ocugine_Auth extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */

	//======================================================
	//	@method			get_link()
	//	@usage			Get OAuth Link
	//	@args				(string/array) grants - OAuth grants
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	get_link(grants, success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		var _self = this; // Link

		// Call API Request
		this.call("oauth.get_link", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
		}, function(data){
			_success(data)
			let wind;
			wind = window.open(data.data.auth_url);
			var timer = setInterval(function() { 
				if(wind.closed) { 
					clearInterval(timer); 
					_self.get_token(); 
				} 
			}, 1000);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			get_link()
	//	@usage			Get OAuth Token
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	get_token(success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		
		this.call("oauth.get_token", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
		}, function(data){
			localStorage.access_token = data.data.access_token;
			_success(data);		
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			get_link()
	//	@usage			Remove OAuth Token
	//	@args				(string) token - Access Token
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	remove_token(token, success, error){
		var _self = this;
		
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		var actoken = localStorage.getItem('access_token');

		if(!actoken === true) {
			_self.get_token(function(data) {				
				_self.call("oauth.logout", {
					access_token: localStorage.access_token
				},
				function() {
					localStorage.removeItem('access_token');
					_success(data);
				},
				function(error) {
					_error(error);
				});
			});
		} else {
			this.call("oauth.logout", {
				access_token: localStorage.access_token,
			}, function(data){
				localStorage.removeItem('access_token');
				_success(data);				
			}, function(error){
			  _error(error);
			});
		}
	}
}
//======================================================
//	Ocugine Analytics
//======================================================
class Ocugine_Analytics extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */
}

//======================================================
//	Ocugine Gaming
//======================================================
class Ocugine_Gaming extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */
}

//======================================================
//	Ocugine Monetization
//======================================================
class Ocugine_Monetization extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */
}

//======================================================
//	Ocugine Notifications
//======================================================
class Ocugine_Notifications extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */
}

//======================================================
//	Ocugine Marketing
//======================================================
class Ocugine_Marketing extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */
}

//======================================================
//	Ocugine Ads
//======================================================
class Ocugine_Ads extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */
}

//======================================================
//	Ocugine Backend
//======================================================
class Ocugine_Backend extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	//======================================================
	//	@method			get_content_list()
	//	@usage			Get content Info
	//	@args				(obj) grants - grants
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	get_content_list(success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		
		this.call("cloud.get_content_list", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			get_content()
	//	@usage			Get content
	//	@args				(obj) grants - grants
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	get_content(success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		
		this.call("cloud.get_content", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			cid: this.instance.applicatiыon.cid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}
}

//======================================================
//	Ocugine Reports
//======================================================
class Ocugine_Reports extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */
}

//======================================================
//	Ocugine Perfomance
//======================================================
class Ocugine_Perfomance extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */
}

//======================================================
//	Ocugine Localization
//======================================================
class Ocugine_Localization extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */

	//======================================================
	//	@method			get_language()
	//	@usage			Get Language Info
	//	@args				(string) code - Language Code
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	get_language(code, success, error){
		// Check Params
		if(this._isEmpty(code) || !this._isString(code)){
			throw "Failed to get language info. Please, type language code and try again.";
		}

		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		var _self = this; // Link

		// Call API Request
		this.call("localization.get_lang", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			code: code
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			get_locale()
	//	@usage			Get Locale Data
	//	@args				(string) code - Locale Code
	//							(string) lang - language
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	get_locale(code, lang, success, error){
		// Check Params
		if(this._isEmpty(code) || this._isEmpty(lang) || !this._isString(code) || !this._isString(lang)){
			throw "Failed to get locale value. Please, type locale code and language.";
		}

		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		var _self = this; // Link

		// Call API Request
		this.call("localization.get_locale", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			code: code,
			lang: lang
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}
}


//======================================================
//	Ocugine Users
//======================================================
class Ocugine_Users extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args				none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	//======================================================
	//	@method			get_policy_list()
	//	@usage			Get policy list
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	get_policy_list(success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		
		// Call API Request
		this.call("users.get_policy_list", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
		
	}

	//======================================================
	//	@method			get_policy_info()
	//	@usage			Get policy info
	//	@args				(string/array) grants - OAuth grants
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	get_policy_info(success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		this.call("users.get_policy_info", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			pid: this.instance.application.pid,
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
		
	}
}

//======================================================
//	Ocugine UI
//======================================================
class Ocugine_UI extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args				none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */
	//======================================================
	//	@method			showOAuth()
	//	@usage			Show OAuth Window and process auth for
	//							this application
	//	@args				none
	//	@returns		none
	//======================================================
	showOAuth(){

	}
}

//======================================================
//	Ocugine Utils
//======================================================
class Ocugine_Utils extends OcugineSDK{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args				none
	//	@returns		none
	//======================================================
	constructor(parent){
		super(); // Set Constructor
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Migrate from Previous Version of SDK */

	//======================================================
	//	@method			getAPIState()
	//	@usage			Get Current API State
	//	@args			(function) success - Done Callback
	//					(function) error - Error Callback
	//======================================================
	getAPIState(success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		this.call("state.get_state", {}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			getAPIInfo()
	//	@usage			Get Current API Info
	//	@args				(function) success - Done Callback
	//							(function) error - Error Callback
	//======================================================
	getAPIInfo(success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		this.call("state.init", {}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			testAPPConnection()
	//	@usage			Test Application Connection
	//	@args			(function) success - Done Callback
	//					(function) error - Error Callback
	//======================================================
	testAPPConnection(success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		var _self = this; // Link

		// Call API Request
		this.call("connection.init", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			get_settings()
	//	@usage			Get settings for app
	//	@args				(function) success - Done Callback
	//							(function) error - Error Callback
	//======================================================
	get_settings(success, error){
		var _self = this;
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback
		
		// Call API Request
		this.call("api_settings.get_settings", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}


	//======================================================
	//	@method			test()
	//	@usage			Module Testing
	//	@args			none
	//	@returns		none
	//======================================================
	test(){
		console.log("Module successfully works!");
	}
}

//======================================================
//	Ocugine SDK Classes Mapping
//======================================================
const OcugineMapping = {
	"auth": Ocugine_Auth, // Ocugine Auth
	"analytics": Ocugine_Analytics, // Analytics
	"game": Ocugine_Gaming, // Gaming Services
	"monetization": Ocugine_Monetization, // Monetization
	"notify": Ocugine_Notifications, // Notifications
	"marketing": Ocugine_Marketing, // Marketing
	"ads": Ocugine_Ads, // Advertising
	"backend": Ocugine_Backend, // Backend
	"reports": Ocugine_Reports, // Reports
	"perfomance": Ocugine_Perfomance, // Perfomance
	"localization": Ocugine_Localization, // Localization
	"users": Ocugine_Users, // Ocugine Users
	"ui": Ocugine_UI, // Ocugine UI
	"utils": Ocugine_Utils	// Utils Class
};

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
		this.platform = "web";									// SDK Platform
		this.application = app_settings; 				// Set Application Settings
		this.settings = sdk_settings; 					// Set SDK settings
		this.debug = (debug)?true:false;				// Set Debug Params

		// Set Another SDK Params
		this.is_https = true;							// HTTP/HTTPs Mode
		this.server_url = "cp.ocugine.pro";				// API Server URL
		this.server_gateway = "api";					// API Server Gateway

		// Set Utils
		this.modules = {};								// Modules

		// Send First Open flag and Session Start
		if(this.settings.auto_analytics){
			this.module("Analytics").sendUserFlag("first_open");
			this.module("Analytics").sendUserFlag("session_update");
			this.module("Analytics").updateRetention();
		}
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
						if(_self.debug) console.log(_resp.data);
						_success(_resp.data); // Send Success Callback
					}else{ // Error Status
						if(_self.debug) console.log(_resp.message);
						_error({ // Call Error
							message: _resp.message,
							code: (_self._isEmpty(_resp.code) || !_self._isNumber(_resp.code))?-1:_resp.code
						});
					}
				}catch{ // Error
					if(_self.debug) console.log("Failed to decode server response. Please, try again later or contact us. Response Data: " + xhr.responseText);
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
		// Set Module Name
		name = name.toLowerCase();

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
	//	@method			_getServerUrl()
	//	@usage			Get Server URL
	//	@args				none
	//	@returns		(string) url - API URL
	//======================================================
	_getServerUrl(){
		let url = (this.is_https)?"https://":"http://";	// Start from Protocol
		url += this.server_url; // Prepare URL
		url += "/"; // Set Server Gateway
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
		//return (variable === undefined || variable === null)?true:false;
		return false;
	}
}

//======================================================
//	Ocugine Auth
//======================================================
class Ocugine_Auth{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object

		// Set Default Values
		this.auth_key = ''; // Auth Key Temporary
		this.access_token = localStorage.getItem('access_token');
	}

	//======================================================
	//	@method			get_link()
	//	@usage			Get OAuth Link
	//	@args				(string/array) grants - OAuth grants
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	getLink(grants, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("oauth.get_link", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			grants: grants
		}, function(data){
			_self.auth_key = data.auth_key;
			localStorage.setItem("auth_key", _self.auth_key);
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			getToken()
	//	@usage			Get OAuth Token
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	getToken(success, error){
		// Set Callbacks
		let _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Request Data
		let _rd = { // Request Data
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			auth_key: localStorage.getItem("auth_key")
		};

		_self.instance.call("oauth.get_token", _rd, function(data){
			_self.access_token = data.access_token;
			localStorage.setItem("access_token", data.access_token);
			localStorage.setItem("auth_key", "");
			_success(data);
		}, function(error){
			console.log(error);
			_error(error);
		});
	}

	//======================================================
	//	@method			getGrants()
	//	@usage			Get OAuth Grants by Token
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	getGrants(success, error){
		// Set Callbacks
		let _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !thi_self.instances._isFunction(error))?function(){}:error; // Error Callback

		// Request Data
		let _rd = { // Request Data
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			access_token: localStorage.access_token
		};

		_self.instance.call("oauth.get_grants", _rd, function(data){
			_self.access_token = data.access_token;
			_success(data);
		}, function(error){
			console.log(error);
			_error(error);
		});
	}

	//======================================================
	//	@method			logout()
	//	@usage			Remove OAuth Token
	//	@args				(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	logout(success, error){
		var _self = this;

		// Set Callbacks
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback
		_self.instance.call("oauth.logout", {
			access_token: localStorage.access_token
		},function(data) {
			_self.access_token = '';
			localStorage.removeItem('access_token');
			_success(data);
		},function(error) {
			_error(error);
		});
	}
}

//======================================================
//	Ocugine Analytics
//======================================================
class Ocugine_Analytics{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args				none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
		this.app_flags = null; // Application Flags
		this.user_flags = null; // Latest User Flags
	}

	//======================================================
	//	@method			updateRetention()
	//	@usage			Update User Retention
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	updateRetention(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("analytics.update_retention", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			access_token: localStorage.getItem('access_token')
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			getFlags()
	//	@usage			Get Available Application Flags
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	getFlags(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("analytics.get_available_flags", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key
		}, function(data){
			_self.app_flags = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			sendUserFlag()
	//	@usage			Send User Analytics Flag
	//							(string) flag - Analytic Flag
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	sendUserFlag(flag, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback
		var _access_token = (localStorage.getItem("access_token")!="")?localStorage.getItem("access_token"):"";

		// Call API Request
		_self.instance.call("analytics.set_user_flag", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			flag: flag,
			access_token: _access_token
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			getUserFlag()
	//	@usage			Get User Analytics Flag
	//							(string) flag - Analytic Flag
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	getUserFlag(flag, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback
		var _access_token = (localStorage.getItem("access_token")!="")?localStorage.getItem("access_token"):"";

		// Call API Request
		_self.instance.call("analytics.get_user_flag", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			flag: flag,
			access_token: _access_token
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			getLatestUserFlag()
	//	@usage			Get Latest User Flags
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	getLatestUserFlag(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback
		var _access_token = (localStorage.getItem("access_token")!="")?localStorage.getItem("access_token"):"";

		// Call API Request
		_self.instance.call("analytics.get_latest_user_flags", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			access_token: _access_token
		}, function(data){
			_self.user_flags = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}
}

//======================================================
//	Ocugine Gaming
//======================================================
class Ocugine_Gaming{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
		var _self = this;

		// Create Subobjects
		this.leaderboards = {};
		this.achievements = {};
		this.missions = {};

		// Method Wrappers
		this.leaderboards.list = null;
		this.leaderboards.getList = function(success, error){
			_self._getLeaderboards(success, error);
		};
		this.leaderboards.getData = function(uid, success, error){
			_self._getLeaderboardData(uid, success, error);
		};
		this.leaderboards.getPlayersTop = function(uid, success, error){
			_self._getPlayersTop(uid, success, error);
		};
		this.leaderboards.getScores = function(uid, success, error){
			_self._getBoardScores(uid, success, error);
		};
		this.leaderboards.setScores = function(uid, scores, success, error){
			_self._setBoardScores(uid, scores, success, error);
		};
		this.achievements.list = null;
		this.achievements.getList = function(success, error){
			_self._getAchievements(success, error);
		};
		this.achievements.getData = function(uid, success, error){
			_self._getAchievementData(uid, success, error);
		};
		this.achievements.getPlayerList = function(success, error){
			_self._getPlayerAchievements(success, error);
		};
		this.achievements.unlock = function(uid, success, error){
			_self._unlockPlayerAchievement(uid, success, error);
		};
		this.missions.list = null;
		this.missions.getList = function(search = "", page = 1, success, error){
			_self._getMissions(search, page, success, error);
		};
		this.missions.getData = function(uid, success, error){
			_self._getAchievementData(uid, success, error);
		};
		this.missions.getPlayerList = function(success, error){
			_self._getPlayerMissionsList(success, error);
		};
		this.missions.addToList = function(uid, success, error){
			_self._addMissionToPlayerList(uid, success, error);
		};
		this.missions.removeFromList = function(uid, success, error){
			_self._removeMissionFromPlayerList(uid, success, error);
		};
		this.missions.setScores = function(uid, scores, success, error){
			_self._setMissionsScores(uid, scores, success, error);
		};
	}

	//======================================================
	//	@method			_getLeaderboards()
	//	@usage			Get Leaderboards
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getLeaderboards(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_leaderboards", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key
		}, function(data){
			_self.leaderboards.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getLeaderboardData()
	//	@usage			Get Leaderboard data
	//							(double) uid - Leaderboard UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getLeaderboardData(uid, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_leaderboard_info", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			uid: uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getPlayersTop()
	//	@usage			Get Players Top data for Leaderboard
	//							(double) uid - Leaderboard UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getPlayersTop(uid, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_players_top", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			uid: uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getBoardScores()
	//	@usage			Get Board Scores for current player
	//							(double) uid - Leaderboard UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getBoardScores(uid, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("gaming.get_board_scores", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				uid: uid,
				access_token: localStorage.getItem('access_token')
			}, function(data){
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to get Leaderboard Scores. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_setBoardScores()
	//	@usage			Set Board Scores for current player
	//							(double) uid - Leaderboard UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_setBoardScores(uid, scores, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("gaming.set_board_scores", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				uid: uid,
				scores: scores,
				access_token: localStorage.getItem('access_token')
			}, function(data){
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to set Leaderboard Scores. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_getAchievements()
	//	@usage			Get Achievements
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getAchievements(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_achievements", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key
		}, function(data){
			_self.achievements.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getAchievementData()
	//	@usage			Get Achievement Data
	//							(double) uid - Achievement UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getAchievementData(uid, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_achievement_info", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			uid: uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getPlayerAchievement()
	//	@usage			Get Achievements for current player
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getPlayerAchievements(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("gaming.get_player_achievements", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				access_token: localStorage.getItem('access_token')
			}, function(data){
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to get achievement state. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_unlockPlayerAchievement()
	//	@usage			Unlock Achievement for current player
	//							(double) uid - Achievement UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_unlockPlayerAchievement(uid, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("gaming.unlock_player_achievement", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				uid: uid,
				access_token: localStorage.getItem('access_token')
			}, function(data){
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to unlock achievement. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_getMissions()
	//	@usage			Get Missions List
	//							(string) search - Search by Mission Name or Desc
	//							(double) page - Page UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getMissions(search = "", page = 1, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_missions", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			search: search,
			page: page
		}, function(data){
			_self.missions.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getMissionData()
	//	@usage			Get Mission Data by UID
	//							(double) uid - Achievement UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getMissionData(uid, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_mission_info", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			uid: uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getPlayerMissionsList()
	//	@usage			Get Current Player Missions List
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getPlayerMissionsList(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("gaming.get_player_missions", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				access_token: localStorage.getItem('access_token')
			}, function(data){
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to get Player's missions list. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_addMissionToPlayerList()
	//	@usage			Add Mission from To Player List
	//							(double) uid - Mission UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_addMissionToPlayerList(uid, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("gaming.set_player_mission", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				access_token: localStorage.getItem('access_token'),
				uid: uid
			}, function(data){
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to add mission to Player's List. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_removeMissionFromPlayerList()
	//	@usage			Remove Mission from Player List
	//							(double) uid - Mission UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_removeMissionFromPlayerList(uid, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("gaming.remove_player_mission", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				access_token: localStorage.getItem('access_token'),
				uid: uid
			}, function(data){
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to remove mission from Player's List. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_setMissionsScores()
	//	@usage			Set Mission Scores for Player
	//							(double) uid - Mission UID
	//							(double) scores - Player Scores
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_setMissionsScores(uid, scores, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("gaming.set_mission_scores", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				access_token: localStorage.getItem('access_token'),
				uid: uid,
				scores: scores
			}, function(data){
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to set Mission Scores. Player is not Authenticated");
		}
	}
}

//======================================================
//	Ocugine Monetization
//======================================================
class Ocugine_Monetization{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
	}

	/* TODO: Monetization Module is coming soon */
}

//======================================================
//	Ocugine Notifications
//======================================================
class Ocugine_Notifications{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
	}

	//======================================================
	//	@method			getList()
	//	@usage			Get Notifications List
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	getList(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_notifications", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			platform: _self.instance.platform,
			access_token: localStorage.getItem('access_token')
		}, function(data){
			_self.leaderboards.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	};

	//======================================================
	//	@method			getData()
	//	@usage			Get Notification Data
	//							(double) uid - Notification UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	getData(uid, success, error){

	};

	//======================================================
	//	@method			readNotification()
	//	@usage			Read Notification Data
	//							(double) uid - Notification UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	readNotification(uid, success, error){

	};
}

//======================================================
//	Ocugine Marketing
//======================================================
class Ocugine_Marketing{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object

		// Set Objects
		this.promos = {};
		this.experiments = {};
	}

	/* TODO: Marketing Module is coming soon */
}

//======================================================
//	Ocugine Ads
//======================================================
class Ocugine_Ads{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object

		// Set Wrappers
		this.ads = {};
		this.video = {};
	}

	/* TODO: Ads Module is coming soon */
}

//======================================================
//	Ocugine Backend
//======================================================
class Ocugine_Backend{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
		var _self = this;

		// Create Subobjects
		this.storage = {};
		this.database = {};
		this.multiplayer = {};
		this.liveconfs = {};
		this.backend = {};

		// Method Wrappers
		this.storage.list = null;
		this.storage.getList = function(search = "", page = 1, success, error){
			_self._getContentList(search, page, success, error);
		};
		this.storage.getContent = function(content_id, success, error){
			_self._getContent(content_id, success, error);
		};

	}

	//======================================================
	//	@method			_getContentList()
	//	@usage			Get content List
	//	@args				(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	_getContentList(search = "", page = 1, success, error){
		// Set Callbacks
		var _self = this;
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback

		_self.instance.call("cloud.get_content_list", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			search: search,
			page: page
		}, function(data){
			_self.storage.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getContent()
	//	@usage			Get content Data
	//	@args				(double) content_id - Content ID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	_getContent(content_id, success, error){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback

		_self.instance.call("cloud.get_content", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			cid: content_id
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
class Ocugine_Reports{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args			none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
		var _self = this;

		// Create Subobjects
		this.errors = {};
		this.performance = {};

		// Create Methods Wrappers
	}

}

//======================================================
//	Ocugine Localization
//======================================================
class Ocugine_Localization{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
		this.last_languages = null; // languages
		this.last_locales = null;

		// Create Subobjects
		this.languages = {};
		this.locales = {};

		// Create Wrappers
		this.languages.getList = function(success, error){
			_self._getLanguagesList(success, error);
		};
		this.languages.getLanguage = function(code, success, error){
			_self._getLocalesList(code, success, error);
		};
		this.locales.getList = function(search = "", page = 1, success, error){
			_self._getLocalesList(success, error, search, page);
		};
		this.locales.getLocale = function(code, lang, success, error){
			_self._getLocale(code, lang, success, error);
		};
	}

	//======================================================
	//	@method			_getLanguagesList()
	//	@usage			Get Languages List
	//	@args				(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	_getLanguagesList(success, error){
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("localization.get_lang_list", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key
		}, function(data){
			_self.last_languages = data.list; // Set Languages List
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getLocalesList()
	//	@usage			Get Locales List
	//	@args				(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	_getLocalesList(success, error, search ="", page = 1){
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("localization.get_locale_list", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			search: search,
			page: page
		}, function(data){
			_self.last_locales = data.list; // Set Languages List
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getLanguage()
	//	@usage			Get Language Info
	//	@args				(string) code - Language Code
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	_getLanguage(code, success, error){
		// Check Params
		var _self = this;
		if(_self.instance._isEmpty(code) || !_self.instance._isString(code)){
			throw "Failed to get language info. Please, type language code and try again.";
		}

		// Set Callbacks
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("localization.get_lang", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			code: code
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getLocale()
	//	@usage			Get Locale Data
	//	@args				(string) code - Locale Code
	//							(string) lang - language
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	_getLocale(code, lang, success, error){
		// Check Params
		var _self = this;
		if(_self.instance._isEmpty(code) || _self.instance._isEmpty(lang) || !_self.instance._isString(code) || !_self.instance._isString(lang)){
			throw "Failed to get locale value. Please, type locale code and language.";
		}

		// Set Callbacks
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("localization.get_locale", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
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
class Ocugine_Users{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args				none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object

		var _self = this;

		// Objects
		this.policy = {};
		this.user = {};
		this.support = {};
		this.chats = {};
		this.dialogs = {};
		this.reviews = {};

		// Methods map
		this.policy.list = null;
		this.policy.getList = function(success, error){
			_self._getPolicyList(success, error);
		};
		this.policy.getInfo = function(policy_id, success, error){
			_self._getPolicyInfo(policy_id, success, error);
		};
		this.user.currentUser = null;
		this.user.getBanState = function(profile_uid, success, error){
			_self._getBanState(profile_uid, success, error);
		};
	}

	//======================================================
	//	@method			_getPolicyList()
	//	@usage			Get policy list
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	_getPolicyList(success, error){
		// Set Callbacks
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_policy_list", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
		}, function(data){
			_self.policy.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getPolicyInfo()
	//	@usage			Get policy info
	//	@args				(double) policy_id - Policy ID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//======================================================
	_getPolicyInfo(policy_id, success, error){
		// Set Callbacks
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_policy_info", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			pid: policy_id
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getBanState()
	//	@usage			Get Ban State
	//	@args				(double) profile_uid - Profile UID
	//							(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	_getBanState(profile_uid, success, error){

	}



}

//======================================================
//	Ocugine UI
//======================================================
class Ocugine_UI{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args				none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
	}

	//======================================================
	//	@method			showOAuth()
	//	@usage			Show OAuth Window and process auth for
	//							this application
	//	@args				(method) success - Success Callback
	//							(method) error - Error Callback
	//	@returns		none
	//======================================================
	showOAuth(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Get Link
		this.instance.module("auth").getLink("all", function(data){
			let wind; wind = window.open(data.auth_url); // Window
			let timer = setInterval(function() { // Interval for Checking
				if(wind.closed) { // Window Closed
					clearInterval(timer); // Clear Timer
					_self.instance.module("auth").getToken(function(){
						_success(); // Done
					}, function(err){
						_error(err);
					});
				}
			}, 1000);
		}, function(err){
			_error(err); // Throw Error
		});
	}

	//======================================================
	//	@method			showProfile()
	//	@usage			Show Profile Page
	//	@args				(method) closed - Closed Callback
	//	@returns		none
	//======================================================
	showProfile(closed){
		var _self = this;
		let _closed = (this._isEmpty(closed) || !this._isFunction(closed))?function(){}:closed; // Success Callback
		let wind; wind = window.open(_self.instance._getServerUrl()+'profile/'); // Window


		// Set timer
		let timer = setInterval(function() { // Interval for Checking
			if(wind.closed) { // Window Closed
				clearInterval(timer); // Clear Timer
				_closed();
			}
		}, 1000);
	}


}

//======================================================
//	Ocugine Utils
//======================================================
class Ocugine_Utils{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//	@args				none
	//	@returns		none
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
	}

	//======================================================
	//	@method			getAPIState()
	//	@usage			Get Current API State
	//	@args				(function) success - Done Callback
	//							(function) error - Error Callback
	//======================================================
	getAPIState(success, error){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("state.get_state", {}, function(data){
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
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("state.init", {}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			testAPPConnection()
	//	@usage			Test Application Connection
	//	@args				(function) success - Done Callback
	//							(function) error - Error Callback
	//======================================================
	testAPPConnection(success, error){
		// Set Callbacks
		var _self = this; // Link
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback


		// Call API Request
		_self.instance.call("connection.init", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key
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
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("api_settings.get_settings", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}
}

//======================================================
//	Ocugine SDK Classes Mapping
//======================================================
const OcugineMapping = {
	"auth": Ocugine_Auth, // Ocugine Auth
	"analytics": Ocugine_Analytics, // Analytics
	"gaming": Ocugine_Gaming, // Gaming Services
	"monetization": Ocugine_Monetization, // Monetization
	"notify": Ocugine_Notifications, // Notifications
	"marketing": Ocugine_Marketing, // Marketing
	"ads": Ocugine_Ads, // Advertising
	"backend": Ocugine_Backend, // Backend
	"reports": Ocugine_Reports, // Reports
	"localization": Ocugine_Localization, // Localization
	"users": Ocugine_Users, // Ocugine Users
	"ui": Ocugine_UI, // Ocugine UI
	"utils": Ocugine_Utils	// Utils Class
};

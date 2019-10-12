//======================================================
//	Ocugine JavaScript SDK
//	Sofware Development Kit developed specially for
//  Ocugine Services. With this library you can
//  use all features of Ocugine Services using JS
//
//	@name           Ocugine SDK
//  @developer      Ocugine Platform
//  @version        0.4.1
//  @build          412
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
	//======================================================
	constructor(app_settings = null, sdk_settings = {}, debug = false){
		// Check Variables Values
		var _self = this;
		if(_self._isEmpty(app_settings)){
			throw "Failed to initialize Ocugine SDK. Please, check SDK Application Settings.";
		}

		// Set Base Settings
		this.application = app_settings; 				// Set Application Settings
		this.settings = sdk_settings; 					// Set SDK settings
		this.debug = (debug)?true:false;				// Set Debug Params
		this.platform = (this._isEmpty(this.settings.platform) || !this._isString(this.settings.platform))?"web":this.settings.platform;  // SDK Platform

		// Set Another SDK Params
		this.is_https = true;										// HTTP/HTTPs Mode
		this.server_url = "cp.ocugine.pro";			// API Server URL
		this.server_gateway = "api";						// API Server Gateway

		// Set Utils
		this.modules = {};								// Modules

		// Send First Open flag and Session Start
		if(!this._isEmpty(this.settings.auto_analytics) && this._isBoolean(this.settings.auto_analytics) && this.settings.auto_analytics){
			_self.module("Analytics").sendUserFlag("first_open");
			_self.module("Analytics").sendUserFlag("session_update");
			_self.module("Analytics").updateRetention();
		}

		// Auto Reports
		if(!this._isEmpty(this.settings.auto_reports) && this._isBoolean(this.settings.auto_reports) && this.settings.auto_reports){
			// Errors Handling
			window.onerror = function(msg, url, lineNo, columnNo, error) {
				var _name = 'JS SDK: Auto Report';
				var _body = msg;
				var _code = 'line: '+lineNo;
				var _critical = true;
			  _self.module("reports").errors.sendReport(_name, _body, _code, _critical, function(){
				}, function(){
				});
			};
		}
	}

	//======================================================
	//	@method			call()
	//	@usage			Call API Method
	//	@args			(string) method - API Method. Ex: users.get_list
	//					(object) data - Data to send. Ex: { param1: val1, param2: val2 }
	//					(function) success - Done Callback
	//					(function) error - Error Callback
	//======================================================
	call(method, data = {}, success  = function(){}, error  = function(){}){
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
		return (variable === undefined || variable === null)?true:false;
		//return false;
	}
}

//======================================================
//	Ocugine Auth
//======================================================
class Ocugine_Auth{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
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
	//	@args			(string/array) grants - OAuth grants
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	getLink(grants = "all", success = function(){}, error = function(){}){
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
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	getToken(success = function(){}, error = function(){}){
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
			_self.access_token = "";
			localStorage.setItem("access_token", "");
			localStorage.setItem("auth_key", "");
			console.log(error);
			_error(error);
		});
	}

	//======================================================
	//	@method			getGrants()
	//	@usage			Get OAuth Grants by Token
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	getGrants(success = function(){}, error = function(){}){
		// Set Callbacks
		let _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

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
			_self.access_token = "";
			localStorage.setItem("access_token", "");
			localStorage.setItem("auth_key", "");
			console.log(error);
			_error(error);
		});
	}

	//======================================================
	//	@method			logout()
	//	@usage			Remove OAuth Token
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	logout(success = function(){}, error = function(){}){
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
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getLeaderboards(success = function(){}, error = function(){}){
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
	//					(double) uid - Leaderboard UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getLeaderboardData(uid, success = function(){}, error = function(){}){
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
	//					(double) uid - Leaderboard UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getPlayersTop(uid, success = function(){}, error = function(){}){
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
	//					(double) uid - Leaderboard UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getBoardScores(uid, success = function(){}, error = function(){}){
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
	//					(double) uid - Leaderboard UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_setBoardScores(uid, scores, success = function(){}, error = function(){}){
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
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getAchievements(success = function(){}, error = function(){}){
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
	//					(double) uid - Achievement UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getAchievementData(uid, success = function(){}, error = function(){}){
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
	//	@method			_getPlayerAchievements()
	//	@usage			Get Achievements for current player
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getPlayerAchievements(success = function(){}, error = function(){}){
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
	//					(double) uid - Achievement UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_unlockPlayerAchievement(uid, success = function(){}, error = function(){}){
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
				if(_self.instance.settings.show_ui) _self.instance.module("UI").showAchievement(uid);
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
	//					(string) search - Search by Mission Name or Desc
	//					(double) page - Page UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getMissions(search = "", page = 1, success = function(){}, error = function(){}){
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
	//					(double) uid - Achievement UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getMissionData(uid, success = function(){}, error = function(){}){
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
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getPlayerMissionsList(success = function(){}, error = function(){}){
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
	//					(double) uid - Mission UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_addMissionToPlayerList(uid, success = function(){}, error = function(){}){
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
				if(_self.instance.settings.show_ui) _self.instance.module("UI").showNewMission(uid);
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
	//					(double) uid - Mission UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_removeMissionFromPlayerList(uid, success = function(){}, error = function(){}){
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
	//					(double) uid - Mission UID
	//					(double) scores - Player Scores
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_setMissionsScores(uid, scores, success = function(){}, error = function(){}){
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
//	(In Development)
//======================================================
class Ocugine_Monetization{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
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
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
	}

	//======================================================
	//	@method			getList()
	//	@usage			Get Notifications List
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	getList(success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_notifications", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			platform: 8,
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
	//					(double) uid - Notification UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	getData(uid, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.get_notification_data", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			uid: uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	};

	//======================================================
	//	@method			readNotification()
	//	@usage			Read Notification Data
	//					(double) uid - Notification UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	readNotification(uid, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("gaming.read_notification", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			uid: uid,
			access_token: localStorage.getItem('access_token')
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	};
}

//======================================================
//	Ocugine Marketing
//	(In Development)
//======================================================
class Ocugine_Marketing{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
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
//	(In Development)
//======================================================
class Ocugine_Ads{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
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
//	(Beta Version)
//======================================================
class Ocugine_Backend{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
		var _self = this;

		// Create Subobjects
		this.storage = {};
		this.database = {};
		this.saves = {};
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
		this.liveconfs.list = null;
		this.liveconfs.getAllConfigs = function(success, error){
			_self._getAllConfigs(success, error);
		};
		this.liveconfs.getConfig = function(uid, success, error){
			_self._getConfig(uid, success, error);
		};
		this.saves.list = null;
		this.saves.getList = function(success, error){
			_self._getAllSaves(success, error);
		};
		this.saves.getData = function(uid, success, error){
			_self._getSaveData(uid, success, error);
		};
		this.saves.create = function(data, success, error){
			_self._setSaveData(-1, data, success, error);
		};
		this.saves.update = function(uid, data, success, error){
			_self._setSaveData(uid, data, success, error);
		};
		this.saves.remove = function(uid, success, error){
			_self._removeSaveData(uid, success, error);
		};
	}

	//======================================================
	//	@method			_getContentList()
	//	@usage			Get content List
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getContentList(search = "", page = 1, success  = function(){}, error  = function(){}){
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
	//	@args			(double) content_id - Content ID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getContent(content_id, success  = function(){}, error  = function(){}){
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

	//======================================================
	//	@method			_getAllConfigs()
	//	@usage			Get all live configs
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getAllConfigs(success  = function(){}, error  = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback

		_self.instance.call("cloud.get_all_configs", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key
		}, function(data){
			_self.liveconfs.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getConfig()
	//	@usage			Get Live Configuration by UID
	//	@args			(double) content_id - Content ID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getConfig(uid, success  = function(){}, error  = function(){}){
		// Set Callbacks
		let _success = (this._isEmpty(success) || !this._isFunction(success))?function(){}:success; // Success Callback
		let _error = (this._isEmpty(error) || !this._isFunction(error))?function(){}:error; // Error Callback

		_self.instance.call("cloud.get_config", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			uid: uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getAllSaves()
	//	@usage			Get All Player Saves
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getAllSaves(success  = function(){}, error  = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("cloud.get_player_saves", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				access_token: localStorage.getItem('access_token')
			}, function(data){
				_self.saves.list = data.list;
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to get player saves list. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_getSaveData()
	//	@usage			Get Player Save Data
	//	@args			(double) uid - Save UID
	// 					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getSaveData(uid, success  = function(){}, error  = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("cloud.get_save_data", {
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
			_error("Failed to get player save data. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_setSaveData()
	//	@usage			Set Player Save Data
	//	@args			(double) uid - Save UID
	//					(string) data - Save Data
	// 					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_setSaveData(uid, data, success  = function(){}, error  = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("cloud.set_save_data", {
				app_id: _self.instance.application.app_id,
				app_key: _self.instance.application.app_key,
				uid: uid,
				data: data,
				access_token: localStorage.getItem('access_token')
			}, function(data){
				_success(data);
			}, function(error){
				_error(error);
			});
		}else{
			_error("Failed to save player data. Player is not Authenticated");
		}
	}

	//======================================================
	//	@method			_removeSaveData()
	//	@usage			Remove Player Save Data
	//	@args			(double) uid - Save UID
	// 					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_removeSaveData(uid, success  = function(){}, error  = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Check Access Token
		if(localStorage.getItem('access_token')!=""){
			// Call API Request
			_self.instance.call("cloud.remove_save_data", {
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
			_error("Failed to remove player save data. Player is not Authenticated");
		}
	}

	/* TODO: Other Backend Methods */
}

//======================================================
//	Ocugine Reports
//======================================================
class Ocugine_Reports{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
		var _self = this;

		// Create Subobjects
		this.errors = {};
		this.performance = {};

		// Create Methods Wrappers
		this.errors.sendReport = function(name, body, code, critical, success, error){
			_self._sendErrorReport(name, body, code, critical, success, error);
		};
		this.errors.getReport = function(uid, success, error){
			_self._sendErrorReport(uid, success, error);
		}
		this.performance.sendReport = function(name, body, success, error){
			_self._sendPerformanceReport(name,body,success,error);
		};
		this.performance.getReport = function(uid, success, error){
			_self._getPerformanceReport(uid, success, error);
		};
	}

	//======================================================
	//	@method			_sendErrorReport()
	//	@usage			Send Error Report
	//	@args			(string) name - Report Name
	//					(string) body - Report Body
	//					(string) code - Short Error Code
	//					(bool) critical - Critical State
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_sendErrorReport(name, body, code, critical = 1, success  = function(){}, error  = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback
		let _critical = (!critical)?0:1;

		_self.instance.call("reports.send_error", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			name: name,
			body: body,
			code: code,
			critical: _critical,
			platform: _self.instance.platform
		}, function(data){
			if(_self.instance.settings.show_ui) _self.instance.module("UI").showError("Application Error", body);
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getErrorReport()
	//	@usage			Get Error Report
	//	@args			(double) uid - Report ID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getErrorReport(uid, success  = function(){}, error  = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		_self.instance.call("reports.get_error", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			uid: uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_sendPerformanceReport()
	//	@usage			Send Performance Report
	//	@args			(string) name - Report Name
	//					(string) body - Report Body
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_sendPerformanceReport(name, body, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		_self.instance.call("reports.send_performance", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			name: name,
			body: body
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getPerformanceReport()
	//	@usage			Get Performance Report
	//	@args			(double) uid - Report ID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getPerformanceReport(uid, success = function(){}, error  = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		_self.instance.call("reports.get_performance", {
			app_id: this.instance.application.app_id,
			app_key: this.instance.application.app_key,
			uid: uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
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
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getLanguagesList(success = function(){}, error = function(){}){
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
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getLocalesList(search ="", page = 1, success = function(){}, error = function(){}){
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
	//	@args			(string) code - Language Code
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getLanguage(code, success = function(){}, error  = function(){}){
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
	//	@args			(string) code - Locale Code
	//					(string) lang - language
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getLocale(code, lang, success  = function(){}, error  = function(){}){
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
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object

		var _self = this;

		// Objects
		this.policy = {};
		this.users = {};
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
		this.users.currentUser = null;
		this.users.list = null;
		this.users.groups = null;
		this.users.fields = null;
		this.users.getBanState = function(profile_uid, success, error){
			_self._getBanState(profile_uid, success, error);
		};
		this.users.getCurrentUser = function(success, error){
			_self._getCurrentUser(success, error);
		};
		this.users.getByUID = function(uid, success, error){
			_self._getUserByUID(uid, success, error);
		};
		this.users.getList = function(page = 1, success, error){
			_self._getUsersList(page, success, error);
		};
		this.users.findUser = function(search = "", page = 1, success, error){
			_self._findUser(search,page,success,error);
		};
		this.users.getGroups = function(success, error){
			_self._getGroupsList(success, error);
		};
		this.users.getGroup = function(uid, success, error){
			_self._getGroupByUID(uid, success, error);
		};
		this.users.setUserGroup = function(profile_uid, group_id, success, error){
			_self._setGroup(profile_uid, group_id, success, error);
		};
		this.users.getCustomFields = function(search = "", page = 1, success, error){
			_self._getCustomFields(search, page, success, error);
		};
		this.users.setCustomField = function(profile_uid, field_id, value, success, error){
			_self._setCustomField(profile_uid, field_id, value, success, error);
		};
		this.support.categories = null;
		this.support.current_category = null;
		this.support.topics = null;
		this.support.current_topic = null;
		this.support.messages = null;
		this.support.getCategories = function(success, error){
			_self._getCategories(success, error);
		};
		this.support.getTopics = function(category_id, search = "", page = 1, success, error){
			_self._getTopics(category_id, search, page, success, error);
		};
		this.support.getMessages = function(topic_id, search = "", page = 1, success, error){
			_self._getSupportMessages(topic_id, search, page, success, error);
		};
		this.support.createTopic = function(category_id, title, body, success, error){
			_self._createTopic(category_id, title, body, success, error);
		};
		this.support.updateTopic = function(topic_id, category_id, title, body, success, error){
			_self._updateTopic(topic_id, category_id, title, body, success, error);
		};
		this.support.closeTopic = function(topic_id, success, error){
			_self._closeTopic(topic_id, success, error);
		};
		this.support.sendMessage = function(topic_id, message, success, error){
			_self._sendSupportMessage(topic_id, message, success, error);
		};
		this.chats.rooms = null;
		this.chats.current_room = null;
		this.chats.messages = null;
		this.chats.getRooms = function(success, error){
			_self._getRooms(success, error);
		};
		this.chats.getMessages = function(room_id, success, error){
			_self._getChatMessages(room_id, success, error);
		};
		this.chats.sendMessage = function(room_id, message, success, error){
			_self._sendChatMessage(room_id, message, success, error);
		};
		this.reviews.list = null;
		this.reviews.getList = function(search = "", page = 1, success, error){
			_self._getReviews(search, page, success, error);
		};
		this.reviews.sendReview = function(stars, message, success, error){
			_self._sendReview(stars, message, success, error);
		};
	}

	//======================================================
	//	@method			_getPolicyList()
	//	@usage			Get policy list
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getPolicyList(success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
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
	//	@args			(double) policy_id - Policy ID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getPolicyInfo(policy_id, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
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
	//	@args			(double) profile_uid - Profile UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getBanState(profile_uid, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_ban_state", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			profile_uid: profile_uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getCurrentUser()
	//	@usage			Get Current User Data by Access Token
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getCurrentUser(success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_user_data", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			access_token: localStorage.getItem('access_token')
		}, function(data){
			_self.users.currentUser = data;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getUserByUID()
	//	@usage			Get User by UID
	//	@args			(double) uid - Profile UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getUserByUID(uid, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_user_by_id", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			profile_uid: profile_uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getUsersList()
	//	@usage			Get Users List
	//	@args			(double) page - Pagination Index
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getUsersList(page, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_users_list", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			page: page
		}, function(data){
			_self.users.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_findUser()
	//	@usage			Find User by Name
	//	@args			(string) search - Search Query
	//					(double) page - Pagination Index
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_findUser(search = "", page = 1, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.find_user", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			page: page,
			search: search
		}, function(data){
			_self.users.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getGroupsList()
	//	@usage			Get Users Groups for this application
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getGroupsList(success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_group_list", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key
		}, function(data){
			_self.users.groups = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getGroupByUID()
	//	@usage			Get Group by UID
	//	@args			(double) uid - Group ID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getGroupByUID(uid, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_group_data", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			group_id: uid
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_setGroup()
	//	@usage			Set Group by Group UID for Profile UID
	//	@args			(double) profile_uid - Profile ID
	//					(double) group_id - Group ID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_setGroup(profile_uid, group_id, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.set_group", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			profile_uid: profile_uid,
			group_id: group_id
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getCustomFields()
	//	@usage			Get Users Custom Fields for this app
	//	@args			(string) search - Search Query
	//					(page) page - Pagination Index
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getCustomFields(search = "", page = 1, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_fields", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			search: search,
			page: page
		}, function(data){
			_self.users.fields = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_setCustomField()
	//	@usage			Set Custom Field value for user
	//	@args			(profile_uid) - Profile UID
	//					(field_id) - Field UID in the system
	//					(value) - Field Value
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_setCustomField(profile_uid, field_id, value = "", success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.set_field", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			profile_uid: profile_uid,
			field_id: field_id,
			value: value
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getCategories()
	//	@usage			Get Support Categories
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getCategories(success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_support_categories", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key
		}, function(data){
			_self.support.categories = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getTopics()
	//	@usage			Get Topics List by category UID
	//	@args			(double) category_id - Category UID
	//					(string) search - Search Query
	//					(page) page - Pagination Index
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getTopics(category_id, search = "", page = 1, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_support_topics", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			category_uid: category_id,
			search: search,
			page: page
		}, function(data){
			_self.support.current_category = category_id;
			_self.support.topics = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getSupportMessages()
	//	@usage			Get Topic Messages List
	//	@args			(double) topic_id - Topic ID
	//					(string) search - Search Query
	//					(page) page - Pagination Index
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getSupportMessages(topic_id, search = "", page = 1, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_support_messages", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			topic_uid: topic_id,
			search: search,
			page: page
		}, function(data){
			_self.support.current_topic = topic_id;
			_self.support.messages = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_createTopic()
	//	@usage			Create Support Topic
	//	@args			(double) category_id - Category UID
	//					(string) title - Topic Title
	//					(string) body - Topic Body
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_createTopic(category_id, title, body, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.create_topic", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			category_uid: category_id,
			name: title,
			body: body,
			access_token: localStorage.getItem('access_token')
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_updateTopic()
	//	@usage			Update Support Topic
	//	@args			(double) topic_id - Topic ID
	//					(double) category_id - Category UID
	//					(string) title - Topic Title
	//					(string) body - Topic Body
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_updateTopic(topic_id, category_id, title, body, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.update_topic", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			topic_uid: topic_id,
			category_uid: category_id,
			name: title,
			body: body,
			access_token: localStorage.getItem('access_token')
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_closeTopic()
	//	@usage			Close Support Topic
	//	@args			(double) topic_id - Topic ID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_closeTopic(topic_id, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.close_topic", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			topic_uid: topic_id,
			access_token: localStorage.getItem('access_token')
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_sendSupportMessage()
	//	@usage			Send message to the topic
	//	@args			(double) topic_id - Topic ID
	//					(string) message - message text
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_sendSupportMessage(topic_id, message, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.send_support_message", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			topic_uid: topic_id,
			message: message,
			access_token: localStorage.getItem('access_token')
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getRooms()
	//	@usage			Get Chat Rooms
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getRooms(success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_available_rooms", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key
		}, function(data){
			_self.chats.rooms = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getChatMessages()
	//	@usage			Get Chat Messages by Room UID
	//	@args			(double) room_id - Room UID
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getChatMessages(room_id, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_chat_messages", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			room_id: room_id
		}, function(data){
			_self.chats.current_room = room_id;
			_self.chats.messages = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_sendChatMessage()
	//	@usage			Send message to the Chat Room
	//	@args			(double) room_id - Room UID
	//					(string) message - Message Text
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_sendChatMessage(room_id, message, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.send_cmessage", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			room_id: room_id,
			message: message,
			access_token: localStorage.getItem('access_token')
		}, function(data){
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_getReviews()
	//	@usage			Get Users Reviews for this application
	//	@args			(string) search - Search Query
	//					(page) page - Pagination Index
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	_getReviews(search = "", page = 1, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.get_reviews", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			search: search,
			page: page
		}, function(data){
			_self.reviews.list = data.list;
			_success(data);
		}, function(error){
			_error(error);
		});
	}

	//======================================================
	//	@method			_sendReview()
	//	@usage			Send Review to this app
	//	@args			(int) stars - Stars (rating) from 1 to 5
	//					(string) message - Review Text
	//					(method) success - Success Callback
	//					(method) error - Error Callback
	//	@returns		none
	//======================================================
	_sendReview(stars, message, success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Call API Request
		_self.instance.call("users.send_review", {
			app_id: _self.instance.application.app_id,
			app_key: _self.instance.application.app_key,
			stars: stars,
			message: message,
			access_token: localStorage.getItem('access_token')
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
//	WARNING! Ocugine UI needs jQuery Library
//======================================================
class Ocugine_UI{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
	}

	//======================================================
	//	@method			showOAuth()
	//	@usage			Show OAuth Window and process auth for
	//							this application
	//	@args			(method) success - Success Callback
	//					(method) error - Error Callback
	//======================================================
	showOAuth(success = function(){}, error = function(){}){
		// Set Callbacks
		var _self = this;
		let _success = (_self.instance._isEmpty(success) || !_self.instance._isFunction(success))?function(){}:success; // Success Callback
		let _error = (_self.instance._isEmpty(error) || !_self.instance._isFunction(error))?function(){}:error; // Error Callback

		// Get Link
		if(this.instance.module("auth").access_token==""){
			this.instance.module("auth").getLink("all", function(data){
				var left = (screen.width - 800) / 2;
				var top = (screen.height - 600) / 4;
				let wind; wind = window.open(data.auth_url, "targetWindow", 'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes,width=800,height=600, top=' + top + ', left=' + left); // Window
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
		}else{
			_self.instance.module("auth").getGrants(function(){
				_success(); // Done
			}, function(err){
				_self.showOAuth(_success, _error);
			});
		}
	}

	//======================================================
	//	@method			openProfile()
	//	@usage			Show Profile Page in the Browser
	//	@args			(method) closed - Closed Callback
	//======================================================
	openProfile(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		var left = (screen.width - 800) / 2;
		var top = (screen.height - 600) / 4;
		let wind; wind = window.open("https://"+_self.instance.server_url+"/profile/", "targetWindow", 'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes,width=800,height=600, top=' + top + ', left=' + left); // Window
		let timer = setInterval(function() { // Interval for Checking
			if(wind.closed) { // Window Closed
				clearInterval(timer); // Clear Timer
				_closed(); // Send Closed Event
			}
		}, 1000);
	}

	//======================================================
	//	@method			openProfileUI()
	//	@usage			Show Profile UI
	//	@args			(method) closed - Closed Callback
	//======================================================
	openProfileUI(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		/* TODO: Profile Native UI */
	}

	//======================================================
	//	@method			openAppPage()
	//	@usage			Show Applications Page
	//	@args			(method) closed - Closed Callback
	//======================================================
	openAppPage(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		var left = (screen.width - 800) / 2;
		var top = (screen.height - 600) / 4;
		let wind; wind = window.open("https://"+_self.instance.server_url+"/app_page/"+_self.instance.application.app_id+"/"); // Window
		let timer = setInterval(function() { // Interval for Checking
			if(wind.closed) { // Window Closed
				clearInterval(timer); // Clear Timer
				_closed(); // Send Closed Event
			}
		}, 1000);
	}

	//======================================================
	//	@method			openSupportPage()
	//	@usage			Show Support Page in the Browser
	//	@args			(method) closed - Closed Callback
	//======================================================
	openSupportPage(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		var left = (screen.width - 800) / 2;
		var top = (screen.height - 600) / 4;
		let wind; wind = window.open("https://"+_self.instance.server_url+"/support/"+_self.instance.application.app_id+"/"); // Window
		let timer = setInterval(function() { // Interval for Checking
			if(wind.closed) { // Window Closed
				clearInterval(timer); // Clear Timer
				_closed(); // Send Closed Event
			}
		}, 1000);
	}

	//======================================================
	//	@method			openSupportUI()
	//	@usage			Show Support UI
	//	@args			(method) closed - Closed Callback
	//======================================================
	openSupportUI(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		/* TODO: Support UI */
	}

	//======================================================
	//	@method			openChatsUI()
	//	@usage			Show Chats UI
	//	@args			(method) closed - Closed Callback
	//======================================================
	openChatsUI(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		/* TODO: Chat UI */
	}

	//======================================================
	//	@method			openReviewsUI()
	//	@usage			Show Reviews UI
	//	@args			(method) closed - Closed Callback
	//======================================================
	openReviewsUI(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		/* TODO: Reviews UI */
	}

	//======================================================
	//	@method			openAchievementsUI()
	//	@usage			Show Achievements UI
	//	@args			(method) closed - Closed Callback
	//======================================================
	openAchievementsUI(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		/* TODO: Achievements UI */
	}

	//======================================================
	//	@method			openMissionsUI()
	//	@usage			Show Missions UI
	//	@args			(method) closed - Closed Callback
	//======================================================
	openMissionsUI(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		/* TODO: Missions UI */
	}

	//======================================================
	//	@method			openLeaderboardsUI()
	//	@usage			Show Leaderboards UI
	//	@args			(method) closed - Closed Callback
	//======================================================
	openLeaderboardsUI(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		/* TODO: Leaderboards UI */
	}

	//======================================================
	//	@method			openNotificationsUI()
	//	@usage			Show Notifications UI
	//	@args			(method) closed - Closed Callback
	//======================================================
	openNotificationsUI(closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback

		/* TODO: Notifications UI */
	}

	//======================================================
	//	@method			showError()
	//	@usage			Show Error Notification
	//	@args			(string) title - Title
	//					(string) body - Body
	//					(string) postion - (top-left, top-right, bottom-left, bottom-right)
	//					(float) timeout - timeout in ms
	//					(method) closed - Closed Callback
	//======================================================
	showError(title, body, position = "bottom-left", timeout = 5000, closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback
		let _position = (_self.instance._isEmpty(position))?"bottom-left":position;
		if(!_self.instance._isString(_position) || (_position!='top-left' && _position!='top-right' && _position!='bottom-left' && _position!='bottom-right')){
			throw "Failed to show error toast. The position argument is wrong.";
		}
		let _timeout = (_self.instance._isEmpty(timeout) || !_self.instance._isNumber(timeout))?5000:timeout;

		// Generate Container
		var _cont = '<div class="inner"><div class="toast-icon error"><i class="material-icons">priority_high</i></div><div class="toast-media"><h2 class="toast-headline">'+title+'</h2><p class="toast-body">'+body+'</p><p class="toast-hint">A report was sent to the game developer.</p></div></div>';

		// Insert Container
		var _tcont = document.getElementById('ocugine-error'); // Get Other Containers
		if(_tcont!=null) _tcont.remove(); // Remove Element
		_tcont = document.createElement("div");
		_tcont.id = "ocugine-error";
		_tcont.classList.add("ocugine-toast");
		_tcont.classList.add(_position);
		_tcont.classList.add("default-font");
		_tcont.innerHTML = _cont;
		document.body.appendChild(_tcont);

		// Set Timeout
		var _tm = setTimeout(function(){
			_tcont.style.display = "none";
			_tcont.remove();
			_closed(); // Closed
		}, _timeout);

		// Toast Click
		_tcont.onclick = function(){
			_tcont.style.display = "none";
			_tcont.remove();
			_closed(); // Closed
		};
	}

	//======================================================
	//	@method			showAchievement()
	//	@usage			Show Achievement Toast
	//	@args			(double) uid - Achievement UID
	//					(string) postion - (top-left, top-right, bottom-left, bottom-right)
	//					(float) timeout - timeout in ms
	//					(method) closed - Closed Callback
	//======================================================
	showAchievement(uid, position = "bottom-left", timeout = 10000, closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback
		let _position = (_self.instance._isEmpty(position))?"bottom-left":position;
		if(!_self.instance._isString(_position) || (_position!='top-left' && _position!='top-right' && _position!='bottom-left' && _position!='bottom-right')){
			throw "Failed to show achievement toast. The position argument is wrong.";
		}
		let _timeout = (_self.instance._isEmpty(timeout) || !_self.instance._isNumber(timeout))?10000:timeout;

		// Get Achievement Content
		_self.instance.module("gaming").achievements.getData(uid, function(element){
			// Generate Container
			var _cont = '<div class="inner"><div class="toast-icon imaged" style="background-image: url(\''+element.image+'\');"></div><div class="toast-media"><h2 class="toast-headline">'+element.name+'</h2><p class="toast-body">'+element.desc+'</p><p class="toast-hint">New achievement unlocked!</p></div></div>';

			// Insert Container
			var _tcont = document.getElementById('ocugine-achievement'); // Get Other Containers
			if(_tcont!=null) _tcont.remove(); // Remove Element
			_tcont = document.createElement("div");
			_tcont.id = "ocugine-achievement";
			_tcont.classList.add("ocugine-toast");
			_tcont.classList.add(_position);
			_tcont.classList.add("default-font");
			_tcont.innerHTML = _cont;
			document.body.appendChild(_tcont);

			// Set Timeout
			var _tm = setTimeout(function(){
				_tcont.style.display = "none";
				_tcont.remove();
				_closed(); // Closed
			}, _timeout);

			// Toast Click
			_tcont.onclick = function(){
				_tcont.style.display = "none";
				_tcont.remove();
				_self.openAchievements();
				_closed(); // Closed
			};
		});
	}

	//======================================================
	//	@method			showNewMission()
	//	@usage			Show New Mission Toast
	//	@args			(double) uid - Mission UID
	//					(string) postion - (top-left, top-right, bottom-left, bottom-right)
	//					(float) timeout - timeout in ms
	//					(method) closed - Closed Callback
	//======================================================
	showNewMission(uid, position = "bottom-left", timeout = 10000, closed = function(){}){
		var _self = this;
		let _closed = (_self.instance._isEmpty(closed) || !_self.instance._isFunction(closed))?function(){}:closed; // Closed Callback
		let _position = (_self.instance._isEmpty(position))?"bottom-left":position;
		if(!_self.instance._isString(_position) || (_position!='top-left' && _position!='top-right' && _position!='bottom-left' && _position!='bottom-right')){
			throw "Failed to show mission toast. The position argument is wrong.";
		}
		let _timeout = (_self.instance._isEmpty(timeout) || !_self.instance._isNumber(timeout))?10000:timeout;

		// Get Achievement Content
		_self.instance.module("gaming").missions.getData(uid, function(element){
			// Generate Container
			var _cont = '<div class="inner"><div class="toast-icon imaged" style="background-image: url(\''+element.image+'\');"></div><div class="toast-media"><h2 class="toast-headline">'+element.name+'</h2><p class="toast-body">'+element.desc+'</p><p class="toast-hint">New mission unlocked!</p></div></div>';

			// Insert Container
			var _tcont = document.getElementById('ocugine-mission'); // Get Other Containers
			if(_tcont!=null) _tcont.remove(); // Remove Element
			_tcont = document.createElement("div");
			_tcont.id = "ocugine-mission";
			_tcont.classList.add("ocugine-toast");
			_tcont.classList.add(_position);
			_tcont.classList.add("default-font");
			_tcont.innerHTML = _cont;
			document.body.appendChild(_tcont);

			// Set Timeout
			var _tm = setTimeout(function(){
				_tcont.style.display = "none";
				_tcont.remove();
				_closed(); // Closed
			}, _timeout);

			// Toast Click
			_tcont.onclick = function(){
				_tcont.style.display = "none";
				_tcont.remove();
				_self.openMissions();
				_closed(); // Closed
			};
		});
	}
}

//======================================================
//	Ocugine Utils
//======================================================
class Ocugine_Utils{
	//======================================================
	//	@method			constructor()
	//	@usage			Class Constructor
	//======================================================
	constructor(parent){
		this.instance = parent; // Set Parent Object
	}

	//======================================================
	//	@method			getAPIState()
	//	@usage			Get Current API State
	//	@args			(function) success - Done Callback
	//					(function) error - Error Callback
	//======================================================
	getAPIState(success = function(){}, error = function(){}){
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
	//	@args			(function) success - Done Callback
	//					(function) error - Error Callback
	//======================================================
	getAPIInfo(success = function(){}, error = function(){}){
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
	//	@args			(function) success - Done Callback
	//					(function) error - Error Callback
	//======================================================
	testAPPConnection(success = function(){}, error = function(){}){
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
	//	@args			(function) success - Done Callback
	//					(function) error - Error Callback
	//======================================================
	get_settings(success = function(){}, error = function(){}){
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

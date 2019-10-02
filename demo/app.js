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
//======================================================
//	Preloader Asset
//======================================================
;(function(root,factory){if(typeof define==='function'&&define.amd){define(factory);}else if(typeof exports==='object'){module.exports=factory();}else{root.NProgress=factory();}})(this,function(){var NProgress={};NProgress.version='0.2.0';var Settings=NProgress.settings={minimum:0.08,easing:'ease',positionUsing:'',speed:200,trickle:true,trickleRate:0.02,trickleSpeed:800,showSpinner:true,barSelector:'[role="bar"]',spinnerSelector:'[role="spinner"]',parent:'body',template:'<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'};NProgress.configure=function(options){var key,value;for(key in options){value=options[key];if(value!==undefined&&options.hasOwnProperty(key))Settings[key]=value;}
return this;};NProgress.status=null;NProgress.set=function(n){var started=NProgress.isStarted();n=clamp(n,Settings.minimum,1);NProgress.status=(n===1?null:n);var progress=NProgress.render(!started),bar=progress.querySelector(Settings.barSelector),speed=Settings.speed,ease=Settings.easing;progress.offsetWidth;queue(function(next){if(Settings.positionUsing==='')Settings.positionUsing=NProgress.getPositioningCSS();css(bar,barPositionCSS(n,speed,ease));if(n===1){css(progress,{transition:'none',opacity:1});progress.offsetWidth;setTimeout(function(){css(progress,{transition:'all '+speed+'ms linear',opacity:0});setTimeout(function(){NProgress.remove();next();},speed);},speed);}else{setTimeout(next,speed);}});return this;};NProgress.isStarted=function(){return typeof NProgress.status==='number';};NProgress.start=function(){if(!NProgress.status)NProgress.set(0);var work=function(){setTimeout(function(){if(!NProgress.status)return;NProgress.trickle();work();},Settings.trickleSpeed);};if(Settings.trickle)work();return this;};NProgress.done=function(force){if(!force&&!NProgress.status)return this;return NProgress.inc(0.3+0.5*Math.random()).set(1);};NProgress.inc=function(amount){var n=NProgress.status;if(!n){return NProgress.start();}else{if(typeof amount!=='number'){amount=(1-n)*clamp(Math.random()*n,0.1,0.95);}
n=clamp(n+amount,0,0.994);return NProgress.set(n);}};NProgress.trickle=function(){return NProgress.inc(Math.random()*Settings.trickleRate);};(function(){var initial=0,current=0;NProgress.promise=function($promise){if(!$promise||$promise.state()==="resolved"){return this;}
if(current===0){NProgress.start();}
initial++;current++;$promise.always(function(){current--;if(current===0){initial=0;NProgress.done();}else{NProgress.set((initial-current)/initial);}});return this;};})();NProgress.render=function(fromStart){if(NProgress.isRendered())return document.getElementById('nprogress');addClass(document.documentElement,'nprogress-busy');var progress=document.createElement('div');progress.id='nprogress';progress.innerHTML=Settings.template;var bar=progress.querySelector(Settings.barSelector),perc=fromStart?'-100':toBarPerc(NProgress.status||0),parent=document.querySelector(Settings.parent),spinner;css(bar,{transition:'all 0 linear',transform:'translate3d('+perc+'%,0,0)'});if(!Settings.showSpinner){spinner=progress.querySelector(Settings.spinnerSelector);spinner&&removeElement(spinner);}
if(parent!=document.body){addClass(parent,'nprogress-custom-parent');}
parent.appendChild(progress);return progress;};NProgress.remove=function(){removeClass(document.documentElement,'nprogress-busy');removeClass(document.querySelector(Settings.parent),'nprogress-custom-parent');var progress=document.getElementById('nprogress');progress&&removeElement(progress);};NProgress.isRendered=function(){return!!document.getElementById('nprogress');};NProgress.getPositioningCSS=function(){var bodyStyle=document.body.style;var vendorPrefix=('WebkitTransform'in bodyStyle)?'Webkit':('MozTransform'in bodyStyle)?'Moz':('msTransform'in bodyStyle)?'ms':('OTransform'in bodyStyle)?'O':'';if(vendorPrefix+'Perspective'in bodyStyle){return 'translate3d';}else if(vendorPrefix+'Transform'in bodyStyle){return 'translate';}else{return 'margin';}};function clamp(n,min,max){if(n<min)return min;if(n>max)return max;return n;}
function toBarPerc(n){return(-1+n)*100;}
function barPositionCSS(n,speed,ease){var barCSS;if(Settings.positionUsing==='translate3d'){barCSS={transform:'translate3d('+toBarPerc(n)+'%,0,0)'};}else if(Settings.positionUsing==='translate'){barCSS={transform:'translate('+toBarPerc(n)+'%,0)'};}else{barCSS={'margin-left':toBarPerc(n)+'%'};}
barCSS.transition='all '+speed+'ms '+ease;return barCSS;}
var queue=(function(){var pending=[];function next(){var fn=pending.shift();if(fn){fn(next);}}
return function(fn){pending.push(fn);if(pending.length==1)next();};})();var css=(function(){var cssPrefixes=['Webkit','O','Moz','ms'],cssProps={};function camelCase(string){return string.replace(/^-ms-/,'ms-').replace(/-([\da-z])/gi,function(match,letter){return letter.toUpperCase();});}
function getVendorProp(name){var style=document.body.style;if(name in style)return name;var i=cssPrefixes.length,capName=name.charAt(0).toUpperCase()+name.slice(1),vendorName;while(i--){vendorName=cssPrefixes[i]+capName;if(vendorName in style)return vendorName;}
return name;}
function getStyleProp(name){name=camelCase(name);return cssProps[name]||(cssProps[name]=getVendorProp(name));}
function applyCss(element,prop,value){prop=getStyleProp(prop);element.style[prop]=value;}
return function(element,properties){var args=arguments,prop,value;if(args.length==2){for(prop in properties){value=properties[prop];if(value!==undefined&&properties.hasOwnProperty(prop))applyCss(element,prop,value);}}else{applyCss(element,args[1],args[2]);}}})();function hasClass(element,name){var list=typeof element=='string'?element:classList(element);return list.indexOf(' '+name+' ')>=0;}
function addClass(element,name){var oldList=classList(element),newList=oldList+name;if(hasClass(oldList,name))return;element.className=newList.substring(1);}
function removeClass(element,name){var oldList=classList(element),newList;if(!hasClass(element,name))return;newList=oldList.replace(' '+name+' ',' ');element.className=newList.substring(1,newList.length-1);}
function classList(element){return(' '+(element.className||'')+' ').replace(/\s+/gi,' ');}
function removeElement(element){element&&element.parentNode&&element.parentNode.removeChild(element);}
return NProgress;});

//======================================================
//	App Initialization Asset
//======================================================
$(document).ready(function(){
	// AJAX Preloader
	$.ajaxSetup({
    beforeSend: function(){ NProgress.start(); },
    complete: function(){ NProgress.done(); }
  });

	// Initialize Application
	let OSDK = null;
	$('#app_id').val(localStorage.getItem("app_id"));
	$('#app_key').val(localStorage.getItem("app_key"));

	// Check SDK Initialization
	$('#setup_sdk').off('click').on('click',function(){
		let _app_id = $('#app_id').val();
		let _app_key = $('#app_key').val();
		localStorage.setItem("app_id", _app_id);
		localStorage.setItem("app_key", _app_key);

		// Initialize SDK
		OSDK = new OcugineSDK({ // App Settings
			app_id: _app_id, // Application ID
			app_key: _app_key // Application Key
		}, { // SDK Settings
			show_ui: true, // Show UI for Methods or not
			language: "EN", // API Language
			auto_analytics: true, // Auto Analytics for Application
			platform: "web", // Game Platform
			auto_reports: true // Auto Reporting (Errors) - Error's Logging
		}, true);

		// Show Next Page
		$('#app_setup').hide();
		$('#auth').show();
	});

	// OAuth
	$('#auth_player').off('click').on('click', function(){
		OSDK.module("UI").showOAuth(function(){
			$('#auth').hide();
			$('#app').show();
			initializeApp(OSDK);
		}, function(error){
			alert(error);
		});
	});
});

// Initialize Application
function initializeApp(OSDK){
	// Initialize Profile
	OSDK.module("Users").users.getCurrentUser(function(data){
		$('#profile_avatar').attr('src', data.base_data.avatar);
		var _full_name = (data.base_data.first_name.length>0)?data.base_data.first_name+' '+data.base_data.last_name + ': ':'Basic Information: ';
		$('#profile_identity').empty().append(_full_name);
		$('#profile_email').empty().append(data.base_data.email);
		$('#profile_uid').empty().append(data.base_data.uid);
		var _cont = '';
		for(i=0;i<data.advanced_fields.length; i++){
			var _vlt = (data.advanced_fields[i].value.length>0)?data.advanced_fields[i].value:'-';
			_cont += '<p class="mt-0 mb-0"><b>'+data.advanced_fields[i].name+':</b> '+_vlt+'</p>';
		}
		$('#advanced_fields').empty().append(_cont);
		initializeAchivs(OSDK);
	}, function(error){
		$('#profile_error').empty().append(error).show();
	});


}

// Initialize Achievements
function initializeAchivs(OSDK){
	OSDK.module("Gaming").achievements.getPlayerList(function(data){
		var _cont = '';
		for(i=0;i<data.list.length; i++){
			var _achiv = data.list[i].info; // Achievement Data
			_cont += '<div class="card mb-2"><div class="card-body"><div class="media"><img class="mr-3" src="'+_achiv.image+'" style="max-width: 64px; border-radius: 100%;" /><div class="media-body">';
			_cont += '<h5 class="mt-0">'+_achiv.name+'</h5>';
			_cont += _achiv.desc;
			_cont += '</div></div></div></div>';
		}
		$('#achivs').empty().append(_cont);
	}, function(error){
		$('#achivs_error').empty().append(error).show();
	});
}

# Ocugine JavaScript SDK
Welcome to the [Ocugine Platform](https://ocugine.net/). With this SDK you can develop your games faster, using dozens of ready-to-use modules for your projects. You can use our SDK for WebGL games or HTML5 applications.

To get started, checkout examples and documentation at https://ocugine.net/. You also need to create your **Ocugine Account** and setup your project in the **Ocugine Dashboard**

## Browser compatibility
* Chrome >= v.58 (Apr 2017)
* Firefox >= v.54 (Jun 2017)
* Edge >= v.14 (Aug 2016)
* Safari >= v.10 (Sep 2016)
* Opera >= v.55 (Aug 2017)

## Installation
Connect our SDK library for your project:
```html
<script type="text/javascript" src="https://cp.ocugine.net/cdn/js-sdk-041/ocugine.js" crossorigin="anonymous"></script>
```

Or use minified version:
```html
<script type="text/javascript" src="https://cp.ocugine.net/cdn/js-sdk-041/ocugine.min.js" crossorigin="anonymous"></script>
```

---

**If you want to use our UI Module from JS SDK you need to connect CSS:**
```html
<link rel="stylesheet" href="https://cp.ocugine.net/cdn/js-sdk-041/ocugine.css" crossorigin="anonymous">
```

## Setup SDK
So, you can initialize Ocugine JS SDK by few lines of code:
```js
// Initialize SDK
let OSDK = new OcugineSDK({ // App Settings
	app_id: APP_ID, // Your Project ID
	app_key: APP_KEY // Your Client Key
}, SDK_SETTINGS, DEBUG_MODE);
```

**Where:**
* **APP_ID** (required) - Project ID. You can find them [here](https://cp.ocugine.pro/dashboard/settings/).
* **APP_KEY** (required) - Client Key. You can find them [here](https://cp.ocugine.pro/dashboard/settings/).
* **SDK_SETTINGS** - SDK Settings Object.
* **DEBUG_MODE** - Boolean (true - debug, false - production).

**SDK Settings Object:**
```
{
	show_ui: true,  // Show built-in UI for methods
	language: "EN", // API Language
	auto_analytics: true, // Auto Analytics for your project
	platform: "web", // Game Platform
	auto_reports: true // Auto Reporting (Errors) - Error's Logging
}
```

## Objects List
The list of available object:
* **OcugineSDK** - General SDK Class;
* **Ocugine_Auth** - OAuth Authentication Class;
* **Ocugine_Analytics** - Analytics Class (for example: events and conversions);
* **Ocugine_Gaming** - Game Services Class (for example: achievements);
  * **leaderboards** - Leaderboards Object;
  * **achievements** - Achievements Object;
  * **missions** - Missions Object;
* **Ocugine_Monetization** - Monetization Class;
* **Ocugine_Notifications** - In-Game Notifications class;
* **Ocugine_Marketing** - Marketing Class;
* **Ocugine_Ads** - Advertising Class;
* **Ocugine_Backend** - Cloud Management Class;
  * **storage** - Storage Object;
  * **saves** - Cloud-Saves Object;
  * **database** - Database Object;
  * **multiplayer** - Multiplayer Object;
  * **liveconfs** - Live Configs Object;
  * **backend** - Backend Builder Object;
* **Ocugine_Reports** - Errors and Performance Reporting Class;
  * **errors** - Errors Reporting Object;
  * **performance** - Performance Reporting Object;
* **Ocugine_Localization** - Localization Class;
* **Ocugine_Users** - Ocugine Users Class;
  * **policy** - Policy Management Object;
  * **users** - Users Management Object;
  * **support** - Support System Object;
  * **chats** - Chats Object;
  * **dialogs** - Personal Messages Object;
  * **reviews** - Reviews Object;
* **Ocugine_UI** - Ocugine UI Modules Class (Requires jQuery);
* **Ocugine_Utils** - Ocugine Utils Class

## What's next?
Learn more about Ocugine SDK and Platform [here](https://docs.ocugine.net/).
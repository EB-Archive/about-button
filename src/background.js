/* global browser */
const ABOUT_PAGES = [
	["about:",					"firefox",			true],
	["about:about",				"cog",				true],
	["about:accounts",			"user",				true],
	["about:addons",			"plugin",			true],
	["about:blank",				"page-white",		false],
	["about:buildconfig",		"building",			true],
	["about:cache",				"drive",			true],
	["about:checkerboard",		"chart-line",		true],
	["about:config",			"wrench",			true],
	["about:crashes",			"error",			true],
	["about:credits",			"vcard",			true],
	["about:debugging",			"script-lightning",	true],
	["about:devtools-toolbox",	"wrench-orange",	true],
	["about:downloads",			"drive-down",		true],
	["about:healthreport",		"heart",			true],
	["about:home",				"house",			false],
	["about:license",			"report",			false],
	["about:logo",				"picture-empty",	false],
	["about:memory",			"memory",			true],
	["about:mozilla",			"world",			true],
	["about:networking",		"world-network",	true],
	["about:newtab",			"tab",				true],
	["about:performance",		"server-lightning",	true],
	["about:plugins",			"plugin",			true],
	["about:preferences",		"options-wrench",	true],
	["about:privatebrowsing",	"lock",				true],
	["about:profiles",			"group",			true],
	["about:rights",			"receipt",			false],
	["about:robots",			"user-red",			true],
	["about:serviceworkers",	"script-gear",		true],
	["about:sessionrestore",	"lightning",		true],
	["about:support",			"help",				true],
	["about:sync-log",			"page-refresh",		true],
	["about:sync-tabs",			"tabs-refresh",		true],
	["about:telemetry",			"chart-curve",		true],
	["about:webrtc",			"phone",			true],
	["about:welcomeback",		"emoticon-smile",	true]
//	It has been confirmed that the following can't be used
//	by other addons to inject malicious code into this extension:
//	,["<div id=\"stuff\">inADiv</div>","phone.png\" style=\"background-color: red;\" data-fileext=\"", false]
];

/**
 * @param {type} message
 * @param {type} resolve
 * @param {type} privileged
 * @returns {undefined}
 */
function registerPage(message, resolve, privileged) {
	let data = [];
	data[0] = String(message.page);
	data[1] = String(message.icon !== undefined ? message.icon : "");
	data[2] = Boolean(message.privileged);

	let isNew = true;
	if (privileged) {
		for (let i = 0; i < ABOUT_PAGES.length; i++) {
			let d = ABOUT_PAGES[i];
			if (data[0].localeCompare(d[0], {sensitivity: "accent", numeric: true}) === 0) {
				ABOUT_PAGES.slice(i, 1);
			}
		}
	} else {
		for (let d in ABOUT_PAGES) {
			if (data[0].localeCompare(d[0], {sensitivity: "accent", numeric: true}) === 0) {
				isNew = false;
				break;
			}
		}
	}

	if (isNew) {
		ABOUT_PAGES.push(data);
		ABOUT_PAGES.sort((a, b) => {
			return a[0].localeCompare(b[0], {
				sensitivity: "accent",
				numeric: true
			})
		});
		browser.runtime.sendMessage({
			type: "pagesChanged"
		}).catch((error) => {
			console.error(error);
		})
	}
	resolve(isNew);
	return;
}

browser.runtime.onMessage.addListener((message, sender, resolve) => {
	let messageType = String(message.type);
	switch (messageType) {
		case "registerPage": {
			registerPage(message, resolve, true);
			return;
		} case "getPages": {
			resolve({pages: ABOUT_PAGES.slice()});
			return;
		} default: {}
	}
});

browser.runtime.onMessageExternal.addListener((message, sender, resolve) => {
	let messageType = String(message.type);
	switch (messageType) {
		case "registerPage": {
			registerPage(message, resolve, false);
			break;
		} default: {
			throw "Invalid message type: " + messageType;
		}
	}
});

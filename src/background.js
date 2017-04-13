/* global browser */
const ABOUT_PAGES = [
	["about:",					"firefox",			false],
	["about:about",				"cog",				false],
	["about:accounts",			"user",				false],
	["about:addons",			"plugin",			false],
	["about:blank",				"page-white",		true],
	["about:buildconfig",		"building",			false],
	["about:cache",				"drive",			false],
	["about:checkerboard",		"chart-line",		false],
	["about:config",			"wrench",			false],
	["about:crashes",			"error",			false],
	["about:credits",			"vcard",			false],
	["about:debugging",			"script-lightning",	false],
	["about:devtools-toolbox",	"wrench-orange",	false],
	["about:downloads",			"drive-down",		false],
	["about:healthreport",		"heart",			false],
	["about:home",				"house",			true],
	["about:license",			"report",			true],
	["about:logo",				"picture-empty",	true],
	["about:memory",			"memory",			false],
	["about:mozilla",			"world",			false],
	["about:networking",		"world-network",	false],
	["about:newtab",			"tab",				false],
	["about:performance",		"server-lightning",	false],
	["about:plugins",			"plugin",			false],
	["about:preferences",		"options-wrench",	false],
	["about:privatebrowsing",	"lock",				false],
	["about:profiles",			"group",			false],
	["about:rights",			"receipt",			true],
	["about:robots",			"user-red",			false],
	["about:serviceworkers",	"script-gear",		false],
	["about:sessionrestore",	"lightning",		false],
	["about:support",			"help",				false],
	["about:sync-log",			"page-refresh",		false],
	["about:sync-tabs",			"tabs-refresh",		false],
	["about:telemetry",			"chart-curve",		false],
	["about:webrtc",			"phone",			false],
	["about:welcomeback",		"emoticon-smile",	false]
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
	data[2] = !Boolean(message.privileged);

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
	}
	resolve(isNew);
	return;
}

browser.runtime.onMessage.addListener((message, sender, resolve) => {
	let messageType = String(message.type);
	switch (messageType) {
		case "registerPage": {
			registerPage(message, resolve, true);
			break;
		} case "getPages": {
			resolve({pages: ABOUT_PAGES.slice()});
			return;
		} default: {
			throw new Error("Invalid message type: " + messageType);
		}
	}
});

browser.runtime.onMessageExternal.addListener((message, sender, resolve) => {
	let messageType = String(message.type);
	switch (messageType) {
		case "registerPage": {
			registerPage(message, resolve, false);
			break;
		} default: {
			throw new Error("Invalid message type: " + messageType);
		}
	}
});

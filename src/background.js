/*
 * Copyright (C) 2017 ExE Boss
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/* global browser */
const ABOUT_PAGES = [];
initPage("about:",	"firefox",	true);
initPage("about:about",	"cog",	true);
initPage("about:accounts",	"user",	true);
initPage("about:addons",	"plugin",	true);
initPage("about:blank",	"page-white",	false);
initPage("about:buildconfig",	"building",	true);
initPage("about:cache",	"drive",	true);
initPage("about:checkerboard",	"chart-line",	true);
initPage("about:config",	"wrench",	true);
initPage("about:crashes",	"error",	true);
initPage("about:credits",	"vcard",	true);
initPage("about:debugging",	"script-lightning",	true);
initPage("about:devtools-toolbox",	"wrench-orange",	true);
initPage("about:downloads",	"drive-down",	true);
initPage("about:healthreport",	"heart",	true);
initPage("about:home",	"house",	false);
initPage("about:license",	"report",	false);
initPage("about:logo",	"picture-empty",	false);
initPage("about:memory",	"memory",	true);
initPage("about:mozilla",	"world",	true);
initPage("about:networking",	"world-network",	true);
initPage("about:newtab",	"tab",	true);
initPage("about:performance",	"server-lightning",	true);
initPage("about:plugins",	"plugin",	true);
initPage("about:preferences",	"options-wrench",	true);
initPage("about:privatebrowsing",	"lock",	true);
initPage("about:profiles",	"group",	true);
initPage("about:rights",	"receipt",	false);
initPage("about:robots",	"user-red",	true);
initPage("about:serviceworkers",	"script-gear",	true);
initPage("about:sessionrestore",	"lightning",	true);
initPage("about:support",	"help",	true);
initPage("about:sync-log",	"page-refresh",	true);
initPage("about:sync-tabs",	"tabs-refresh",	true);
initPage("about:telemetry",	"chart-curve",	true);
initPage("about:webrtc",	"phone",	true);
initPage("about:welcomeback",	"emoticon-smile",	true);
// It has been confirmed that the following can't be used
// by other addons to inject malicious code into this extension:
//initPage("<div id=\"stuff\">inADiv</div>",	"phone.png\" style=\"background-color: red;\" data-fileext=\"",	false);

/**
 * @param {String} page
 * @param {String} icon
 * @param {Boolean} privileged
 * @returns {undefined}
 */
function initPage(page, icon, privileged) {
	registerPage({page: page, icon: icon, privileged: privileged}, registered => {
		if (!registered) {
			console.warn("[Firefox about:about Button]", "Failed to register page:", page);
		}
	}, true);
}

/**
 * @param {Object} message
 * @param {Function} resolve
 * @param {Boolean} privileged
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
		}).catch(error => {
			if (!error.message.startsWith("Could not establish connection. Receiving end does not exist."))
				console.error(error);
		});
	}
	if (typeof resolve === "function")
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
			return browser.storage.local.get({
				showDisabledButtons: false
			}).then(settings => {
				return settings.showDisabledButtons;
			}).catch(error => {
				console.warn(error);
				return false;
			}).then(showDisabledButtons => {
				return {
					pages: ABOUT_PAGES.slice(),
					showDisabledButtons: showDisabledButtons
				};
			});
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

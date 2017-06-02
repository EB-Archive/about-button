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
/* global initPage */
const ABOUT_PAGES = [];

/**
 * @param {String} page
 * @param {String} icon
 * @param {Boolean} privileged
 * @param {String} shim (Optional)
 * @returns {undefined}
 */
function initPage(page, icon, privileged, shim) {
	let message = {page: page, icon: icon, privileged: privileged};
	if (shim) message.shim = shim;
	registerPage(message, registered => {
		if (!registered) {
			console.warn("[about:about Button]", "Failed to register page:", page);
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
	var data = {
		url: new String(message.page),
		icon: new String((typeof message.icon !== undefined && typeof message.icon !== null) ? message.icon : ""),
		privileged: new Boolean(message.privileged)
	};

	let path = removeProtocolFromURL(data.url);
	let isNew = true;
	if (privileged) {
		for (let i = 0; i < ABOUT_PAGES.length; i++) {
			let d = ABOUT_PAGES[i];
			if (path.localeCompare(removeProtocolFromURL(d.url), {sensitivity: "accent", numeric: true}) === 0) {
				ABOUT_PAGES.slice(i, 1);
			}
		}
		// Shims are only available to be created by a trusted source (i.e. this extension)
		if (message.shim) {
			data.shim = new String(message.shim);
		}
	} else {
		for (let d in ABOUT_PAGES) {
			if (path.localeCompare(removeProtocolFromURL(d.url), {sensitivity: "accent", numeric: true}) === 0) {
				isNew = false;
				break;
			}
		}
	}

	if (isNew) {
		ABOUT_PAGES.push(data);
		ABOUT_PAGES.sort((a, b) => {
			return removeProtocolFromURL(a.url).localeCompare(removeProtocolFromURL(b.url), {
				sensitivity: "accent",
				numeric: true
			});
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

/**
 *
 * @param {String} url
 * @returns {String}
 */
function removeProtocolFromURL(url) {
	let path = /(?:\w+:(?:\/\/)?)?(.*)/.exec(url);
		return path ? path[1] : url;
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
					pages: JSON.stringify(ABOUT_PAGES),
					showDisabledButtons: showDisabledButtons
				};
			});
		} default: {}
	}
});

// browser.runtime.onMessageExternal is only supported from FF 54.0+
if (browser.runtime.onMessageExternal) {
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
}

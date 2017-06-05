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
const ABOUT_PAGES	= [];
var default_scheme	= null;

/**
 * @param {String} config The name of the JSON config file in the config directory
 * @returns {Promise}
 */
function getData(config) {
	return new Promise(resolve => {
		let xhr = new XMLHttpRequest();
		xhr.open("GET", browser.runtime.getURL(`config/${config}.json`));
		xhr.overrideMimeType("application/json");
		xhr.onloadend = evt => {
			resolve(xhr);
		};
		xhr.send();
	});
}

(async function() {
	let initPages = async (browserInfo) => {
		let browserData = JSON.parse((await getData("browsers")).responseText);
		let specificData = browserData.browsers[browserInfo.name];

		/** @type XMLHttpRequest */
		let xhr = null;
		if (specificData) {
			xhr = await getData(specificData.data);
		} else {
			specificData = browserData.__default;
		}

		if (xhr === null || xhr.status !== 200) {
			xhr = await getData(browserData.__default.data);
			if (xhr.status !== 200) {
				throw new Error("Cannot load about: URL configuration");
			}
		}

		default_scheme = specificData.default_scheme;
		JSON.parse(xhr.response).forEach(message => {
			registerPage(message, registered => {
				if (!registered) {
					console.warn("[about:about Button]", "Failed to register page:", message.url);
				}
			}, true);
		});
	};

	if (browser.runtime.getBrowserInfo) {
		initPages(await browser.runtime.getBrowserInfo());
	} else {
		initPages({
			// Assume running under Google Chrome for now, because the minimum
			// supported Firefox version supports `browser.runtime.getBrowserInfo()`
			// and we currently only have code for Mozilla Firefox and Google Chrome.
			// TODO: Dynamically resolve this once Opera and Edge are supported!
			name:	"Chrome",
			vendor:	"Google",
			version:	"Unknown",
			buildID:	"Unknown"
		});
	}
})();

/**
 * @param {Object} message
 * @param {Function} resolve
 * @param {Boolean} privileged
 * @returns {undefined}
 */
function registerPage(message, resolve, privileged) {
	var data = {
		url: new String(message.url),
		icon: new String((typeof message.icon !== undefined && typeof message.icon !== null) ? message.icon : ""),
		privileged: new Boolean(message.privileged),
		alias: []
	};

	if (message.alias) {
		let length = new Number(message.alias.length);
		for (let i = 0; i < length; i++) {
			data.alias[i] = new String(message.alias[i]);
		}
	}

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
					default_scheme: default_scheme,
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

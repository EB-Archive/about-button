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
"use strict";
/* global browser */

/**
 * @typedef	{Object}	Category
 * @property	{String}	category	The category ID
 * @property	{AboutPage[]}	content	All the about: pages
 */
/**
 * @typedef	{Object}	AboutPage
 * @property	{String}	url	The page URL
 * @property	{String}	[icon]	The page icon
 * @property	{Boolean}	privileged	If the page is privileged
 * @property	{String}	[description]	The description
 * @property	{String[]}	[alias]	All the URL aliases of this page
 * @property	{AboutPageQuery[][]}	[query]	All the about: page queries
 * @property	{String}	[strict_min_version]	The minimum version of the browser that supports this version
 * @property	{String}	[strict_max_version]	The maximum version of the browser that supports this version
 */
/**
 * @typedef	{Object}	AboutPageQuery
 * @property	{String}	value	The value of the query
 * @property	{String}	[icon]	The query icon
 */
/**
 * @typedef	{Object}	BrowserInfo
 * @property	{String}	name
 * @property	{String}	vendor
 * @property	{String}	version
 * @property	{String}	buildID
 */

/** All the registered pages. @type Category[] */
const ABOUT_PAGES	= [];
const VERSION_REGEX	= /^\s*([\d.]+?)(?:\.0)*\s*$/;

var defaultScheme	= null;
var dataName	= null;

/**
 * @param {String} config The name of the JSON config file in the config directory
 *
 * @return {Promise.&lt;Response&gt;} The content of the JSON config file
 */
function getData(config) {
	return fetch(`config/${config}.json`);
}

(async function() {
	/**
	 * @param {BrowserInfo} browserInfo
	 * @return {undefined}
	 */
	let initPages = async (browserInfo) => {
		/**
		 * @typedef {Object} BrowserData
		 * @property {BrowserData$Browser} default
		 * @property {Object} browsers
		 */
		/**
		 * @typedef {Object} BrowserData$Browser
		 * @property {String} default_scheme
		 * @property {String} data
		 */
		/**
		 * @type BrowserData
		 * @param {Response} r
		 */
		let browserData = await getData("browsers").then(r => r.json());
		/** @type BrowserData$Browser */
		let specificData = browserData.browsers[browserInfo.name];

		/** @type Response */
		let response = null;
		if (specificData) {
			dataName = specificData.data;
			response = await getData(dataName);
		} else {
			specificData = browserData.default;
		}

		if (response === null || !response.ok) {
			dataName = browserData.default.data;
			response = await getData(dataName);
			if (!response.ok) {
				throw new Error("Cannot load about: URL configuration");
			}
		}

		defaultScheme = specificData.default_scheme;
		(await response.json()).forEach(category => {
			if (category.content) {
				category.content.forEach(page => {
					page.category = {
						category:	category.category,
						priority:	category.priority
					};
					if (!registerPage(page, true)) {
						console.warn("[about:about Button]", "Failed to register page:", page.url);
					}
				});
			} else {
				getCategory(category.category.toLowerCase(), category.priority);
			}
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
 *
 * @param {String} category The category ID.
 * @param {Number} priority The priority.
 * @returns {AboutPage[]} The about: pages
 */
function getCategory(category, priority) {
	for (/** @type Category */ let c of ABOUT_PAGES) {
		if (c.category.localeCompare(category, {
			sensitivity: "accent",
			numeric: true
		}) === 0) {
			if (priority !== undefined && c.priority === 0) {
				c.priority = priority;
			}
			return c.content;
		}
	}

	let content = [];
	ABOUT_PAGES.push({
		category:	category,
		priority:	priority || 0,
		content:	content
	});
	ABOUT_PAGES.sort((a, b) => {
		if (a.priority !== b.priority) {
			return b.priority - a.priority;
		}
		return a.category.localeCompare(b.category, {
			sensitivity: "accent",
			numeric: true
		});
	});

	return content;
}

/**
 * @param {AboutPage} message
 * @param {Boolean} privileged
 *
 * @return {undefined}
 */
function registerPage(message, privileged) {
	/** @type AboutPage[] */
	let aboutPages;
	if (privileged && typeof message.category === "object") {
		aboutPages = getCategory(String(message.category.category || "general").toLowerCase(), message.category.priority);
	} else {
		aboutPages = getCategory(String(message.category || "general").toLowerCase());
	}

	/** @type AboutPage */
	var data = {
		url: String(message.url),
		icon: String((typeof message.icon !== undefined && typeof message.icon !== null) ? message.icon : ""),
		privileged: Boolean(message.privileged),
		description: "",
		alias: []
	};

	if ("alias" in message) {
		let length = new Number(message.alias.length);
		for (let i = 0; i < length; i++) {
			data.alias[i] = new String(message.alias[i]);
		}
	}

	if ("query" in message) {
		data.query = {};
		for (let query in message.query) {
			let values = message.query[query];
			let copy = [];
			data.query[String(query)] = copy;
			for (let i = 0; i < values.length; i++) {
				let value = values[i];
				copy[i] = {
					value: String(value.value),
					icon: String((typeof value.icon !== undefined && typeof value.icon !== null) ? value.icon : "")
				};
			}
		}
	}

	if ("strict_min_version" in message) {
		let minVer = String(message.strict_min_version);
		let minVerData = VERSION_REGEX.exec(minVer);
		if (minVerData) {
			data.strict_min_version = minVerData[1];
		}
	}

	if ("strict_max_version" in message) {
		let maxVer	= String(message.strict_max_version);
		let maxVerData	= VERSION_REGEX.exec(maxVer);
		if (maxVerData) {
			data.strict_max_version = maxVerData[1];
		}
	}

	let path = removeProtocolFromURL(data.url);
	let isNew = true;
	if (privileged) {
		if ("description" in message)
			data.description = new String(message.description);
		for (let i = 0; i < aboutPages.length; i++) {
			let d = aboutPages[i];
			if (path.localeCompare(removeProtocolFromURL(d.url), {sensitivity: "accent", numeric: true}) === 0) {
				aboutPages.slice(i, 1);
			}
		}
		// Shims are only available to be created by a trusted source (i.e. this extension)
		if ("shim" in message) {
			data.shim = new String(message.shim);
		}
	} else {
		for (let d in aboutPages) {
			if (path.localeCompare(removeProtocolFromURL(d.url), {sensitivity: "accent", numeric: true}) === 0) {
				isNew = false;
				data = d;
				break;
			}
		}
	}

	if (isNew) {
		aboutPages.push(data);
		aboutPages.sort((a, b) => {
			return removeProtocolFromURL(a.url).localeCompare(removeProtocolFromURL(b.url), {
				sensitivity: "accent",
				numeric: true
			});
		});
		browser.runtime.sendMessage({
			method: "pagesChanged"
		}).catch(error => {
			if (!error.message.startsWith("Could not establish connection. Receiving end does not exist."))
				console.error(error);
		});
	}

	if (!privileged && !data.description && message.description) {
		data.description = new String(message.description);
	}
	return isNew;
}

/**
 *
 * @param {String} url
 * @return {String}
 */
function removeProtocolFromURL(url) {
	let path = /(?:\w+:(?:\/\/)?)?(.*)/.exec(url);
		return path ? path[1] : url;
}

browser.runtime.onMessage.addListener(async (message, sender) => {
	let messageType = String(message.method);
	switch (messageType) {
		case "registerPage": {
			return registerPage(message.data, true);
		} case "getPages": {
			let settings = await browser.storage.local.get({
				showDisabledButtons: false
			});

			return {
				categories:	JSON.stringify(ABOUT_PAGES),
				dataName:	dataName,
				defaultScheme:	defaultScheme,
				showDisabledButtons:	settings.showDisabledButtons
			};
		} case "getScheme": {
			return defaultScheme;
		} default: {}
	}
});

// browser.runtime.onMessageExternal is only supported from FF 54.0+
if ("onMessageExternal" in browser.runtime) {
	browser.runtime.onMessageExternal.addListener(async (message, sender) => {
		let messageType = String(message.method);
		switch (messageType) {
			case "registerPage": {
				return registerPage(message.data, false);
			} default: {
				throw "Invalid message method: " + messageType;
			}
		}
	});
}

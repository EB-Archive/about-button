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
/// <reference path="./types.d.ts"/>
"use strict";

/**
 * All the registered pages.
 * @type {Category[]}
 */
const ABOUT_PAGES	= [];
const VERSION_REGEX	= /^\s*([\d.]+?)(?:\.0)*\s*$/;

/** @type {string} */
let defaultScheme	= null;
/** @type {string} */
let dataName	= null;

/**
 * @param	{string}	config	The name of the JSON config file in the config directory
 * @return	{Promise<Response>}	The content of the JSON config file
 */
const getData = async (config) => {
	return fetch(`config/${config}.json`);
};

(async () => {
	/**
	 * @param {browser.runtime.BrowserInfo} browserInfo
	 */
	const initPages = async browserInfo => {
		/** @type {BrowserData} */
		const browserData	= await getData("browsers").then(r => r.json());
		let specificData	= browserData.browsers[browserInfo.name];

		/** @type {Response} */
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
				throw new Error("Cannot load about: scheme configuration");
			}
		}

		defaultScheme = specificData.default_scheme;
		/** @type {Category[]} */
		const categories = await response.json();
		for (const category of categories) {
			if (category.content) {
				for (const page of category.content) {
					const p = Object.assign({}, page, {category: {
						category:	category.category,
						priority:	category.priority,
					}});
					if (!registerPage(p, true)) {
						console.warn("[about:about Button]", "Failed to register page:", page.url);
					}
				}
			} else {
				getCategory(category.category.toLowerCase(), category.priority);
			}
		}
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
			buildID:	"Unknown",
		});
	}
})();

/**
 *
 * @param	{string}	category	The category ID.
 * @param	{number}	priority	The priority.
 * @return	{AboutPage[]}	The about: pages
 */
const getCategory = (category, priority) => {
	for (const c of ABOUT_PAGES) {
		if (c.category.localeCompare(category, {
			sensitivity: "accent",
			numeric: true,
		}) === 0) {
			if (priority !== undefined && c.priority === 0) {
				c.priority = priority;
			}
			return c.content;
		}
	}

	const content = [];
	ABOUT_PAGES.push({
		category:	category,
		priority:	priority || 0,
		content:	content,
	});
	ABOUT_PAGES.sort((a, b) => {
		if (a.priority !== b.priority) {
			return b.priority - a.priority;
		}
		return a.category.localeCompare(b.category, {
			sensitivity: "accent",
			numeric: true,
		});
	});

	return content;
};

/**
 * @param	{AboutPage}	message
 * @param	{boolean}	privileged
 * @return	{boolean}	If the page was registered
 */
const registerPage = (message, privileged) => {
	/** @type {AboutPage[]} */
	let aboutPages;
	if (privileged && typeof message.category === "object") {
		aboutPages = getCategory(String(message.category.category || "general").toLowerCase(), message.category.priority);
	} else {
		aboutPages = getCategory(String(message.category || "general").toLowerCase());
	}

	/** @type AboutPage */
	let data = {
		url:	String(message.url),
		icon:	String(message.icon ? message.icon : ""),
		privileged:	typeof message.privileged === "boolean" ? Boolean(message.privileged) : String(message.privileged),
		description:	"",
		alias:	[],
	};

	if (message.alias instanceof Array) {
		const length = Number(message.alias.length);
		for (let i = 0; i < length; i++) {
			data.alias[i] = String(message.alias[i]);
		}
	}

	if (message.query && typeof message.query === "object") {
		data.query = {};
		for (const query in message.query) {
			data.query[String(query)] = Array.from(message.query[query]);
		}
	}

	if (message.strict_min_version) {
		const minVer = String(message.strict_min_version);
		const minVerData = VERSION_REGEX.exec(minVer);
		if (minVerData) {
			[,data.strict_min_version] = minVerData;
		}
	}

	if ("strict_max_version" in message) {
		const maxVer	= String(message.strict_max_version);
		const maxVerData	= VERSION_REGEX.exec(maxVer);
		if (maxVerData) {
			[,data.strict_max_version] = maxVerData;
		}
	}

	const path = removeProtocolFromURL(data.url);
	let isNew = true;
	if (privileged) {
		if (message.description)
			data.description = String(message.description);
		for (let i = 0; i < aboutPages.length; i++) {
			const d = aboutPages[i];
			if (path.localeCompare(removeProtocolFromURL(d.url), {sensitivity: "accent", numeric: true}) === 0) {
				aboutPages.slice(i, 1);
			}
		}
		// Shims are only available to be created by a trusted source (i.e. this extension)
		if ("shim" in message) {
			data.shim = String(message.shim);
		}
	} else {
		for (const d in aboutPages) {
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
				numeric: true,
			});
		});
		browser.runtime.sendMessage({
			method: "pagesChanged",
		}).catch(error => {
			if (!error.message.startsWith("Could not establish connection. Receiving end does not exist."))
				console.error(error);
		});
	}

	if (!privileged && !data.description && message.description) {
		data.description = String(message.description);
	}
	return isNew;
};

/**
 * @param	{string} url
 * @return	{string}
 */
const removeProtocolFromURL = url => {
	const path = /(?:[a-zA-Z0-9.+-]+:(?:\/\/)?)?(.*)/.exec(url);
	return path ? path[1] : url;
};

browser.runtime.onMessage.addListener(async (message) => {
	const messageType = String(message.method);
	switch (messageType) {
		case "registerPage": {
			return registerPage(message.data, true);
		} case "getPages": {
			/** @type {{showDisabledButtons: boolean}} */
			const {
				showDisabledButtons,
			} = await browser.storage.local.get({
				showDisabledButtons: false,
			});

			return {
				categories:	ABOUT_PAGES,
				dataName,
				defaultScheme,
				showDisabledButtons,
			};
		} case "getScheme": {
			return defaultScheme;
		} default: {
			return undefined;
		}
	}
});

// browser.runtime.onMessageExternal is only supported from FF 54.0+
if ("onMessageExternal" in browser.runtime) {
	browser.runtime.onMessageExternal.addListener(async (message) => {
		const messageType = String(message.method);
		switch (messageType) {
			case "registerPage": {
				return registerPage(message.data, false);
			} default: {
				throw `Invalid message method: ${messageType}`;
			}
		}
	});
}

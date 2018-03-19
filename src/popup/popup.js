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
/* global browser, Promise */

/**
 * @typedef	{Object}	Category
 * @property	{String}	category	The category ID
 * @property	{AboutPage[]}	content	All the about: pages
 */
/**
 * @typedef	{Object}	AboutPage
 * @property	{String}	url	The page URL
 * @property	{?String}	icon	The page icon
 * @property	{Boolean}	privileged	If the page is privileged
 * @property	{?String}	description	The description
 * @property	{?String[]}	alias	All the URL aliases of this page
 * @property	{?AboutPageQuery[][]}	query	All the about: page queries
 * @property	{?String}	strict_min_version	The minimum version of the browser that supports this version
 * @property	{?String}	strict_max_version	The maximum version of the browser that supports this version
 */
/**
 * @typedef	{Object}	AboutPageQuery
 * @property	{String}	value	The value of the query
 * @property	{?String}	icon	The query icon
 */
/**
 * @typedef	{Object}	BrowserInfo
 * @property	{String}	name
 * @property	{String}	vendor
 * @property	{String}	version
 * @property	{String}	buildID
 */

/**
 * Used to toggle visibility of the debug button.
 *
 * I’m not too worried about making this look good right
 * now, as it’s only intended for debugging purposes.
 *
 * @type Boolean
 */
let isDebug = false;

/**
 * Used to allow opening of:
 * <ul>
 * <li>`about:addons` by opening the extension configuration.
 * <li>`about:credits` by opening <a href="https://www.mozilla.org/credits">https://www.mozilla.org/credits</a>.
 * </ul>
 * @type Boolean
 */
let usePagesShim = true;

/** @type Object */
let pagesShims = {
	"Firefox": ["about:addons", "about:credits"]
};

document.addEventListener("DOMContentLoaded", () => {
	browser.storage.onChanged.addListener((changes, areaName) => {
		switch (areaName) {
			case "local": {
				if (changes.showDisabledButtons !== undefined) {
					reload();
				}
				break;
			}
		}
	});
	browser.runtime.onMessage.addListener((message, sender, resolve) => {
		let messageType = String(message.method);
		switch (messageType) {
			case "pagesChanged": {
				reload();
			}
		}
	});
	if (isDebug) {
		let button = document.getElementById("showDisabledButtons");
		button.style.display = "inline-block";
		button.addEventListener("click", () => {
			browser.storage.local.get({
				showDisabledButtons: false
			}).then(settings => {
				browser.storage.local.set({
					showDisabledButtons: !settings.showDisabledButtons
				});
			}).catch(error => {
				console.error(error);
			});
		});
	}
	document.getElementById("open-options").addEventListener("click", () => {
		browser.runtime.openOptionsPage();
	});
	i18nInit();
	reload();
});

document.addEventListener("contextmenu", evt => {
	evt.preventDefault();
});

/**
 * Checks if the suppplied page is shimmed.
 *
 * @param {AboutPage} page The page to check.
 * @param {String} url The page’s url with the protocol to check.
 * @param {BrowserInfo} browserInfo The browser info.
 *
 * @return {Boolean} If the page is shimmed.
 */
function isShimmed(page, url, browserInfo) {
	if (usePagesShim) {
		if (page.shim)
			return true;
		let shims = pagesShims[browserInfo.name] || [];
		for (let p of shims) {
			if (page.url === p || url === p) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Applies internationalization to the popup.
 *
 * @return {undefined}
 */
async function i18nInit() {
	let protocol = await browser.runtime.sendMessage({ method: "getScheme" });
	let main = document.getElementById("main");

	document.getElementById("main").appendChild(noKnownPages(protocol, true));
	document.getElementById("status-separator").classList.add("hidden");

	processI18n({
		protocol: protocol
	});
}

/**
 * @param {String} defaultScheme
 * @param {Boolean} showDisabledButtons
 *
 * @returns {HTMLDivElement}
 */
function noKnownPages(defaultScheme, showDisabledButtons) {
	if (typeof showDisabledButtons === undefined)
		showDisabledButtons = true;

	let panel = document.createElement("div");
	panel.classList.add("panel-section", "panel-section-header");

	let protocol = document.createElement("div");
	protocol.classList.add("text-section-header");
	protocol.appendChild(document.createTextNode(browser.i18n.getMessage(`popup_unsupported_${showDisabledButtons ? "unknown" : "privilegedOnly"}`, defaultScheme)));

	panel.appendChild(protocol);
	return panel;
}

let reloadCounter = 0;

/**
 * (Re-)load the current popup.
 */
async function reload() {
	if (reloadCounter++ > 0) {
		if (reloadCounter > 2)
			reloadCounter = 2;
		return;
	}
	let result = await _reload();
	if (reloadCounter > 1) {
		result = await _reload();
	}
	reloadCounter = 0;
	return result;
}

/**
 * Actually (re-)load the current popup.
 *
 * @private
 */
async function _reload() {
	let main = document.getElementById("main");

	let status = document.getElementById("status");
	let statusContainer = document.getElementById("status-container");
	let statusSeparator = document.getElementById("status-separator");

	status.textContent = "";
	statusContainer.classList.add("hidden");

	try {
		const [
			{
				/** @type Category[] */
				categories,
				/** @type String */
				dataName,
				/** @type String */
				defaultScheme,
				/** @type Boolean */
				showDisabledButtons
			},
			/** @type BrowserInfo */
			browserInfo
		] = await Promise.all([
			browser.runtime.sendMessage({ method: "getPages" }).then(response => {
				response.categories	= JSON.parse(response.categories);
				response.showDisabledButtons	= response.showDisabledButtons || false;
				return response;
			}),
			("getBrowserInfo" in browser.runtime ? browser.runtime.getBrowserInfo() : Promise.resolve({
				// Assume running under Google Chrome for now, because the minimum
				// supported Firefox version supports `browser.runtime.getBrowserInfo()`
				// and we currently only have code for Mozilla Firefox and Google Chrome.
				// TODO: Dynamically resolve this once Opera and Edge are supported!
				name: "Chrome",
				vendor: "Google",
				version: "Unknown",
				buildID: "Unknown"
			}))
		]);

		if (!showDisabledButtons) {
			let statusMessage = document.createElement("div");
			statusMessage.appendChild(document.createTextNode(browser.i18n.getMessage("popup_privilegedHidden")));
			status.appendChild(statusMessage);
			statusContainer.classList.remove("hidden");
		}

		main.textContent = "";
		for (/** @type Category */ const category of categories) {
			/** @type HTMLDivElement */
			const header = document.createElement("div");
			header.classList.add("panel-section", "panel-section-header");
			/** @type HTMLDivElement */
			const headerText = document.createElement("div");
			headerText.classList.add("text-section-header");
			let categoryName = browser.i18n.getMessage(`category_${category.category}`);

			if (categoryName.length === 0) {
				// The category hasn't been translated, so let’s use the ID
				// TODO: Handle `camelCase` words
				for (/** @type String */ let word of category.category.split(/[\s_-]/)) {
					word = word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase();
					if (categoryName.length > 0)
						categoryName += ` ${word}`;
					else
						categoryName = word;
				}
			}

			headerText.appendChild(document.createTextNode(categoryName));
			header.appendChild(headerText);

			/** @type HTMLSectionElement */
			const content = document.createElement("section");
			content.classList.add("panel-section", "panel-section-list");
			for (/** @type AboutPage */ const page of category.content) {
				// Ensure that this page is supported by this browser version
				if ("strict_min_version" in page) {
					if (browserInfo.version.localeCompare(page.strict_min_version, [], {numeric: true, caseFirst: "upper"}) < 0) {
						continue;
					}
				}
				if ("strict_max_version" in page) {
					let strictMaxVersion = page.strict_max_version;
					if (!/[a-zA-Z]/.test(strictMaxVersion)) {
						strictMaxVersion += "\u{10FFFF}";
					}
					if (browserInfo.version.localeCompare(strictMaxVersion, [], {numeric: true, caseFirst: "upper"}) > 0) {
						continue;
					}
				}

				let disabled = false;
				let url = page.url.includes(':') ? page.url : defaultScheme + page.url;
				if (page.privileged && !isShimmed(page, url, browserInfo)) {
					disabled = true;
					if (!showDisabledButtons)
						continue;
				}

				/** @type HTMLDivElement */
				const button = document.createElement("div");
				const img = generateImg(page.icon);
				button.classList.add("panel-list-item");
				if (disabled) {
					button.dataset.disabled = true;
					button.classList.add("disabled");
				}
				button.appendChild(img);
				button.appendChild(createTextElement(url));
				button.addEventListener("click", evt => {
					if (evt.button === 0 && !button.dataset.disabled) {
						if (!page.privileged) {
							browser.tabs.create({url: url});
						} else if (usePagesShim && url === "about:addons") {
							browser.runtime.openOptionsPage();
						} else if (usePagesShim && page.shim) {
							browser.tabs.create({url: (page.shim.includes(':') ? page.shim : defaultScheme + page.shim)});
						} else {
							browser.tabs.create({url: "/redirect/redirect.xhtml?dest=" + encodeURIComponent(url)});
						}
					}
				});
				/** @type String */
				let title	= "";
				const descriptionKey	= `page_${dataName}_${page.url}`;
				const description	= browser.i18n.getMessage(descriptionKey);
				if (description.length > 0 && description !== descriptionKey) {
					if (title.length > 0) {
						title += `\n${description}`;
					} else {
						title = description;
					}
				}
				if ("query" in page) {
					{
						let hasQuery = browser.i18n.getMessage("popup_tooltip_hasQuery");
						if (title.length > 0) {
							title += `\n${hasQuery}`;
						} else {
							title = hasQuery;
						}
					}
					const menuId = `${url}-menu`;
					const menu = document.createElement("menu");
					menu.setAttribute("id", menuId);
					menu.classList.add("panel", "panel-section", "panel-section-list");
					menu.dataset.type = "context";
					for (const query in page.query) {
						if (menu.hasChildNodes()) {
							menu.appendChild(createSeparator());
						}
						/** @type AboutPageQuery[] */
						const values = page.query[query];
						for (/** @type AboutPageQuery */ const value of values) {
							let menuitem = document.createElement("div");
							let menuitemDescriptionKey = `page_${dataName}_${page.url}_${query}_${value.value}`;
							let menuitemDescription = browser.i18n.getMessage(menuitemDescriptionKey);
							let queryUrl = `${url}?${query}=${value.value}`;
							if (value.icon && value.icon.length > 0) {
								menuitem.appendChild(generateImg(value.icon));
							}
							if (menuitemDescription.length > 0 && menuitemDescription !== menuitemDescriptionKey) {
								menuitem.appendChild(createTextElement(menuitemDescription));
							} else {
								menuitem.appendChild(createTextElement(queryUrl));
							}
							menuitem.classList.add("panel-list-item");
							if (disabled) {
								menuitem.dataset.disabled = true;
								menuitem.classList.add("disabled");
							}
							menuitem.addEventListener("click", evt => {
								evt.stopImmediatePropagation();
								if (evt.button === 0 && !menuitem.dataset.disabled) {
									if (!page.privileged) {
										browser.tabs.create({url: queryUrl});
									} else if (usePagesShim && queryUrl === "about:addons") {
										browser.runtime.openOptionsPage();
									} else if (usePagesShim && page.shim) {
										browser.tabs.create({url: (`${page.shim.includes(':') ? page.shim : defaultScheme + page.shim}?${query}=${value.value}`)});
									} else {
										browser.tabs.create({url: "/redirect/redirect.xhtml?dest=" + encodeURIComponent(queryUrl)});
									}
								}
							});
							menu.appendChild(menuitem);
						}
					}
					button.appendChild(menu);
					button.dataset.contextmenu = menuId;
					button.addEventListener("contextmenu", evt => {
						evt.preventDefault();
						evt.stopImmediatePropagation();
						button.dataset.contextmenuVisible = true;
					});
					button.addEventListener("mouseleave", evt => {
						button.dataset.contextmenuVisible = false;
					}, {passive: true});
				}
				if (page.alias.length > 0) {
					let aliases = browser.i18n.getMessage("popup_tooltip_aliases");
					page.alias.forEach(alias => {
						aliases += `\n${alias.includes(':') ? alias : defaultScheme + alias}`;
					});
					if (title.length > 0) {
						title += `\n${aliases}`;
					} else {
						title = aliases;
					}
				}
				if (title.length > 0) {
					button.setAttribute("title", title);
				}
				content.appendChild(button);
			}
			if (content.hasChildNodes()) {
				main.appendChild(header);
				main.appendChild(content);
			}
		}
		if (!main.hasChildNodes()) {
			let pages = 0;
			categories.forEach(category => (pages += category.content.length || 0));
			main.appendChild(noKnownPages(defaultScheme, !(!showDisabledButtons && pages > 0)));
			statusSeparator.classList.add("hidden");
		} else {
			statusSeparator.classList.remove("hidden");
		}
	} catch (error) {
		console.warn(error);
		let statusMessage = document.createElement("div");
		statusMessage.appendChild(document.createTextNode(error));
		status.appendChild(statusMessage);
		statusContainer.classList.remove("hidden");
	}
}

function createTextElement(text) {
	let textElement = document.createElement("div");
	textElement.classList.add("text");
	textElement.textContent = text;
	return textElement;
}

function createSeparator() {
	let hr = document.createElement("div");
	hr.classList.add("panel-section-separator");
	return hr;
}

/**
 * Generate the {@link HTMLImgElement &lt;img&gt;} tag for the specified image.
 *
 * @param	{String}	image	The image file name
 * @return	{HTMLImgElement}	The image tag
 */
function generateImg(image) {
	let img = document.createElement("img");
	img.setAttribute("class",	"icon");
	img.setAttribute("width",	"16px");
	if (image && image.length !== 0) {
//		img.setAttribute("src",	"/icons/SVG/" + image + ".svg");
		img.setAttribute("src",	"/icons/256/" + image + ".png");
	} else {
		img.setAttribute("class",	"icon missing");
	}
	return img;
}

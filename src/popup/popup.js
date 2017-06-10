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

/**
 * @typedef {Object} AboutPage
 * @property {String} url The page URL
 * @property {?String} icon The page icon
 * @property {Boolean} privileged If the page is privileged
 * @property {?String} description The description
 * @property {?String[]} alias All the URL aliases of this page
 */
/**
 * @typedef {Object} BrowserInfo
 * @property {String} name
 * @property {String} vendor
 * @property {String} version
 * @property {String} buildID
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
		document.getElementById("showDisabledButtons").addEventListener("click", () => {
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
	} else {
		document.getElementById("header").setAttribute("style", "display: none !important;");
	}
	document.getElementById("open-options").addEventListener("click", () => {
		browser.runtime.openOptionsPage();
	});
	i18nInit();
	reload();
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
function i18nInit() {
	document.getElementById("open-options").appendChild(document.createTextNode(browser.i18n.getMessage("popup_openOptions")));
	browser.runtime.sendMessage({ method: "getScheme" }).then(protocol => {
		document.getElementById("showDisabledButtons").appendChild(document.createTextNode(browser.i18n.getMessage("popup_debugButton", protocol)));
	});
}

/**
 * (Re-)load the current popup.
 */
async function reload() {
	let main = document.getElementById("main");

	let statusContainer = document.getElementById("status-container");
	let status = document.getElementById("status");
	let content = document.createElement("div");
	content.setAttribute("id", "main-content");
	content.classList.add("panel-section", "panel-section-list")

	status.textContent = "";
	statusContainer.classList.add("hidden");

	try {
		/** @type AboutPage[] */
		let pages;
		/** @type String */
		let defaultScheme;
		/** @type Boolean */
		let showDisabledButtons;
		/** @type BrowserInfo */
		let browserInfo;

		await (browser.runtime.sendMessage({ method: "getPages" }).then(response => {
			pages	= JSON.parse(response.pages);
			defaultScheme	= response.defaultScheme;
			showDisabledButtons	= response.showDisabledButtons || false;
		}));

		if (browser.runtime.getBrowserInfo) {
			browserInfo = await browser.runtime.getBrowserInfo();
		} else {
			browserInfo = {
				// Assume running under Google Chrome for now, because the minimum
				// supported Firefox version supports `browser.runtime.getBrowserInfo()`
				// and we currently only have code for Mozilla Firefox and Google Chrome.
				// TODO: Dynamically resolve this once Opera and Edge are supported!
				name: "Chrome",
				vendor: "Google",
				version: "Unknown",
				buildID: "Unknown"
			};
		}

		if (!showDisabledButtons) {
			let statusMessage = document.createElement("div");
			statusMessage.appendChild(document.createTextNode(browser.i18n.getMessage("popup_privilegedHidden")));
			status.appendChild(statusMessage);
			statusContainer.classList.remove("hidden");
		}


		pages.forEach(page => {
			let disabled = false;
			let url = page.url.includes(':') ? page.url : defaultScheme + page.url;
			if (page.privileged && !isShimmed(page, url, browserInfo)) {
				disabled = true;
				if (!showDisabledButtons)
					return;
			}

			let button = document.createElement("div");
			let img = generateImg(page.icon);
			button.setAttribute("type", "button");
			button.classList.add("panel-list-item");
			if (disabled) {
				button.setAttribute("disabled", true);
				button.classList.add("disabled");
			}
			button.appendChild(img);
			button.appendChild(document.createTextNode(url));
			button.addEventListener("click", evt => {
				if (!page.privileged) {
					browser.tabs.create({url: url});
				} else if (usePagesShim && url === "about:addons") {
					browser.runtime.openOptionsPage();
				} else if (usePagesShim && page.shim) {
					browser.tabs.create({url: page.shim});
				} else {
					browser.tabs.create({url: "/redirect/redirect.html?dest=" + url});
				}
			});
			/** @type String */
			let title = "";
			if (page.description.length > 0) {
				if (title.length > 0)
					title += `\n${page.description}`;
				else
					title = page.description;
			}
			if (page.alias.length > 0) {
				let aliases = "Aliases:";
				page.alias.forEach(alias => {
					aliases += `\n${alias.includes(':') ? alias : defaultScheme + alias}`;
				});
				if (title.length > 0)
					title += `\n${aliases}`;
				else
					title = aliases;
			}
			if (title.length > 0)
				button.setAttribute("title", title);
			content.appendChild(button);
		});

		main.textContent = "";
		main.appendChild(content);
	} catch (error) {
		console.warn(error);
		let statusMessage = document.createElement("div");
		statusMessage.appendChild(document.createTextNode(error));
		status.appendChild(statusMessage);
		statusContainer.classList.remove("hidden");
	}
}

/**
 * Generate the {@link HTMLImgElement &lt;img&gt;} tag for the specified image.
 *
 * @param {String} image The image file name
 *
 * @return {HTMLImgElement} The image tag
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

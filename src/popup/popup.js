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

/** Used to toggle visibility of debug button. @type Boolean */
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
		let messageType = String(message.type);
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
 * @param {String} page The page to check.
 * @param {String} url The page’s url with the protocol to check.
 * @param {Object} browserInfo The browser info.
 * @returns {Boolean} If the page is shimmed.
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
 * @returns {undefined}
 */
function i18nInit() {
	document.getElementById("open-options").appendChild(document.createTextNode(browser.i18n.getMessage("popup_openOptions")));
	if (browser.runtime.getBrowserInfo) {
		browser.runtime.getBrowserInfo().then(info => {
			let protocol;

			switch (info.name) {
				default:
				case "Firefox":
					protocol = "about:";
					break;
				case "Chrome":
					protocol = "chrome://";
					break;
			}

			document.getElementById("showDisabledButtons").appendChild(document.createTextNode(browser.i18n.getMessage("popup_debugButton", protocol)));
		});
	} else {
		document.getElementById("showDisabledButtons").appendChild(document.createTextNode(browser.i18n.getMessage("popup_debugButton", "chrome://")));
	}
}

/**
 * (Re-)load the current popup.
 */
function reload() {
	let main = document.getElementById("main");

	let status = document.getElementById("status");
	let content = document.createElement("div");
	content.setAttribute("id", "main-content");

	status.textContent = "";

	browser.runtime.sendMessage({
		type: "getPages"
	}).then(response => {
		if (browser.runtime.getBrowserInfo) {
			return browser.runtime.getBrowserInfo().then(info => {
				response.browserInfo = info;
				return response;
			});
		} else {
			response.browserInfo = {
				// Assume running under Google Chrome for now, because the minimum
				// supported Firefox version supports `browser.runtime.getBrowserInfo()`
				// and we currently only have code for Mozilla Firefox and Google Chrome.
				// TODO: Dynamically resolve this once Opera and Edge are supported!
				name: "Chrome",
				vendor: "Google",
				version: "Unknown",
				buildID: "Unknown"
			};
			return response;
		}
	}).then(response => {
		let pages = JSON.parse(response.pages);
		let protocol = response.default_scheme;
		let showDisabledButtons = response.showDisabledButtons;

		if (showDisabledButtons === undefined)
			showDisabledButtons = true;
		if (!showDisabledButtons) {
			status.appendChild(document.createTextNode(browser.i18n.getMessage("popup_privilegedHidden")));
		}
		pages.forEach(page => {
			let disabled = false;
			let url = page.url.includes(':') ? page.url : protocol + page.url;
			if (page.privileged && !isShimmed(page, url, response.browserInfo)) {
				disabled = true;
				if (!showDisabledButtons)
					return;
			}

			let button = document.createElement("button");
			let img = generateImg(page.icon);
			button.setAttribute("type", "button");
			if (disabled) button.setAttribute("disabled", true);
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
			if (page.alias.length > 0) {
				let title = "Aliases:";
				page.alias.forEach(alias => {
					title += `\n${alias.includes(':') ? alias : protocol + alias}`;
				});
				button.setAttribute("title", title);
			}
			content.appendChild(button);
		});
	}).then(() => {
		main.textContent = "";
		main.appendChild(content);
	}).catch(error => {
		console.warn(error);
		status.appendChild(document.createTextNode(error));
	});
}

/**
 * Generate the &lt;img&gt; tag for the specified image.
 *
 * @param {String} image
 * @returns {HTMLImgElement}
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

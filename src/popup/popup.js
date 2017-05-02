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
let pagesShims = ["about:addons", "about:credits"];

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
	reload();
});

/**
 * Checks if the suppplied page is shimmed.
 *
 * @param {String} page The page to check.
 * @returns {Boolean} If the page is shimmed.
 */
function isShimmed(page) {
	if (usePagesShim) {
		for (let p of pagesShims) {
			if (page === p) {
				return true;
			}
		}
	}
	return false;
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
		let pages = response.pages;
		let showDisabledButtons = response.showDisabledButtons;

		if (showDisabledButtons === undefined)
			showDisabledButtons = true;
		if (!showDisabledButtons) {
			status.appendChild(document.createTextNode("Greyed-out buttons have been hidden"));
		}
		pages.forEach(page => {
			let disabled = false;
			if (page[2] && !isShimmed(page[0])) {
				disabled = true;
				if (!showDisabledButtons)
					return;
			}

			let button = document.createElement("button");
			let img = generateImg(page[1]);
			button.setAttribute("type", "button");
			if (disabled) button.setAttribute("disabled", true);
			button.appendChild(img);
			button.appendChild(document.createTextNode(page[0]));
			button.addEventListener("click", evt => {
				if (!page[2]) {
					browser.tabs.create({url: page[0]});
				} else if (usePagesShim && page[0] === "about:addons") {
					browser.runtime.openOptionsPage();
				} else if (usePagesShim && page[0] === "about:credits") {
					browser.tabs.create({url: "https://www.mozilla.org/credits/"});
				} else {
					browser.tabs.create({url: "/redirect/redirect.html?dest=" + page[0]});
				}
			});
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

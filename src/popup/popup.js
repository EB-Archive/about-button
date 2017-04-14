/* global browser */

/** Used to toggle visibility of debug button. @type Boolean */
let isDebug = false;

/** Used to allow opening of `about:addons` by opening the extension configuration page. @type Boolean */
let useAddonsShim = true;

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
			}).then((settings) => {
				browser.storage.local.set({
					showDisabledButtons: !settings.showDisabledButtons
				});
			}).catch((error) => {
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

async function reload() {
	let main = document.getElementById("main");

	let status = document.getElementById("status");
	let content = document.createElement("div");
	content.setAttribute("id", "main-content");

	status.textContent = "";

	browser.runtime.sendMessage({
		type: "getPages"
	}).then(async (response) => {
		response.showDisabledButtons = await browser.storage.local.get({
			showDisabledButtons: false
		}).then((settings) => {
			return settings.showDisabledButtons;
		}).catch((error) => {
			console.warn(error);
			return true;
		});
		return response;
	}).then(async (response) => {
		let pages = response.pages;
		let showDisabledButtons = response.showDisabledButtons;

		if (showDisabledButtons === undefined)
			showDisabledButtons = true;
		if (!showDisabledButtons) {
			status.appendChild(document.createTextNode("Greyed-out buttons have been hidden"));
		}
		pages.forEach((page) => {
			if ((page[2] && !showDisabledButtons && page[0] !== "about:addons") || (page[0] === "about:addons" && !useAddonsShim)) return;

			let button = document.createElement("button");
			let img = generateImg(page[1]);
			button.setAttribute("type", "button");
			if ((page[2] && page[0] !== "about:addons") || (page[0] === "about:addons" && !useAddonsShim))
				button.setAttribute("disabled", true);
			button.appendChild(img);
			button.appendChild(document.createTextNode(page[0]));
			button.addEventListener("click", (evt) => {
				if (!page[2]) {
					browser.tabs.create({url: page[0]});
				} else if (page[0] === "about:addons" && useAddonsShim) {
					browser.runtime.openOptionsPage();
				} else {
					browser.tabs.create({url: "/redirect/redirect.html?dest=" + page[0]});
				}
			});
			content.appendChild(button);
		});
	}).then(async () => {
		main.textContent = "";
		main.appendChild(content);
	}).catch(async (error) => {
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
	img.setAttribute("class", "icon");
	img.setAttribute("width", "16px");
	if (image && image.length !== 0) {
//		img.setAttribute("src", "/icons/SVG/" + image + ".svg");
		img.setAttribute("src", "/icons/256/" + image + ".png");
	} else {
		img.setAttribute("class", "icon missing");
	}
	return img;
}

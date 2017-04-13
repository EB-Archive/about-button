/* global browser */

document.addEventListener('DOMContentLoaded', () => {
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
	document.getElementById("open-options").addEventListener("click", () => {
		browser.runtime.openOptionsPage();
	});
	reload();
});

let use_addons_shim = true;

async function reload() {
	let status = document.getElementById("status");
	let table = document.getElementById("main-table");

	table.textContent = "";
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
			if (!page[2] && (page[0] !== "about:addons" || (page[0] === "about:addons" && !use_addons_shim)) && !showDisabledButtons) return;

			let tr = document.createElement("tr");
			let td = document.createElement("td");

			let button = document.createElement("button");
			let img = generateImg(page[1]);
			button.setAttribute("type", button);
			if (!page[2] && (page[0] !== "about:addons" || (page[0] === "about:addons" && !use_addons_shim)))
				button.setAttribute("disabled", true);
			button.appendChild(img);
			button.appendChild(document.createTextNode(page[0]));
			button.addEventListener("click", (evt) => {
				if (page[2]) {
					browser.tabs.create({url: page[0]});
				} else if (page[0] === "about:addons" && use_addons_shim) {
					browser.runtime.openOptionsPage();
				} else {
					browser.tabs.create({url: "/redirect/redirect.html?dest=" + page[0]});
				}
			});

			td.appendChild(button);
			tr.appendChild(td);
			table.appendChild(tr);
		});
	}).catch(async (error) => {
		console.warn(error);
		status.appendChild(document.createTextNode(error));
	});
}

/**
 * @param {String} path
 * @returns {HTMLImgElement}
 */
function generateImg(path) {
	let img = document.createElement("img");
	img.setAttribute("class", "icon");
	img.setAttribute("width", "16px");
	if (path && path.length !== 0) {
//		img.setAttribute("src", "/icons/SVG/" + path + ".svg");
		img.setAttribute("src", "/icons/256/" + path + ".png");
	} else {
		img.setAttribute("class", "icon missing");
	}
	return img;
}

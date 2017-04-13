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
	reload();
});

async function reload() {
	let footer = document.getElementById("footer");
	let table = document.getElementById("main-table");

	table.innerHTML = "";
	footer.innerHTML = "";

	browser.runtime.sendMessage({
		type: "getPages"
	}).then(async (response) => {
		response.showDisabledButtons = await browser.storage.local.get({
			showDisabledButtons: true
		}).then((settings) => {
			return settings.showDisabledButtons;
		}).catch((error) => {
			console.error(error);
			return true;
		});
		return response;
	}).then(async (response) => {
		let pages = response.pages;
		let showDisabledButtons = response.showDisabledButtons;

		if (showDisabledButtons === undefined)
			showDisabledButtons = true;
		if (!showDisabledButtons) {
			footer.appendChild(document.createTextNode("Disabled buttons have been hidden"));
		}
		pages.forEach((page) => {
			let tr = document.createElement("tr");
			let td = document.createElement("td");

			let button = document.createElement("button");
			let img = generateImg(page[1]);
			button.setAttribute("type", button);
			if (!page[2])
				button.setAttribute("disabled", true);
			button.appendChild(img);
			button.appendChild(document.createTextNode(page[0]));
			button.addEventListener("click", (evt) => {
				if (page[2]) {
					browser.tabs.create({url: page[0]});
				} else {
					browser.tabs.create({url: "/redirect/redirect.html?dest=" + page[0]});
				}
			});

			if (page[2] || (!page[2] && showDisabledButtons)) {
				td.appendChild(button);
				tr.appendChild(td);
				table.appendChild(tr);
			}
		});
	}).catch(async (error) => {
		console.error(error);
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

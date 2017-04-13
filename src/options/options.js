/* global browser */

/** @type HTMLInputElement */
let element_showDisabledButtons;

function reload() {
	browser.storage.local.get({
		showDisabledButtons: false
	}).then((settings) => {
		element_showDisabledButtons.checked = settings.showDisabledButtons;
	}).catch((error) => {
		element_showDisabledButtons.checked = false;
	});
}

function saveOptions() {
	browser.storage.local.set({
		showDisabledButtons: element_showDisabledButtons.checked
	}).catch((error) => {
		console.error("Could not save options");
		console.error(error);
	});
}

document.addEventListener("DOMContentLoaded", function () {
	element_showDisabledButtons = document.getElementById("showDisabledButtons");
	for(let inputElement of document.getElementsByTagName("input")) {
		let save = inputElement.hasAttribute("data-save") ? Boolean(inputElement.getAttribute("data-save")) : true;
		if (!save) continue;
		inputElement.addEventListener("input", () => {saveOptions();});
	}
	for(let inputElement of document.getElementsByTagName("button")) {
		let save = inputElement.hasAttribute("data-save") ? Boolean(inputElement.getAttribute("data-save")) : true;
		if (!save) continue;
		inputElement.addEventListener("click", () => {saveOptions();});
	}
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

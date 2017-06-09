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

/**
 * Applies internationalization to the options page.
 *
 * @returns {undefined}
 */
function i18nInit() {
	document.getElementById("showDisabledButtons_label").appendChild(document.createTextNode(browser.i18n.getMessage("options_showDisabledButtons")));
}

function saveOptions() {
	browser.storage.local.set({
		showDisabledButtons: element_showDisabledButtons.checked
	}).catch((error) => {
		console.error("Could not save options");
		console.error(error);
	});
}

document.addEventListener("DOMContentLoaded", () => {
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
	i18nInit();
	reload();
});

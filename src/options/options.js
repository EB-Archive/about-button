/*
 * Copyright 2017 ExE Boss.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

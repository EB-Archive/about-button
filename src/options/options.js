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
/// <reference path="../types.d.ts"/>
"use strict";

document.addEventListener("DOMContentLoaded", () => {
	return Promise.all([
		i18nInit(),
		loadOptions(),
	]);
});

const loadOptions = async () => {
	const flattenedData = {};
	/**
	 * @param	{*}	data
	 * @param	{string}	[key]
	 */
	const flattenData = (data, key = null) => {
		for (const k in data) {
			const flattenedKey = (key === null ? k : `${key}.${k}`);
			const value = data[k];
			if (typeof value === "object") {
				flattenData(value, flattenedKey);
			} else {
				flattenedData[flattenedKey] = value;
			}
		}
	};
	flattenData(await browser.storage.local.get());

	/** @type {HTMLElement[]} */
	const elements = document.querySelectorAll("select[data-save], input[data-save]");

	for (const e of elements) {
		const value = (e.dataset.save in flattenedData ? flattenedData[e.dataset.save] : e.dataset.saveDefault || undefined);
		switch (e.tagName.toLowerCase()) {
			case "input": {
				e.addEventListener("input", saveOptions);
				switch (e.type.toLowerCase()) {
					case "checkbox": {
						if (value !== undefined) e.checked = value;
						break;
					} default: {
						console.warn("[about-button@exe-boss]", "Unexpected element in saveOptions()", e.type, e);
						break;
					}
				}
				break;
			} case "select": {
				e.addEventListener("change", saveOptions);
				if (value !== undefined) {
					const option = e.querySelector(`[value="${value}"]`);
					for (let i = 0; i < e.options.length; i++) {
						if (e.options[e.options[i] === option]) {
							e.selectedIndex = i;
							break;
						}
					}
				}
				return;
			} default: {
				console.warn("[about-button@exe-boss]", "Unexpected element in saveOptions()", e.tagName, e);
				break;
			}
		}
	}
};

const saveOptions = async () => {
	/** @type {HTMLElement[]} */
	const elements = document.querySelectorAll("select[data-save], input[data-save]");
	const saveData = {};

	for (const e of elements) {
		const tree = e.dataset.save.split(".");
		let stackPos = saveData;
		for (let i = 0; i < tree.length; i++) {
			const key = tree[i];
			if (i === tree.length - 1) {
				switch (e.tagName.toLowerCase()) {
					case "input": {
						switch (e.type.toLowerCase()) {
							case "checkbox": {
								saveData[key] = e.checked;
								break;
							} default: {
								console.warn("[about-button@exe-boss]", "Unexpected element in saveOptions()", e.type, e);
								break;
							}
						}
						break;
					} case "select": {
						/** @type {HTMLOptionElement} */
						const selectedOption = e.item(e.selectedIndex);
						const {value} = selectedOption;
						saveData[key] = value;
						break;
					} default: {
						console.warn("[about-button@exe-boss]", "Unexpected element in saveOptions()", e.tagName, e);
						break;
					}
				}
			} else {
				if (key in stackPos) {
					stackPos = stackPos[key];
				} else {
					stackPos = (stackPos[key] = {});
				}
			}
		}
	}

	return browser.storage.local.set(saveData);
};

/**
 * Applies internationalization to the current page.
 * @return {void}
 */
const i18nInit = async () => {
	const [
		protocol,
	] = await Promise.all([
		browser.runtime.sendMessage({ method: "getScheme" }),
	]);

	return processI18n({
		protocol,
	});
};

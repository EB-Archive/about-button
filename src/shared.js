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
 * Applies internationalization to the current page.
 *
 * @returns {undefined}
 */
async function i18nInit() {
	document.querySelectorAll("[data-i18n]").forEach(translatable => {
		let text = browser.i18n.getMessage(translatable.dataset.i18n);
		if (text.length > 0) {
			insertI18n(text, translatable);
		}
	});
}

/**
 * Inserts the i18n string to the node.
 *
 * @param {String} i18n The content of messages.json
 * @param {Element} node The Node to put stuff in
 * @returns {undefined}
 */
async function insertI18n(i18n, node) {
	node.textContent = "";
	i18n.split(/\r\n|\n|\r/).forEach(text => {
		if (node.hasChildNodes()) {
			node.appendChild(document.createElement("br"));
		}
		node.appendChild(document.createTextNode(text));
	});
};

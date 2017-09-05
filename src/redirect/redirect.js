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
"use strict";
/* global browser */

/**
 * @param {String} query
 * @returns {Object}
 */
function parseQuery(query) {
	if (!query)
		query = "";

	if (query[0] === '?')
		query = query.slice(1);

	let ret = {};
	query.split('&').forEach((path) => {
		let p = path.split('=');
		ret[p[0]] = (p.length > 0 ? p[1] : true);
	});
	return ret;
}

let query = parseQuery(window.location.search);
if ('dest' in query) {
	let dest = decodeURIComponent(query.dest);

	try {
		window.location.href = dest;
	} catch (e) {
		document.addEventListener("DOMContentLoaded", () => {
			document.body.appendChild(document.createTextNode(e));
		});
	}
} else {
	document.addEventListener("DOMContentLoaded", () => {
		function createTextElement(elementName, text = undefined) {
			let element = document.createElement(elementName);
			if (text !== undefined) {
				element.appendChild(document.createTextNode(text));
			}
			return element;
		}

		document.body.appendChild(createTextElement("h1", "No redirect destination specified"));
		document.body.appendChild(document.createTextNode("The redirect destination must be specified using the "));
		document.body.appendChild(createTextElement("code", "dest"));
		document.body.appendChild(document.createTextNode(" query."));
	});
}

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

/**
 * @param	{string}	query
 * @return	{Record<string,string>}
 */
function parseQuery(query) {
	if (!query)
		query = "";

	if (query[0] === "?")
		query = query.slice(1);

	const ret = {};
	query.split("&").forEach((path) => {
		const p = path.split("=");
		ret[p[0]] = (p.length > 0 ? p[1] : true);
	});
	return ret;
}

const query = parseQuery(window.location.search);
if ("dest" in query) {
	const dest = decodeURIComponent(query.dest);

	try {
		window.location.href = dest;
	} catch (e) {
		document.addEventListener("DOMContentLoaded", () => hyperHTML(document.body)`<code>${e}</code>`);
	}
} else {
	document.addEventListener("DOMContentLoaded", () => hyperHTML(document.body)`
		<h1>No redirect destination specified</h1>
		<p>The redirect destination must be specified using the <var>dest</var> query parameter.</p>`);
}

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
	})
	return ret;
}

var error;
let dest = parseQuery(window.location.search).dest;

if (dest) {
	try {
		window.location.href = dest;
	} catch (e) {
		error = e;
		window.addEventListener("load", () => {
			document.body.appendChild(document.createTextNode(error));
		});
	}
}

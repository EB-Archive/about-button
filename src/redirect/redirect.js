
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
			let element = document.getElementById("body");
			element.appendChild(document.createTextNode(error));
		});
	}
}

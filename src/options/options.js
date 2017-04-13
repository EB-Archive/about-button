/* global browser */

function restore_options() {
	browser.storage.local.get({
		showDisabledButtons: true
	}).then((settings) => {
		document.getElementById("showDisabledButtons").checked = settings.showDisabledButtons;
	}).catch((error) => {
		document.getElementById("showDisabledButtons").checked = true;
	});
}

document.addEventListener('DOMContentLoaded', () => {restore_options()});

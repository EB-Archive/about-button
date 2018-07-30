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
 * Used to toggle visibility of the debug button.
 *
 * I’m not too worried about making this look good right
 * now, as it’s only intended for debugging purposes.
 *
 * @type	{boolean}
 */
const isDebug = false;

/**
 * Used to allow opening of:
 * <ul>
 * <li>`about:addons` by opening the extension configuration.
 * <li>`about:credits` by opening <a href="https://www.mozilla.org/credits">https://www.mozilla.org/credits</a>.
 * </ul>
 * @type	{boolean}
 */
const usePagesShim = true;

/** @type {Record<string,string[]>} */
const pagesShims = {
	"Firefox": ["about:addons", "about:credits"],
};

document.addEventListener("DOMContentLoaded", () => {
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
	browser.runtime.onMessage.addListener(async (message) => {
		const messageType = String(message.method);
		switch (messageType) {
			case "pagesChanged": {
				reload();
			}
		}
	});
	if (isDebug) {
		const button = document.getElementById("showDisabledButtons");
		button.style.display = "inline-block";
		button.addEventListener("click", async () => {
			const showDisabledButtons = await browser.storage.local.get({showDisabledButtons: false});
			return browser.storage.local.set({showDisabledButtons: !showDisabledButtons});
		});
	}
	document.getElementById("open-options").addEventListener("click", () => {
		browser.runtime.openOptionsPage();
	});
	return Promise.all([
		i18nInit(),
		reload(),
	]);
});

document.addEventListener("contextmenu", evt => {
	evt.preventDefault();
});

/**
 * Checks if the suppplied page is shimmed.
 *
 * @param	{AboutPage}	page The page to check.
 * @param	{string}	url The page’s url with the protocol to check.
 * @param	{BrowserInfo}	browserInfo The browser info.
 *
 * @return	{boolean}	If the page is shimmed.
 */
const isShimmed = (page, url, browserInfo) => {
	if (usePagesShim) {
		if (page.shim)
			return true;
		const shims = pagesShims[browserInfo.name] || [];
		for (const p of shims) {
			if (page.url === p || url === p) {
				return true;
			}
		}
	}
	return false;
};

/**
 * Applies internationalization to the popup.
 *
 * @return 	{void}
 */
const i18nInit = async () => {
	const [
		protocol,
	] = await Promise.all([
		browser.runtime.sendMessage({ method: "getScheme" }),
	]);

	hyperHTML(document.getElementById("main"))`${noKnownPages(protocol, true)}`;
	document.getElementById("status-separator").classList.add("hidden");

	return processI18n({
		protocol,
	});
};

/**
 * @param	{string}	defaultScheme
 * @param	{boolean}	[showDisabledButtons=true]
 * @return	{HTMLDivElement}
 */
const noKnownPages = (defaultScheme, showDisabledButtons = true) => {
	return hyperHTML`
		<div class="panel-section panel-section-header">
			<div class="text-section-header">
				${getMessage(`popup_unsupported_${showDisabledButtons ? "unknown" : "privilegedOnly"}`, defaultScheme)}
			</div>
		</div>`;
};

let reloadCounter = 0;

/**
 * (Re-)load the current popup.
 * @return	{void}
 */
const reload = async () => {
	if (reloadCounter++ > 0) {
		if (reloadCounter > 2)
			reloadCounter = 2;
		return undefined;
	}
	let result = await _reload();
	if (reloadCounter > 1) {
		result = await _reload();
	}
	reloadCounter = 0;
	return result;
};

/**
 * Actually (re-)load the current popup.
 *
 * @private
 */
const _reload = async () => {
	const main	= document.getElementById("main");

	const status	= document.getElementById("status");
	const statusContainer	= document.getElementById("status-container");
	const statusSeparator	= document.getElementById("status-separator");

	statusContainer.classList.add("hidden");

	try {
		/** @type {{0:{categories:Category[],dataName:string,defaultScheme:string,showDisabledButtons:boolean},1:browser.runtime.BrowserInfo}} */
		const [
			{
				categories,
				dataName,
				defaultScheme,
				showDisabledButtons,
			},
			browserInfo,
		] = await Promise.all([
			browser.runtime.sendMessage({method: "getPages"}).then(response => {
				response.showDisabledButtons	= response.showDisabledButtons || false;
				return response;
			}),
			("getBrowserInfo" in browser.runtime ? browser.runtime.getBrowserInfo() : {
				// Assume running under Google Chrome for now, because the minimum
				// supported Firefox version supports `browser.runtime.getBrowserInfo()`
				// and we currently only have code for Mozilla Firefox and Google Chrome.
				// TODO: Dynamically resolve this once Opera and Edge are supported!
				name:	"Chrome",
				vendor:	"Google",
				version:	"Unknown",
				buildID:	"Unknown",
			}),
		]);

		if (!showDisabledButtons) {
			hyperHTML(status)`<div>${getMessage("popup_privilegedHidden")}</div>`;
			statusContainer.classList.remove("hidden");
		}

		/**
		 * @param {Category} category
		 * @return {Node|null}
		 */
		const remapCategory = category => {
			/** @type {string} */
			let categoryName = getMessage(`category_${category.category}`);
			if (categoryName.length === 0) {
				// The category hasn't been translated, so let’s use the ID
				// TODO: Handle `camelCase` words
				for (/** @type {String} */ let word of category.category.split(/[\s_-]/)) {
					word = word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase();
					if (categoryName.length > 0)
						categoryName += ` ${word}`;
					else
						categoryName = word;
				}
			}
			/** @type {HTMLElement} */
			const header = hyperHTML(categoryName)`
				<header class="panel-section panel-section-header">
					<div class="text-section-header">${categoryName}</div>
				</header>`;

			/**
			 * @param {AboutPage} page
			 * @return {Node|undefined}
			 */
			const remapAboutPages = (page) => {
				if (!page) return undefined;
				// Ensure that this page is supported by this browser version
				if ("strict_min_version" in page) {
					if (browserInfo.version.localeCompare(page.strict_min_version, [], {numeric: true, caseFirst: "upper"}) < 0) {
						return undefined;
					}
				}
				if ("strict_max_version" in page) {
					let strictMaxVersion = page.strict_max_version;
					if (!/[a-zA-Z]/.test(strictMaxVersion)) {
						strictMaxVersion += "\u{10FFFF}";
					}
					if (browserInfo.version.localeCompare(strictMaxVersion, [], {numeric: true, caseFirst: "upper"}) >= 0) {
						return undefined;
					}
				}

				let disabled = false;
				/** @type {string} */
				const url = page.url.includes(":") ? page.url : defaultScheme + page.url;
				if (typeof page.privileged === "string") {
					const GTE = /^\s*>=[\t ]*(\d+(?:.\d+)*)\s*$/;
					/** @type {RegExpExecArray|string[]} */
					let result;
					if ((result = GTE.exec(page.privileged))) {
						page.privileged = (browserInfo.version.localeCompare(result[1], [], {numeric: true}) >= 0);
					}
				}
				if (page.privileged && !isShimmed(page, url, browserInfo)) {
					disabled = true;
					if (!showDisabledButtons)
						return undefined;
				}

				/** @type {HTMLDivElement} */
				const button = hyperHTML`
					<div class="panel-list-item">
						${generateImg(page.icon)}
						<div class="text">${{text: url}}</div>
					</div>`;
				if (disabled) {
					button.dataset.disabled = true;
					button.classList.add("disabled");
				}
				button.addEventListener("click", evt => {
					if (evt.button === 0 && !button.dataset.disabled) {
						if (!page.privileged) {
							browser.tabs.create({url: url});
						} else if (usePagesShim && url === "about:addons") {
							browser.runtime.openOptionsPage();
						} else if (usePagesShim && page.shim) {
							browser.tabs.create({url: (page.shim.includes(":") ? page.shim : defaultScheme + page.shim)});
						} else {
							browser.tabs.create({url: `/redirect/redirect.xhtml?dest=${encodeURIComponent(url)}`});
						}
					}
				});
				let title	= "";
				const descriptionKey	= `page_${dataName}_${page.url}`;
				/** @type {string} */
				const description	= getMessage(descriptionKey);
				if (description.length > 0 && description !== descriptionKey) {
					if (title.length > 0) {
						title += `\n${description}`;
					} else {
						title = description;
					}
				}
				if ("query" in page) {
					{
						const hasQuery = getMessage("popup_tooltip_hasQuery");
						if (title.length > 0) {
							title += `\n${hasQuery}`;
						} else {
							title = hasQuery;
						}
					}
					const menuId = `${url}-menu`;
					/** @type {HTMLMenuElement} */
					const menu = hyperHTML`<menu id="${menuId}" data-type="context"
						class="panel panel-section panel-section-list"/>`;
					for (const query in page.query) {
						if (menu.hasChildNodes()) {
							menu.appendChild(hyperHTML`<div class="panel-section-separator"/>`);
						}
						/** @type {AboutPageQuery[]} */
						const values = page.query[query];
						for (/** @type {AboutPageQuery} */ const value of values) {
							const menuitemDescriptionKey = `page_${dataName}_${page.url}_${query}_${value.value}`;
							const queryUrl = `${url}?${query}=${value.value}`;
							/** @type {string} */
							const menuitemDescription = getMessage(menuitemDescriptionKey,undefined,queryUrl);

							/** @type {HTMLDivElement} */
							const menuitem = hyperHTML`
								<div class="panel-list-item">
									${generateImg(value.icon)}
									<div class="text">${{text: menuitemDescription}}</div>
								</div>`;
							if (disabled) {
								menuitem.dataset.disabled = true;
								menuitem.classList.add("disabled");
							}
							menuitem.addEventListener("click", evt => {
								evt.stopImmediatePropagation();
								if (evt.button === 0 && !menuitem.dataset.disabled) {
									if (!page.privileged) {
										browser.tabs.create({url: queryUrl});
									} else if (usePagesShim && queryUrl === "about:addons") {
										browser.runtime.openOptionsPage();
									} else if (usePagesShim && page.shim) {
										browser.tabs.create({url: (`${page.shim.includes(":") ? page.shim : defaultScheme + page.shim}?${query}=${value.value}`)});
									} else {
										browser.tabs.create({url: `/redirect/redirect.xhtml?dest=${encodeURIComponent(queryUrl)}`});
									}
								}
							});
							menu.appendChild(menuitem);
						}
					}
					button.appendChild(menu);
					button.dataset.contextmenu = menuId;
					button.addEventListener("contextmenu", evt => {
						evt.preventDefault();
						evt.stopImmediatePropagation();
						button.dataset.contextmenuVisible = true;
					});
					button.addEventListener("mouseleave", () => {
						button.dataset.contextmenuVisible = false;
					}, {passive: true});
				}
				if (page.alias.length > 0) {
					let aliases = getMessage("popup_tooltip_aliases");
					page.alias.forEach(alias => {
						aliases += `\n${alias.includes(":") ? alias : defaultScheme + alias}`;
					});
					if (title.length > 0) {
						title += `\n${aliases}`;
					} else {
						title = aliases;
					}
				}
				if (title.length > 0) {
					button.setAttribute("title", title);
				}
				return button;
			};

			/** @type {HTMLElement} */
			const content = hyperHTML`
				<section class="panel-section panel-section-list">
					${flatten(category.content.map(remapAboutPages))}
				</section>`;

			return content.childElementCount > 0
				? hyperHTML`${header}${content}`
				: undefined;
		};
		hyperHTML(main)`${flatten(categories.map(remapCategory))}`;
		if (!main.childElementCount) {
			let pages = 0;
			categories.forEach(category => (pages += category.content.length || 0));
			hyperHTML(main)`${noKnownPages(defaultScheme, !(!showDisabledButtons && pages > 0))}`;
			statusSeparator.classList.add("hidden");
		} else {
			statusSeparator.classList.remove("hidden");
		}
	} catch (error) {
		console.error(error);
		hyperHTML(status)`<div>${error}</div>`;
		statusContainer.classList.remove("hidden");
	}
};

/**
 * Flatten an array
 * @param {Array<*[]>} array
 * @return {*[]}
 */
const flatten = (array) => {
	const result = [];
	const appendRecursive = (array) => {
		for (const e of array) {
			if (e instanceof Array) {
				appendRecursive(e);
			} else if (typeof e !== "undefined") {
				result.push(e);
			}
		}
	};
	appendRecursive(array);
	return result;
};

/**
 * Creates an <code>&lt;img&gt;</code> element for the specified image.
 *
 * @param	{string}	[image]	The image file name
 * @return	{HTMLImageElement}	The image tag
 */
const generateImg = (image) => {
	return hyperHTML`<img class="icon" src="${image && image.length > 0
		? `/icons/256/${image}.png` : undefined}"/>`;
};

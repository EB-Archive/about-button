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
/// <reference path="./types.d.ts"/>
"use strict";
/* eslint-disable no-unused-vars */

/**
 * Processes all i18n compatible tags on the page.
 *
 * @param	{Record<string,any>} [subData] The substitution data to use.
 */
const processI18n = async (subData = undefined) => {
	/**
	 * @param	{HTMLElement} translatable
	 * @return	{string[]}
	 */
	const processSubstitution = (translatable) => {
		/** @type {string[]} */
		let substitution = [];
		if (translatable.dataset.i18nSubstitution) {
			substitution = Array.from(JSON.parse(translatable.dataset.i18nSubstitution));
		}
		if ((substitution.length > 0) && (subData !== null) && (typeof subData === "object")) {
			substitution = substitution.map(sub => {
				switch (sub) {
					case "$protocol$":	return subData.protocol || "about:";
					default: {
						const subDataKey = /^\s*\$\s*(.+)\s*\$\s*$/.exec(sub);
						if (subDataKey && subData[subDataKey]) {
							return subData[subDataKey];
						}
						return sub;
					}
				}
			});
		}
		return substitution;
	};

	document.querySelectorAll("[data-i18n]").forEach(translatable => {
		const text = getMessage(translatable.dataset.i18n, processSubstitution(translatable));
		if (text.length > 0) {
			insertI18n(text, translatable);
		}
	});

	document.querySelectorAll("[data-i18n-label]").forEach(translatable => {
		const text = getMessage(translatable.dataset.i18nLabel, processSubstitution(translatable));
		if (text.length > 0) {
			translatable.setAttribute("label", text);
		}
	});

	document.querySelectorAll("[data-i18n-title]").forEach(translatable => {
		const text = getMessage(translatable.dataset.i18nTitle, processSubstitution(translatable));
		if (text.length > 0) {
			translatable.setAttribute("title", text);
		}
	});
};

/**
 * Inserts the i18n string to the node.
 *
 * @param	{string}	i18n The content of messages.json
 * @param	{Element}	node The Node to put stuff in
 */
const insertI18n = async (i18n, node) => {
	node.textContent = "";
	i18n.split(/\r\n|\n|\r/).forEach(text => {
		if (node.hasChildNodes()) {
			node.appendChild(document.createElement("br"));
		}
		node.appendChild(document.createTextNode(text));
	});
};

/**
 * Translates a message.
 *
 * @param	{string}	messageName	The name of the message, as specified in the messages.json file.
 * @param	{string[]}	[substitutions]	A single substitution string, or an array of substitution strings.
 * @param	{string}	[fallback]	The fallback text.
 * @return	{string}	Message localized for the current locale.
 */
const getMessage = (messageName, substitutions, fallback) => {
	/**
	 * Left pads a String.
	 *
	 * @param	{string}	string	The string to left pad.
	 * @param	{number}	[size=0]	The size to expand the string to.
	 * @param	{string|*}	[c=" "]	The character to use to pad the string.
	 * @return	{string}	The left padded string.
	 */
	const leftPad = (string, size = 0, c = " ") => {
		c	= String(c);
		string	= String(string);
		size	= Number(size) - string.length;
		return	(size > 0 ? c[0].repeat(size) : "") + string;
	};

	if (!/^[a-zA-Z0-9_@]+$/.test(messageName)) {
		// The message needs encoding
		const regexp = /^[a-zA-Z0-9_@]$/;
		let newMessage = "";
		for (let i = 0; i < messageName.length; i++) {
			const char = messageName.charAt(i);
			if (regexp.test(char)) {
				newMessage += char;
			} else {
				const code = messageName.charCodeAt(i);
				if (code >= 0 && code < 256) {
					newMessage += `@x${leftPad(code.toString(16).toUpperCase(), 2, 0)}`;
				} else if (code < 65536) {
					newMessage += `@u${leftPad(code.toString(16).toUpperCase(), 4, 0)}`;
				}
			}
		}
		messageName = newMessage;
	}
	const result = browser.i18n.getMessage(messageName, substitutions);
	return (fallback && (result.length === 0 || result === messageName)) ? fallback : result;
};

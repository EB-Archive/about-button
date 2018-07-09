/*
 * Copyright (C) 2018 ExE Boss
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

declare interface Message {
	/** The method */
	method:	string;
	/** The payload */
	data?:	any;
}

declare interface BrowserData {
	default:	Browser,
	browsers:	{
		[name: string]: Browser,
	},
}
declare interface Browser {
	default_scheme:	string,
	data:	string,
}

declare interface Category {
	/** The category ID */
	category:	string,
	/** All the about: pages */
	content:	AboutPage[],
}
declare interface AboutPage {
	/** The page URL */
	url:	string,
	/** The page icon */
	icon?:	string,
	/** If the page is privileged */
	privileged:	boolean,
	/** The description */
	description?:	string,
	/** All the URL aliases of this page */
	alias:	string[],
	/** All the about: page queries */
	query:	{[name: string]: AboutPageQuery[]},
	/** The minimum version of the browser that supports this page */
	strict_min_version:	string,
	/** The maximum version of the browser that supports this page */
	strict_max_version:	string,
}
declare interface AboutPageQuery {
	/** The value of the query */
	value:	string,
	/** The query icon */
	icon:	string,
}

/**
 * Processes all i18n compatible tags on the page.
 *
 * @param	{Record<string,any>} [subData] The substitution data to use.
 */
declare function processI18n(subData?: Record<string,any>): Promise<void>;

/**
 * Inserts the i18n string to the node.
 *
 * @param	{string}	i18n The content of messages.json
 * @param	{Element}	node The Node to put stuff in
 */
declare function insertI18n(i18n: string, node: Element): Promise<void>;

/**
 * Translates a message.
 *
 * @param	{string}	messageName	The name of the message, as specified in the messages.json file.
 * @param	{string[]}	[substitutions]	A single substitution string, or an array of substitution strings.
 * @param	{string}	[fallback]	The fallback text.
 * @return	{string}	Message localized for the current locale.
 */
declare function getMessage(messageName: string, substitutions?: string|string[], fallback?: string): string;

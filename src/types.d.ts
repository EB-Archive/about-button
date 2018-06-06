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

export type Message = {
	/** The method */
	method:	string;
	/** The payload */
	data?:	any;
}

export type BrowserData = {
	default:	Browser,
	browsers:	{
		[name: string]: Browser,
	},
}
export type Browser = {
	default_scheme:	string,
	data:	string,
}

export type Category = {
	/** The category ID */
	category:	string,
	/** All the about: pages */
	content:	AboutPage[],
}
export type AboutPage = {
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
export type AboutPageQuery = {
	/** The value of the query */
	value:	string,
	/** The query icon */
	icon:	string,
}

/**
 * @typedef	{Object}	AboutPageQuery
 * @property	{String}	value	The value of the query
 * @property	{String}	[icon]	The query icon
 */

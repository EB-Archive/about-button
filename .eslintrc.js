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
"use strict";
/* eslint-env node */
/* eslint sort-keys: ["error", "asc"] */

module.exports = {
	env: {
		browser: true,
		es6: true,
		webextensions: true,
	},
	extends: "@exe-boss",
	globals: {
		getMessage:	false,
		hyperHTML:	false,
		insertI18n:	false,
		processI18n:	false,
	},
	parserOptions: {
		ecmaVersion: 9,
		sourceType: "script",
	},
	root: true,
	rules: {
	},
};

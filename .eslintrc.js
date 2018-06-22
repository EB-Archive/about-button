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
	extends: "eslint:recommended",
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
		"block-scoped-var": "error",
		"comma-dangle": [
			"error",
			"always-multiline",
		],
		"consistent-return": "error",
		"consistent-this": "error",
		"dot-location": [
			"error",
			"property",
		],
		"dot-notation": "error",
		"eol-last": "error",
		eqeqeq: "error",
		indent: [
			"error",
			"tab",
			{
				SwitchCase: 1,
				ignoreComments: true,
			},
		],
		"linebreak-style": [
			"error",
			"unix",
		],
		"no-await-in-loop": "warn",
		"no-console": "off",
		"no-constant-condition": "warn",
		"no-empty": "off",
		"no-fallthrough": "warn",
		"no-new-wrappers": "error",
		"no-octal": "warn",
		"no-regex-spaces": "warn",
		"no-return-await": "error",
		"no-unused-vars": "warn",
		"operator-linebreak": "error",
		"prefer-arrow-callback": "error",
		"prefer-const": "warn",
		"prefer-destructuring": "warn",
		"prefer-template": "error",
		quotes: [
			"error",
			"double",
			{
				allowTemplateLiterals: true,
				avoidEscape: true,
			},
		],
		"require-jsdoc": "off",
		semi: [
			"error",
			"always",
		],
		"sort-imports": "error",
		strict: [
			"error",
			"global",
		],
		"valid-jsdoc": [
			"warn",
			{
				prefer: {
					arg:	"param",
					argument:	"param",
					returns:	"return",
				},
				preferType: {
					Boolean:	"boolean",
					Number:	"number",
					Object:	"object",
					String:	"string",
					function:	"Function",
				},
				requireParamDescription: false,
				requireReturn: false,
				requireReturnDescription: false,
				requireReturnType: true,
			},
		],
	},
};

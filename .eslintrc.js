"use strict";
/* eslint-env node */
/* eslint sort-keys: ["error", "asc"] */

module.exports = {
	"env": {
		"browser": true,
		"es6": true,
		"webextensions": true,
	},
	"extends": "eslint:recommended",
	"globals": {
		"getMessage":	false,
		"insertI18n":	false,
		"processI18n":	false,
	},
	"parserOptions": {
		"ecmaVersion": 9,
		"sourceType": "script",
	},
	"rules": {
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
		"eqeqeq": "error",
		"indent": [
			"error",
			"tab",
			{
				"SwitchCase": 1,
				"ignoreComments": true,
			},
		],
		"linebreak-style": [
			"error",
			"unix",
		],
		"no-await-in-loop": "warn",
		"no-console": "off",
		"no-empty": "off",
		"no-new-wrappers": "error",
		"no-octal": "warn",
		"no-unused-vars": "warn",
		"operator-linebreak": [
			"error",
			"after",
		],
		"prefer-arrow-callback": "error",
		"prefer-const": "warn",
		"prefer-destructuring": "warn",
		"quotes": [
			"error",
			"double",
			{
				"allowTemplateLiterals": true,
				"avoidEscape": true,
			},
		],
		"require-jsdoc": "off",
		"semi": [
			"error",
			"always",
		],
		"sort-imports": "error",
		"valid-jsdoc": [
			"warn",
			{
				"prefer": {
					"arg":	"param",
					"argument":	"param",
					"returns":	"return",
				},
				"preferType": {
					"Boolean":	"boolean",
					"Number":	"number",
					"Object":	"object",
					"String":	"string",
					"function":	"Function",
				},
				"requireParamDescription": false,
				"requireReturn": false,
				"requireReturnDescription": false,
				"requireReturnType": true,
			},
		],
	},
};

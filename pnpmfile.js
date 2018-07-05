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

/** @type {{resolutions:Record<string,string>}} */
const {resolutions: PACKAGE_RESOLUTIONS} = require("./package.json");
const semver = require("semver");

/**
 * @param	{Record<string,string>} dependencies
 * @param	{{log:function(*):void}}	logger
 * @return	{boolean}
 */
const applyResolutions = (dependencies, logger) => {
	if (typeof dependencies !== "object")
		return false;

	for (const key in PACKAGE_RESOLUTIONS) {
		if (key in dependencies) {
			logger.log(`   - Setting ${JSON.stringify(key)} to ${JSON.stringify(PACKAGE_RESOLUTIONS[key])}`);
			dependencies[key] = PACKAGE_RESOLUTIONS[key];
		}
	}

	return true;
};

/**
 * @param	{*}	pkg
 * @param	{{log:function(*):void}}	logger
 * @return	{*}
 */
const readPackage = (pkg, logger) => {
	const msg = [];
	const lgr = {log: m => {msg.push(m);}};

	/**
	 * @param	{string}	dependency
	 * @param	{string}	[target]
	 * @param	{Record<string,string>}	dependencies
	 * @param	{{log:function(*):void}}	logger
	 */
	const setDep = (dependency, target = null, dependencies = pkg.dependencies, logger = lgr) => {
		if (target) {
			if (dependencies[dependency]) {
				logger && logger.log && logger.log(`   - Setting ${JSON.stringify(dependency)} to ${JSON.stringify(target)}`);
			} else {
				logger && logger.log && logger.log(`   - Adding ${JSON.stringify(`${dependency}@${target}`)}`);
			}
			dependencies[dependency] = target;
		} else if (dependencies[dependency]) {
			logger && logger.log && logger.log(`   - Removing ${JSON.stringify(dependency)}`);
			delete dependencies[dependency];
		}
	};
	if (pkg.dependencies === undefined) pkg.dependencies = {};

	applyResolutions(pkg.dependencies, lgr);
	applyResolutions(pkg.devDependencies, lgr);
	applyResolutions(pkg.optionalDependencies, lgr);

	switch (pkg.name) {
		case "eslint":
			if (semver.major(pkg.version) >= 4)
				setDep("eslint-plugin-no-unsafe-innerhtml", "^1.0.16");
			break;
		case "addons-linter":
			setDep("regenerator-runtime", "0.11.x");
			break;
		case "regenerator-runtime":
			break;
	}

	if (msg.length > 0) {
		msg.unshift(`\n  Editing "${pkg.name}@${pkg.version}":`);
		logger.log(msg.join("\n"));
	}
	return pkg;
};

module.exports = {
	hooks: {
		readPackage,
	},
};

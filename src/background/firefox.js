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
/* global browser */
/* global initPage */

// Firefox specific code:

initPage("",	"firefox",	true);
initPage("about",	"cog",	true);
initPage("accounts",	"user",	true);
initPage("addons",	"plugin",	true);
initPage("about:blank",	"page-white",	false);
initPage("buildconfig",	"building",	true);
initPage("cache",	"drive",	true);
initPage("checkerboard",	"chart-line",	true);
initPage("config",	"wrench",	true);
initPage("crashes",	"error",	true);
initPage("credits",	"vcard",	true,	"https://www.mozilla.org/credits/");
initPage("debugging",	"script-lightning",	true);
initPage("devtools-toolbox",	"wrench-orange",	true);
initPage("downloads",	"drive-down",	true);
initPage("healthreport",	"heart",	true);
initPage("home",	"house",	false);
initPage("license",	"report",	false);
initPage("logo",	"picture-empty",	false);
initPage("memory",	"memory",	true);
initPage("mozilla",	"world",	true);
initPage("networking",	"world-network",	true);
initPage("newtab",	"tab",	true);
initPage("performance",	"server-lightning",	true);
initPage("plugins",	"brick",	true);
initPage("preferences",	"options-wrench",	true);
initPage("privatebrowsing",	"lock",	true);
initPage("profiles",	"group",	true);
initPage("rights",	"receipt",	false);
initPage("robots",	"user-red",	true);
initPage("serviceworkers",	"script-gear",	true);
initPage("sessionrestore",	"lightning",	true);
initPage("support",	"help",	true);
initPage("sync-log",	"page-refresh",	true);
initPage("sync-tabs",	"tabs-refresh",	true);
initPage("telemetry",	"chart-curve",	true);
initPage("webrtc",	"phone",	true);
initPage("welcomeback",	"emoticon-smile",	true);
// It has been confirmed that the following can't be used
// by other addons to inject malicious code into this extension:
//initPage("<div id=\"stuff\">inADiv</div>",	"phone.png\" style=\"background-color: red;\" data-fileext=\"",	false);


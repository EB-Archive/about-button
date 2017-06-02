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

// Chrome specific code:

initPage("about",	"cog",	false); // Also available under `chrome://chrome-urls`
initPage("accessibility",	"zoom",	false);
initPage("appcache-internals",	"application-gear",	false);
initPage("apps",	"application-double",	false);
initPage("about:blank",	"page-white",	false);
initPage("blob-internals",	"package",	false);
initPage("bookmarks",	"bookmark",	false);
initPage("cache",	"server-database",	false);
initPage("chrome",	"google",	false);
initPage("chrome-urls",	"cog",	false);
initPage("components",	"brick",	false);
initPage("conflicts",	"link-break",	false);
initPage("crashes",	"error",	false);
initPage("credits",	"vcard",	false);
initPage("device-log",	"monitor-lightning",	false);
initPage("devices",	"monitor-link",	false);
initPage("discards",	"tabs-delete-others",	false);
initPage("dns",	"world-network-magnify",	false);
initPage("downloads",	"drive-down",	false);
initPage("extensions",	"plugin",	false);
initPage("flags",	"wrench",	false);
initPage("flash",	"brick",	false);
initPage("gcm-internals",	"comments-thread",	false);
initPage("gpu",	"picture",	false);
initPage("help",	"help",	false);
initPage("histograms",	"chart-bar",	false);
initPage("history",	"time",	false);
initPage("indexeddb-internals",	"database",	false);
initPage("inspect",	"magnifier",	false);
initPage("invalidations",	"monitor-terminal",	false);
initPage("local-state",	"task",	false);
initPage("media-internals",	"film",	false);
initPage("nacl",	"brick",	false);
initPage("net-internals",	"world-network",	false);
initPage("network-errors",	"world-network-error",	false);
initPage("newtab",	"tab",	false);
initPage("omnibox",	"textfield",	false);
initPage("password-manager-internals",	"textfield-key",	false);
initPage("policy",	"receipt",	false);
initPage("predictors",	"textfield-rename",	false);
initPage("print",	"printer",	false);
initPage("profiler",	"chart-curve",	false);
initPage("quota-internals",	"database-lightning",	false);
initPage("serviceworker-internals",	"script-gear",	false);
initPage("settings",	"options-wrench",	false);
initPage("suggestions",	"textfield-magnify",	false);
initPage("supervised-user-internals",	"user-green",	false);
initPage("sync-internals",	"arrow-refresh",	false);
initPage("system",	"computer",	false);
initPage("terms",	"receipt",	false);
initPage("thumbnails",	"pictures",	false);
initPage("tracing",	"chart-line",	false);
initPage("translate-internals",	"world-comment",	false);
initPage("usb-internals",	"connect",	false);
initPage("user-actions",	"user",	false);
initPage("version",	"building",	false);
initPage("view-http-cache",	"page-world",	false);
initPage("webrtc-internals",	"phone",	false);
initPage("webrtc-logs",	"phone-plain",	false);

initPage("crash",	"cross",	true);
initPage("kill",	"tab-stop",	true);
initPage("hang",	"application-lightning",	true);
initPage("shorthang",	"application-lightning",	true);
initPage("gpuclean",	"picture-error",	true);
initPage("gpucrash",	"picture-error",	true);
initPage("gpuhang",	"picture-error",	true);
initPage("ppapiflashcrash",	"block-flash",	true);
initPage("ppapiflashhang",	"block-flash",	true);
initPage("quit",	"exit",	true);
initPage("restart",	"arrow-rotate-anticlockwise-45",	true);

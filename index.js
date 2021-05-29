/* ModuleFinder, a powercord plugin to ease plugin development
 * Copyright (C) 2021 Vendicated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

const { Plugin } = require("powercord/entities");
const { getAllModules } = require("powercord/webpack");

function unique(arr, fn) {
  const hist = {};
  const seen = Object.prototype.hasOwnProperty.bind(hist);
  return arr.filter(item => {
    const key = fn?.(item) ?? item;
    return seen(key) ? false : (hist[key] = true);
  });
}

function find(key, search, caps = 0) {
  return !key.startsWith("_") && key.toLowerCase().includes(search) && key.charAt(0)[caps ? "toUpperCase" : "toLowerCase"]() === key.charAt(0);
}

module.exports = class ModuleFinder extends Plugin {
  startPlugin() {
    powercord.api.commands.registerCommand({ command: "findmodules", executor: this.handleCommand.bind(null, this.findModules.bind(null, 0)) });
    powercord.api.commands.registerCommand({ command: "findconstants", executor: this.handleCommand.bind(null, this.findModules.bind(null, 1)) });
    powercord.api.commands.registerCommand({ command: "findcomponents", executor: this.handleCommand.bind(null, this.findComponents) });
  }

  handleCommand(fn, args) {
    if (!args.length) return { result: "ok" };

    const results = unique(fn(args[0].toLowerCase()));

    return {
      result: results.length ? "```\n" + results.join("\n") + "```" : "Nothing... It's only us two here"
    };
  }

  findComponents(search) {
    return getAllModules(m => !m.displayName?.startsWith("_") && m.displayName?.toLowerCase().includes(search), false).map(f => f.displayName);
  }

  findModules(upper, search) {
    return getAllModules(m => Object.keys(m).some(k => find(k, search, upper)) || (m.__proto__ && Object.keys(m.__proto__).some(k => find(k, search, upper))))
      .flatMap(v =>
        Object.keys(v)
          .filter(k => find(k, search, upper))
          .concat(v.__proto__ ? Object.keys(v.__proto__).filter(k => find(k, search, upper)) : [])
      )
      .filter(Boolean);
  }

  pluginWillUnload() {
    powercord.api.commands.unregisterCommand("findmodules");
    powercord.api.commands.unregisterCommand("findconstants");
    powercord.api.commands.unregisterCommand("findcomponents");
  }
};

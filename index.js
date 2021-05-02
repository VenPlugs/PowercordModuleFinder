/* ModuleFinder, a powercord plugin to ease plugin development
 * Copyright (C) 2021 Vendicated
 *
 * TwemojiEveryhwere is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ModuleFinder is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ModuleFinder.  If not, see <https://www.gnu.org/licenses/>.
 */

const { Plugin } = require("powercord/entities");
const { getAllModules } = require("powercord/webpack");

function find(key, search, caps = 0) {
  return !key.startsWith("_") && key.toLowerCase().includes(search) && key.charAt(0)[caps ? "toUpperCase" : "toLowerCase"]() === key.charAt(0);
}

module.exports = class ModuleFinder extends Plugin {
  async startPlugin() {
    powercord.api.commands.registerCommand({
      command: "findmodule",
      description: "Find modules by property",
      executor: this.handleCommand.bind(this, this.findModules)
    });
    powercord.api.commands.registerCommand({
      command: "findcomponent",
      description: "Find React components by DisplayName",
      executor: this.handleCommand.bind(this, this.findComponents)
    });
    powercord.api.commands.registerCommand({
      command: "findconstant",
      description: "Find constants",
      executor: this.handleCommand.bind(this, this.findConstants)
    });
  }

  handleCommand(fn, args) {
    const search = args[0]?.toLowerCase();
    if (!search)
      return {
        result: "ok"
      };

    const results = fn(search);
    if (!results.length)
      return {
        result: "Nothing... It's only us two here"
      };
    return {
      result: "```\n" + results.join("\n") + "```"
    };
  }

  findComponents(search) {
    return getAllModules(m => !m.displayName?.startsWith("_") && m.displayName?.toLowerCase().includes(search), false).map(f => f.displayName);
  }

  findConstants(search) {
    return getAllModules(m => Object.keys(m).some(k => find(k, search, 1)) || (m.__proto__ && Object.keys(m.__proto__).some(k => find(k, search, 1))))
      .flatMap(v =>
        Object.keys(v)
          .filter(k => find(k, search, 1))
          .concat(v.__proto__ ? Object.keys(v.__proto__).filter(k => find(k, search, 1)) : [])
      )
      .filter(Boolean);
  }

  findModules(search) {
    return getAllModules(m => Object.keys(m).some(k => find(k, search)) || (m.__proto__ && Object.keys(m.__proto__).some(k => find(k, search))))
      .flatMap(v =>
        Object.keys(v)
          .filter(k => find(k, search))
          .concat(v.__proto__ ? Object.keys(v.__proto__).filter(k => find(k, search)) : [])
      )
      .filter(Boolean);
  }

  pluginWillUnload() {
    powercord.api.commands.unregisterCommand("findmodule");
    powercord.api.commands.unregisterCommand("findcomponent");
    powercord.api.commands.unregisterCommand("findconstant");
  }
};

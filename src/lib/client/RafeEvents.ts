import { ClientEvents } from "discord.js-selfbot-v13";
import { PluginLoadFailed } from "../../classes/PluginLoadFailed";

export interface Events extends ClientEvents {
  pluginLoadStarted: [];
  pluginLoadFinished: [];
  //TODO: plugin
  pluginLoaded: [];
  pluginLoadFailed: [plugin: PluginLoadFailed];
}

import { ClientOptions } from "discord.js-selfbot-v13";
export interface RafeOptions extends ClientOptions {
  loadPrefixCommands?: boolean;
  loadPlugins?: boolean;
  loadDirs?: Array<string>;
}
export const defaultOptions: RafeOptions = {
  loadPrefixCommands: true,
};

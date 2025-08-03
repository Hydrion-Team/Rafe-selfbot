import { Client } from "discord.js-selfbot-v13";
import { defaultOptions, RafeOptions } from "../options/RafeOptions";
import { Events } from "./RafeEvents";
export interface RafeClient<Ready extends boolean = boolean>
  extends Client<Ready> {
  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean;
  on<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void
  ): this;
  once<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void
  ): this;
  off<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void
  ): this;
  addListener<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void
  ): this;
  removeListener<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void
  ): this;
  removeAllListeners<K extends keyof Events>(event?: K): this;
  listenerCount<K extends keyof Events>(event: K): number;
  listeners<K extends keyof Events>(event: K): ((...args: Events[K]) => void)[];
  rawListeners<K extends keyof Events>(
    event: K
  ): ((...args: Events[K]) => void)[];
  prependListener<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void
  ): this;
  prependOnceListener<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void
  ): this;
}
export class RafeClient<Ready extends boolean = boolean> extends Client<Ready> {
  declare options: RafeOptions;
  constructor(options: RafeOptions) {
    super({ ...defaultOptions, ...options });
    if (this.options.loadPlugins) {
    }
  }
}

export class PluginLoadFailed {
  constructor(public path: string, public error: Error) {}
}

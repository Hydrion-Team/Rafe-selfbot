//https://github.com/sapphiredev/plugins/tree/main/packages/logger
import { Console } from "console";
import { inspect, type InspectOptions } from "util";
import * as colorette from "colorette";
import type { Color } from "colorette";
import { Timestamp } from "@sapphire/timestamp";
import type { ILogger } from "./ILogger";
import { LogLevel } from "./ILogger";

export class Logger implements ILogger {
  public level: LogLevel;
  public readonly formats: Map<LogLevel, LoggerLevel>;
  public readonly join: string;
  public readonly depth: number;
  public readonly console: Console;

  private static instance: Logger | null = null;
  private static readonly LOG_METHODS: ReadonlyMap<LogLevel, keyof Console> =
    new Map([
      [LogLevel.Trace, "trace"],
      [LogLevel.Debug, "debug"],
      [LogLevel.Info, "info"],
      [LogLevel.Warn, "warn"],
      [LogLevel.Error, "error"],
      [LogLevel.Fatal, "error"],
    ]);

  private static readonly DEFAULT_COLORS: ReadonlyMap<LogLevel, Color> =
    new Map([
      [LogLevel.Trace, colorette.gray],
      [LogLevel.Debug, colorette.magenta],
      [LogLevel.Info, colorette.cyan],
      [LogLevel.Warn, colorette.yellow],
      [LogLevel.Error, colorette.red],
      [LogLevel.Fatal, colorette.bgRed],
      [LogLevel.None, colorette.white],
    ]);

  private static readonly DEFAULT_NAMES: ReadonlyMap<LogLevel, string> =
    new Map([
      [LogLevel.Trace, "TRACE"],
      [LogLevel.Debug, "DEBUG"],
      [LogLevel.Info, "INFO"],
      [LogLevel.Warn, "WARN"],
      [LogLevel.Error, "ERROR"],
      [LogLevel.Fatal, "FATAL"],
      [LogLevel.None, ""],
    ]);

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.Info;
    this.console = new Console(
      options.stdout ?? process.stdout,
      options.stderr ?? process.stderr
    );
    this.formats = this.createFormatMap(
      options.format,
      options.defaultFormat ?? options.format?.none ?? {}
    );
    this.join = options.join ?? " ";
    this.depth = options.depth ?? 0;
  }

  static getInstance(): Logger {
    if (!this.instance) {
      this.instance = new Logger();
    }
    return this.instance;
  }

  static get stylize(): boolean {
    return colorette.isColorSupported;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  has(level: LogLevel): boolean {
    return level >= this.level;
  }

  trace(...values: readonly unknown[]): void {
    this.write(LogLevel.Trace, ...values);
  }

  debug(...values: readonly unknown[]): void {
    this.write(LogLevel.Debug, ...values);
  }

  info(...values: readonly unknown[]): void {
    this.write(LogLevel.Info, ...values);
  }

  warn(...values: readonly unknown[]): void {
    this.write(LogLevel.Warn, ...values);
  }

  error(...values: readonly unknown[]): void {
    this.write(LogLevel.Error, ...values);
  }

  fatal(...values: readonly unknown[]): void {
    this.write(LogLevel.Fatal, ...values);
  }

  write(level: LogLevel, ...values: readonly unknown[]): void {
    if (level < this.level) return;

    const method = Logger.LOG_METHODS.get(level);
    const formatter = this.formats.get(level);
    const message = formatter.run(this.preprocess(values));

    switch (method) {
      case "trace":
        this.console.trace(message);
        break;
      case "debug":
        this.console.debug(message);
        break;
      case "info":
        this.console.info(message);
        break;
      case "warn":
        this.console.warn(message);
        break;
      case "error":
        this.console.error(message);
        break;
      default:
        this.console.log(message);
    }
  }

  protected preprocess(values: readonly unknown[]): string {
    const inspectOptions: InspectOptions = {
      colors: colorette.isColorSupported,
      depth: this.depth,
    };
    return values
      .map((value) =>
        typeof value === "string" ? value : inspect(value, inspectOptions)
      )
      .join(this.join);
  }

  private createFormatMap(
    options: LoggerFormatOptions,
    defaults: LoggerLevelOptions
  ): Map<LogLevel, LoggerLevel> {
    if (!options) options = {};
    const map = new Map<LogLevel, LoggerLevel>();

    for (const [level, color] of Logger.DEFAULT_COLORS) {
      const name = Logger.DEFAULT_NAMES.get(level);
      const levelOptions =
        options[this.getLevelKey(level)] ??
        this.createDefaultLevel(defaults, color, name);
      map.set(
        level,
        levelOptions instanceof LoggerLevel
          ? levelOptions
          : new LoggerLevel(levelOptions)
      );
    }

    return map;
  }

  private createDefaultLevel(
    defaults: LoggerLevelOptions,
    color: Color,
    name: string
  ): LoggerLevel {
    return new LoggerLevel({
      ...defaults,
      timestamp:
        defaults.timestamp === null
          ? null
          : { ...(defaults.timestamp ?? {}), color },
      infix: name.length ? `${color(name.padEnd(5, " "))} ` : "",
    });
  }

  private getLevelKey(level: LogLevel): keyof LoggerFormatOptions {
    const keys: Record<LogLevel, keyof LoggerFormatOptions> = {
      [LogLevel.Trace]: "trace",
      [LogLevel.Debug]: "debug",
      [LogLevel.Info]: "info",
      [LogLevel.Warn]: "warn",
      [LogLevel.Error]: "error",
      [LogLevel.Fatal]: "fatal",
      [LogLevel.None]: "none",
    };
    return keys[level];
  }
}

export class LoggerStyle {
  public readonly style: Color;

  constructor(resolvable: LoggerStyleResolvable = {}) {
    if (typeof resolvable === "function") {
      this.style = resolvable;
    } else {
      const styles = this.buildStyleArray(resolvable);
      this.style = this.combineStyles(styles);
    }
  }

  run(value: string | number): string {
    return this.style(String(value));
  }

  private buildStyleArray(options: LoggerStyleOptions): Color[] {
    const styles: Color[] = [];

    if (options.effects) {
      styles.push(...options.effects.map((effect) => colorette[effect]));
    }

    if (options.text) {
      styles.push(colorette[options.text]);
    }

    if (options.background) {
      styles.push(colorette[options.background]);
    }

    return styles;
  }

  private combineStyles(styles: Color[]): Color {
    if (styles.length === 0) return colorette.reset;
    if (styles.length === 1) return styles[0];

    return (text: string) =>
      styles.reduce((result, style) => style(result), text);
  }
}

export class LoggerTimestamp {
  public timestamp: Timestamp;
  public utc: boolean;
  public color: LoggerStyle | null;
  public formatter: LoggerTimestampFormatter;

  constructor(options: LoggerTimestampOptions = {}) {
    this.timestamp = new Timestamp(options.pattern ?? "YYYY-MM-DD HH:mm:ss");
    this.utc = options.utc ?? false;
    this.color = options.color === null ? null : new LoggerStyle(options.color);
    this.formatter = options.formatter ?? ((timestamp) => `${timestamp} `);
  }

  run(): string {
    const date = new Date();

    const result = this.utc
      ? this.timestamp.displayUTC(date)
      : this.timestamp.display(date);

    return this.formatter(this.color ? this.color.run(result) : result);
  }
}

export class LoggerLevel {
  public timestamp: LoggerTimestamp | null;
  public infix: string;
  public message: LoggerStyle | null;

  constructor(options: LoggerLevelOptions = {}) {
    this.timestamp =
      options.timestamp === null
        ? null
        : new LoggerTimestamp(options.timestamp);
    this.infix = options.infix ?? "";
    this.message =
      options.message === null ? null : new LoggerStyle(options.message);
  }

  run(content: string): string {
    const prefix = (this.timestamp?.run() ?? "") + this.infix;

    if (prefix.length) {
      const formatter = this.message
        ? (line: string) => prefix + this.message.run(line)
        : (line: string) => prefix + line;
      return content.split("\n").map(formatter).join("\n");
    }

    return this.message ? this.message.run(content) : content;
  }
}

export default Logger.getInstance();

export interface LoggerOptions {
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
  defaultFormat?: LoggerLevelOptions;
  format?: LoggerFormatOptions;
  level?: LogLevel;
  join?: string;
  depth?: number;
}

export interface LoggerFormatOptions {
  trace?: LoggerLevelOptions;
  debug?: LoggerLevelOptions;
  info?: LoggerLevelOptions;
  warn?: LoggerLevelOptions;
  error?: LoggerLevelOptions;
  fatal?: LoggerLevelOptions;
  none?: LoggerLevelOptions;
}

export interface LoggerLevelOptions {
  timestamp?: LoggerTimestampOptions | null;
  infix?: string;
  message?: LoggerStyleResolvable | null;
}

export interface LoggerTimestampOptions {
  pattern?: string;
  utc?: boolean;
  color?: LoggerStyleResolvable | null;
  formatter?: LoggerTimestampFormatter;
}

export type LoggerTimestampFormatter = (timestamp: string) => string;

export interface LoggerStyleOptions {
  effects?: LoggerStyleEffect[];
  text?: LoggerStyleText;
  background?: LoggerStyleBackground;
}

export type LoggerStyleResolvable = Color | LoggerStyleOptions;

export enum LoggerStyleEffect {
  Reset = "reset",
  Bold = "bold",
  Dim = "dim",
  Italic = "italic",
  Underline = "underline",
  Inverse = "inverse",
  Hidden = "hidden",
  Strikethrough = "strikethrough",
}

export enum LoggerStyleText {
  Black = "black",
  Red = "red",
  Green = "green",
  Yellow = "yellow",
  Blue = "blue",
  Magenta = "magenta",
  Cyan = "cyan",
  White = "white",
  Gray = "gray",
  BlackBright = "blackBright",
  RedBright = "redBright",
  GreenBright = "greenBright",
  YellowBright = "yellowBright",
  BlueBright = "blueBright",
  MagentaBright = "magentaBright",
  CyanBright = "cyanBright",
  WhiteBright = "whiteBright",
}

export enum LoggerStyleBackground {
  Black = "bgBlack",
  Red = "bgRed",
  Green = "bgGreen",
  Yellow = "bgYellow",
  Blue = "bgBlue",
  Magenta = "bgMagenta",
  Cyan = "bgCyan",
  White = "bgWhite",
  BlackBright = "bgBlackBright",
  RedBright = "bgRedBright",
  GreenBright = "bgGreenBright",
  YellowBright = "bgYellowBright",
  BlueBright = "bgBlueBright",
  MagentaBright = "bgMagentaBright",
  CyanBright = "bgCyanBright",
  WhiteBright = "bgWhiteBright",
}

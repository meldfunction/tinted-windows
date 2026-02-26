/**
 * src/logger.js — minimal structured logger
 */

const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
const level  = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;
const ts     = () => new Date().toISOString().slice(11, 23);

export const log = {
  debug: (...a) => level >= 4 && console.error(`\x1b[2m${ts()} DBG\x1b[0m`, ...a),
  info:  (...a) => level >= 3 && console.error(`\x1b[36m${ts()} INF\x1b[0m`, ...a),
  warn:  (...a) => level >= 2 && console.error(`\x1b[33m${ts()} WRN\x1b[0m`, ...a),
  error: (...a) => level >= 1 && console.error(`\x1b[31m${ts()} ERR\x1b[0m`, ...a),
};

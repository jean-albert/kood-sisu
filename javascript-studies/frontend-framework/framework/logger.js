import { Config } from './config.js';

/**
 * Logger utility with various log levels.
 */
const Logger = {
  /**
   * Logs debug messages if debug mode is enabled.
   * @param  {...any} args - values to log
   */
  debug(...args) {
    if (Config.debug) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Logs informational messages.
   * @param  {...any} args - values to log
   */
  info(...args) {
    console.info('[INFO]', ...args);
  },

  /**
   * Logs warning messages.
   * @param  {...any} args - values to log
   */
  warn(...args) {
    console.warn('[WARN]', ...args);
  },

  /**
   * Logs error messages.
   * @param  {...any} args - values to log
   */
  error(...args) {
    console.error('[ERROR]', ...args);
  }
};

export default Logger;

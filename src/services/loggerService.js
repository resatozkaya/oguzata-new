const isProduction = import.meta.env.PROD;

class Logger {
  info(...args) {
    if (!isProduction) {
      console.info(...args);
    }
  }

  log(...args) {
    if (!isProduction) {
      console.log(...args);
    }
  }

  warn(...args) {
    if (!isProduction) {
      console.warn(...args);
    }
  }

  error(...args) {
    // Hata loglarını her zaman göster
    console.error(...args);
  }

  debug(...args) {
    if (!isProduction) {
      console.debug(...args);
    }
  }
}

export const logger = new Logger();

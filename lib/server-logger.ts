import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEBUG';

interface ServerLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  component?: string;
  data?: any;
  userId?: string;
}

const LOG_COLORS = {
  INFO: '\x1b[36m',    // Cyan
  SUCCESS: '\x1b[32m', // Green
  WARNING: '\x1b[33m', // Yellow
  ERROR: '\x1b[31m',   // Red
  DEBUG: '\x1b[35m',   // Magenta
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

class ServerLogger {
  private logDir: string;
  private logFile: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private logs: ServerLogEntry[] = [];
  private maxMemoryLogs: number = 500;

  constructor() {
    // Create logs directory in project root
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'app.log');

    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Initialize log file if it doesn't exist
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }

    // Check if log file needs rotation
    this.checkLogRotation();
  }

  private formatTime(): string {
    const now = new Date();
    return now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  private checkLogRotation(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.maxLogSize) {
          const timestamp = new Date().getTime();
          const backupFile = path.join(
            this.logDir,
            `app-${timestamp}.log`
          );
          fs.renameSync(this.logFile, backupFile);
          fs.writeFileSync(this.logFile, '');
          console.log(
            `${LOG_COLORS.INFO}[Logger]${RESET} Log file rotated to ${backupFile}`
          );
        }
      }
    } catch (error) {
      console.error('Error checking log rotation:', error);
    }
  }

  private writeToFile(entry: ServerLogEntry): void {
    try {
      const logLine = JSON.stringify(entry);
      fs.appendFileSync(this.logFile, logLine + '\n');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  private consoleOutput(
    level: LogLevel,
    message: string,
    component?: string,
    data?: any
  ): void {
    const color = LOG_COLORS[level];
    const timestamp = this.formatTime();
    const componentStr = component ? `[${component}]` : '';
    
    let output = `${color}${BOLD}[${timestamp}] [${level}]${RESET} ${componentStr} ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      output += ` ${JSON.stringify(data, null, 2)}`;
    }
    
    console.log(output);
  }

  private addLog(
    level: LogLevel,
    message: string,
    component?: string,
    data?: any,
    userId?: string
  ): void {
    const entry: ServerLogEntry = {
      timestamp: this.formatTime(),
      level,
      message,
      component,
      data,
      userId,
    };

    // Add to memory
    this.logs.push(entry);
    if (this.logs.length > this.maxMemoryLogs) {
      this.logs.shift();
    }

    // Write to file
    this.writeToFile(entry);

    // Output to console
    this.consoleOutput(level, message, component, data);

    // Check if rotation needed after write
    if (Math.random() < 0.1) {
      this.checkLogRotation();
    }
  }

  // Public logging methods
  info(message: string, data?: any, component?: string, userId?: string): void {
    this.addLog('INFO', message, component, data, userId);
  }

  success(message: string, data?: any, component?: string, userId?: string): void {
    this.addLog('SUCCESS', message, component, data, userId);
  }

  warning(message: string, data?: any, component?: string, userId?: string): void {
    this.addLog('WARNING', message, component, data, userId);
  }

  error(message: string, data?: any, component?: string, userId?: string): void {
    this.addLog('ERROR', message, component, data, userId);
  }

  debug(message: string, data?: any, component?: string, userId?: string): void {
    this.addLog('DEBUG', message, component, data, userId);
  }

  // Specific event loggers
  pageView(pageName: string, userId?: string): void {
    this.info(`Page view: ${pageName}`, undefined, 'PageView', userId);
  }

  userAction(actionName: string, component: string, data?: any, userId?: string): void {
    this.info(`User action: ${actionName}`, data, component, userId);
  }

  apiRequest(method: string, endpoint: string, userId?: string): void {
    this.info(`API: ${method} ${endpoint}`, undefined, 'API', userId);
  }

  apiResponse(endpoint: string, status: number, responseTime: number, userId?: string): void {
    this.success(
      `API Response: ${endpoint} (${status})`,
      { responseTime: `${responseTime}ms` },
      'API',
      userId
    );
  }

  apiError(endpoint: string, status: number, error: any, userId?: string): void {
    this.error(
      `API Error: ${endpoint}`,
      { status, error: error?.message || error },
      'API',
      userId
    );
  }

  reportGenerated(studentName: string, reportConfig: any, userId?: string): void {
    this.success(
      `Report generated: ${studentName}`,
      reportConfig,
      'Reports',
      userId
    );
  }

  databaseQuery(query: string, executionTime: number, userId?: string): void {
    this.debug(
      `DB Query executed`,
      { query: query.substring(0, 100), executionTime: `${executionTime}ms` },
      'Database',
      userId
    );
  }

  databaseError(query: string, error: any, userId?: string): void {
    this.error(
      `DB Error`,
      { query: query.substring(0, 100), error: error?.message || error },
      'Database',
      userId
    );
  }

  // Get logs
  getLogs(limit?: number): ServerLogEntry[] {
    if (limit) {
      return this.logs.slice(-limit);
    }
    return [...this.logs];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared', undefined, 'System');
  }

  // Get log file path for reference
  getLogFilePath(): string {
    return this.logFile;
  }

  // Get logs directory
  getLogsDirectory(): string {
    return this.logDir;
  }
}

// Global server logger instance
export const serverLogger = new ServerLogger();

// Log app startup
serverLogger.info('Application started', { version: '1.0.0', env: process.env.NODE_ENV }, 'System');

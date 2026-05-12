// Centralized logging utility
type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
}

const LOG_COLORS = {
  INFO: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  DEBUG: '#8B5CF6',
};

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory
  private sendToServer = false; // Send logs to backend

  private formatTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  private addLog(level: LogLevel, message: string, data?: any, component?: string): void {
    const entry: LogEntry = {
      timestamp: this.formatTime(),
      level,
      message,
      data,
      component,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.consoleLog(level, message, data, component);
    
    // Send to server for logging (don't await, fire and forget)
    if (this.sendToServer) {
      this.sendToServer_internal(level, message, data, component);
    }
  }

  private consoleLog(level: LogLevel, message: string, data?: any, component?: string): void {
    const color = LOG_COLORS[level];
    const timestamp = this.formatTime();
    const componentStr = component ? `[${component}]` : '';
    const prefix = `%c[${timestamp}] ${level} ${componentStr}`;

    if (data) {
      console.log(
        prefix,
        `color: ${color}; font-weight: bold;`,
        message,
        data
      );
    } else {
      console.log(
        prefix,
        `color: ${color}; font-weight: bold;`,
        message
      );
    }
  }

  private sendToServer_internal(level: LogLevel, message: string, data?: any, component?: string): void {
    try {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          component,
          data,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail if server logging fails
      });
    } catch (error) {
      // Silently fail
    }
  }

  // Logging methods
  info(message: string, data?: any, component?: string): void {
    this.addLog('INFO', message, data, component);
  }

  success(message: string, data?: any, component?: string): void {
    this.addLog('SUCCESS', message, data, component);
  }

  warning(message: string, data?: any, component?: string): void {
    this.addLog('WARNING', message, data, component);
  }

  error(message: string, data?: any, component?: string): void {
    this.addLog('ERROR', message, data, component);
  }

  debug(message: string, data?: any, component?: string): void {
    this.addLog('DEBUG', message, data, component);
  }

  // Specific event loggers
  pageNavigation(pageName: string, from?: string): void {
    this.info(`Navigation to ${pageName}`, from ? { from } : undefined, 'Navigation');
  }

  buttonClick(buttonName: string, component?: string): void {
    this.info(`Button clicked: ${buttonName}`, undefined, component || 'Button');
  }

  formSubmit(formName: string, data?: any): void {
    this.info(`Form submitted: ${formName}`, data, 'Form');
  }

  formChange(fieldName: string, value: any, formName?: string): void {
    this.debug(`Form field changed: ${fieldName}`, { value }, formName ? `Form:${formName}` : 'Form');
  }

  reportGeneration(studentName: string, reportConfig: any): void {
    this.success(`Report generated for ${studentName}`, reportConfig, 'Reports');
  }

  stateChange(componentName: string, stateName: string, newValue: any): void {
    this.debug(`State changed: ${stateName}`, { value: newValue }, componentName);
  }

  apiCall(method: string, endpoint: string): void {
    this.info(`API Call: ${method} ${endpoint}`, undefined, 'API');
  }

  apiResponse(endpoint: string, status: number, data?: any): void {
    this.success(`API Response: ${endpoint}`, { status, data }, 'API');
  }

  apiError(endpoint: string, error: any): void {
    this.error(`API Error: ${endpoint}`, error, 'API');
  }

  modalOpen(modalName: string, data?: any): void {
    this.info(`Modal opened: ${modalName}`, data, 'Modal');
  }

  modalClose(modalName: string): void {
    this.info(`Modal closed: ${modalName}`, undefined, 'Modal');
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared', undefined, 'System');
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Print summary
  printSummary(): void {
    console.table(this.logs);
  }

  // Disable server logging
  disableServerLogging(): void {
    this.sendToServer = false;
    this.info('Server logging disabled', undefined, 'System');
  }

  // Enable server logging
  enableServerLogging(): void {
    this.sendToServer = true;
    this.info('Server logging enabled', undefined, 'System');
  }
}

// Global logger instance
export const logger = new Logger();

// Make available in window for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
}

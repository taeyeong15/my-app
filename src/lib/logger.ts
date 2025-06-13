import winston from 'winston';
import 'winston-daily-rotate-file';
import mysql from 'mysql2/promise';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    // 에러 레벨 로그는 error.log 파일에 저장
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    // 모든 레벨의 로그는 combined.log 파일에 저장
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// 개발 환경에서는 콘솔에도 로그 출력
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export interface LogEntry {
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  requestData?: object;
}

export async function writeLog(entry: LogEntry): Promise<void> {
  try {
    await pool.execute(
      `INSERT INTO system_logs (level, message, user_id, ip_address, user_agent, context) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry.level,
        entry.message,
        entry.userId || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.requestData ? JSON.stringify(entry.requestData) : null,
      ]
    );
  } catch (error) {
    console.error('로그 기록 실패:', error);
    // 로그 기록 실패가 애플리케이션을 중단시키지 않도록 함
  }
}

// 편의 함수들
export const dbLogger = {
  debug: (message: string, data?: object, userId?: number, ipAddress?: string, userAgent?: string) => 
    writeLog({ level: 'debug', message, userId, ipAddress, userAgent, requestData: data }),
  
  info: (message: string, data?: object, userId?: number, ipAddress?: string, userAgent?: string) => 
    writeLog({ level: 'info', message, userId, ipAddress, userAgent, requestData: data }),
  
  warning: (message: string, data?: object, userId?: number, ipAddress?: string, userAgent?: string) => 
    writeLog({ level: 'warning', message, userId, ipAddress, userAgent, requestData: data }),
  
  error: (message: string, data?: object, userId?: number, ipAddress?: string, userAgent?: string) => 
    writeLog({ level: 'error', message, userId, ipAddress, userAgent, requestData: data }),
};

export { logger }; 
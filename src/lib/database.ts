import mysql from 'mysql2/promise';
import { getDecryptedEnvValue } from './crypto';

// Next.js 개발 모드에서 Hot Reload로 인한 중복 인스턴스 생성 방지
declare global {
  var __db: DatabaseManager | undefined;
}

// 환경별 데이터베이스 설정
const getDbConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig = {
    host: getDecryptedEnvValue('DB_HOST') || 'localhost',
    user: getDecryptedEnvValue('DB_USER') || 'root',
    password: getDecryptedEnvValue('DB_PASSWORD') || 'ansxodud2410!',
    database: getDecryptedEnvValue('DB_NAME') || 'auth_db',
    port: parseInt(getDecryptedEnvValue('DB_PORT') || '3306'),
    waitForConnections: true,
    connectionLimit: env === 'production' ? 20 : 5,
    queueLimit: 0,
    idleTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  // 환경별 추가 설정
  if (env === 'production') {
    const prodConfig: any = { ...baseConfig };
    if (process.env.DB_SSL_ENABLED === 'true') {
      prodConfig.ssl = { rejectUnauthorized: true };
    }
    return prodConfig;
  } else if (env === 'test') {
    return {
      ...baseConfig,
      database: getDecryptedEnvValue('DB_TEST_NAME') || 'campaign_db_test',
      connectionLimit: 3
    };
  }

  return baseConfig;
};

// 싱글톤 패턴으로 DB 연결 풀 관리
class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: mysql.Pool;

  private constructor() {
    this.pool = mysql.createPool(getDbConfig());

    // 연결 풀 이벤트 리스너 (개발 모드에서만)
    if (process.env.NODE_ENV === 'development') {
      this.pool.on('connection', (connection: any) => {
        console.log('새 DB 연결 생성:', connection.threadId);
      });

      this.pool.on('release', (connection: any) => {
        console.log('DB 연결 반환:', connection.threadId);
      });
    }

    this.pool.on('error', (err: any) => {
      console.error('DB 연결 풀 오류:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('DB 연결이 끊어졌습니다. 재연결을 시도합니다.');
      }
    });

    // 주기적인 연결 상태 확인 제거 (불필요한 연결 생성 방지)
    // setInterval(() => {
    //   this.pool.query('SELECT 1')
    //     .catch(err => {
    //       console.error('DB 연결 상태 확인 중 오류:', err);
    //     });
    // }, 30000);
  }

  public static getInstance(): DatabaseManager {
    // 개발 모드에서 global 객체 사용하여 Hot Reload 문제 해결
    if (process.env.NODE_ENV === 'development') {
      if (!global.__db) {
        global.__db = new DatabaseManager();
      }
      return global.__db;
    }

    // 프로덕션 모드에서는 기존 싱글톤 패턴 사용
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getPool(): mysql.Pool {
    return this.pool;
  }

  public async getConnection(): Promise<mysql.PoolConnection> {
    const connection = await this.pool.getConnection();
    
    // 연결 에러 핸들링
    connection.on('error', (err) => {
      console.error('DB 연결 오류:', err);
      connection.release();
    });
    
    return connection;
  }

  public async execute(query: string, params?: any[]): Promise<any> {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(query, params);
      return result;
    } catch (error) {
      console.error('쿼리 실행 오류:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  public async executeTransaction(queries: Array<{ query: string; params?: any[] }>): Promise<any[]> {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const { query, params } of queries) {
        const result = await connection.execute(query, params);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('DB 연결 풀이 종료되었습니다.');
    } catch (error) {
      console.error('DB 연결 풀 종료 중 오류:', error);
    }
  }
}

// 전역에서 사용할 인스턴스 내보내기
export const db = DatabaseManager.getInstance();
export const pool = db.getPool(); 
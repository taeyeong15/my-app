import mysql from 'mysql2/promise';

// 싱글톤 패턴으로 DB 연결 풀 관리
class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: mysql.Pool;

  private constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'ansxodud2410!',
      database: process.env.DB_NAME || 'auth_db',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 50, // 연결 제한 증가
      queueLimit: 10, // 큐 제한 설정
      enableKeepAlive: true, // 연결 유지 활성화
      keepAliveInitialDelay: 10000, // 10초마다 keepalive
      idleTimeout: 60000, // 1분 후 미사용 연결 종료
    });

    // 연결 풀 이벤트 리스너
    this.pool.on('connection', (connection: any) => {
      console.log('새 DB 연결 생성:', connection.threadId);
    });

    // @ts-ignore - mysql2 타입 정의 문제로 임시 무시
    this.pool.on('error', (err: any) => {
      console.error('DB 연결 풀 오류:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('DB 연결이 끊어졌습니다. 재연결을 시도합니다.');
      }
    });

    // 주기적으로 연결 상태 확인
    setInterval(() => {
      this.pool.query('SELECT 1')
        .catch(err => {
          console.error('DB 연결 상태 확인 중 오류:', err);
        });
    }, 30000); // 30초마다 확인
  }

  public static getInstance(): DatabaseManager {
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
    // 연결 타임아웃 설정
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
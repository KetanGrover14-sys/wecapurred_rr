import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.MYSQL_HOST,
      port:     parseInt(process.env.MYSQL_PORT || '3306'),
      database: process.env.MYSQL_DATABASE,
      user:     process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

export const query = (sql, params) => getPool().query(sql, params);

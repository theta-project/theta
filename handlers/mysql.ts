import mysql from 'mysql';
import sqlstring from 'sqlstring';
import config from '../config';

const pool: mysql.Pool = mysql.createPool({
	host: 'localhost',
	user: config.mysql.username,
	password: config.mysql.password,
	database: 'theta'
});

export function query(sql: string, ...args: any[]) {
	return new Promise((resolve, reject) => {
		pool.getConnection((error, connection) => {
			if (error) {
				reject(error);
				connection.release();
				return;
			}

			connection.query(sqlstring.format(sql, args), (error, result) => {
				if (error) reject(error);
				else resolve(result);
				connection.release();
			});
		});
	})
}
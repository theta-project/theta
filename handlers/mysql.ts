import mysql from 'mysql-commands';
import config from '../config';

export default mysql.createConnection({
	host: 'localhost',
	user: config.mysql.username,
	password: config.mysql.password,
	database: 'theta'
});
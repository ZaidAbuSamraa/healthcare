const pool = require('../config/database');

class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
        this.pool = pool;
    }

    async findAll(where = {}, orderBy = 'id') {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        
        const keys = Object.keys(where);
        if (keys.length > 0) {
            query += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
            params.push(...Object.values(where));
        }
        query += ` ORDER BY ${orderBy}`;
        
        const [rows] = await this.pool.query(query, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await this.pool.query(
            `SELECT * FROM ${this.tableName} WHERE id = ?`, [id]
        );
        return rows[0] || null;
    }

    async findOne(where) {
        const keys = Object.keys(where);
        const query = `SELECT * FROM ${this.tableName} WHERE ${keys.map(k => `${k} = ?`).join(' AND ')} LIMIT 1`;
        const [rows] = await this.pool.query(query, Object.values(where));
        return rows[0] || null;
    }

    async create(data) {
        const keys = Object.keys(data);
        const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
        const [result] = await this.pool.query(query, Object.values(data));
        return { id: result.insertId, ...data };
    }

    async update(id, data) {
        const keys = Object.keys(data);
        const query = `UPDATE ${this.tableName} SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`;
        const [result] = await this.pool.query(query, [...Object.values(data), id]);
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await this.pool.query(
            `DELETE FROM ${this.tableName} WHERE id = ?`, [id]
        );
        return result.affectedRows > 0;
    }

    async count(where = {}) {
        let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const params = [];
        const keys = Object.keys(where);
        if (keys.length > 0) {
            query += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
            params.push(...Object.values(where));
        }
        const [rows] = await this.pool.query(query, params);
        return rows[0].count;
    }

    async query(sql, params = []) {
        const [rows] = await this.pool.query(sql, params);
        return rows;
    }
}

module.exports = BaseRepository;

const knex = require('knex');
require('dotenv').config();

const db = knex({
    client: 'pg', // Specifies that we're using PostgreSQL as the database client
    connection: {
        host: process.env.DB_HOST, // Database host (e.g., 'localhost')
        user: process.env.DB_USER, // Database user (e.g., 'postgres')
        password: process.env.DB_PASSWORD, // Database password
        database: process.env.DB_NAME, // Database name (e.g., 'peerlearn_db')
        port: process.env.DB_PORT || 5432 // Database port (defaults to 5432 if not specified)
    },
    pool: { min: 0, max: 10 } // Connection pool settings: minimum 0, maximum 10 connections
});

module.exports = db;
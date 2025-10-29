require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function connectToDb() {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Successfully connected to PostgreSQL database!");
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
}

module.exports = { pool, connectToDb };

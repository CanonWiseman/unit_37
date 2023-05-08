"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");
const key = require("./secret");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: "postgres://postgres:" + key + "@localhost:5432/jobly",
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    connectionString: "postgres://postgres:" + key + "@localhost:5432/jobly"
  });
}

db.connect();

module.exports = db;
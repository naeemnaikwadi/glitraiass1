const { Client } = require("pg");
require("dotenv").config();

(async () => {
  console.log(process.env.DATABASE_URL);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const r = await client.query("SELECT current_database(), current_user");

  console.log(r.rows);

  await client.end();
})();
// Update with your config settings.

module.exports = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env_DB_HOST || "db",
      database: process.env.DB_NAME || "sbir_ehb",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "sbir",
    },
  },

  production: {
    client: "postgresql",
    connection: {
      host: process.env_DB_HOST,
      database: process.env.DB_NAME || "sbir_ehb",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
  },
};

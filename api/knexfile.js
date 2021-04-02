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
    seeds: {
      directory: "./data/seed",
    },
  },

  production: {
    client: "postgresql",
    connection: process.env.DATABASE_URL,
  },
};

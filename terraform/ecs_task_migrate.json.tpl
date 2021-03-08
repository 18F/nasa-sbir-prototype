[
  {
    "name": "database_migration",
    "image": "${REPOSITORY_URL}:${IMAGE_VERSION}",
    "command": ["npx", "knex", "migrate:latest"],
    "environment": [{
      "name": "NODE_ENV",
      "value": "production"
    },{
      "name": "DATABASE_URL",
      "value": "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}"
    }],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${LOG_GROUP}",
        "awslogs-region": "${LOG_REGION}",
        "awslogs-stream-prefix": "ehb-ecs-migration"
      }
    }
  }
]
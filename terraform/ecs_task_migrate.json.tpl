[
  {
    "name": "database_migration",
    "image": "${REPOSITORY_URL}:${IMAGE_VERSION}",
    "command": ["npx", "knex", "migrate:latest"],
    "environment": [{
      "name": "NODE_ENV",
      "value": "production"
    }],
    "secrets": [{
      "name": "DATABASE_URL",
      "valueFrom": "${DB_URL_ARN}"
    }],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${LOG_GROUP}",
        "awslogs-region": "${LOG_REGION}",
        "awslogs-stream-prefix": "ehb-ecs-database"
      }
    }
  }
]
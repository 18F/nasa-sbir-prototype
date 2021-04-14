[
  {
    "name": "database_seed",
    "image": "${REPOSITORY_URL}:${IMAGE_VERSION}",
    "command": ["npx", "knex", "seed:run"],
    "environment": [{
      "name": "NODE_ENV",
      "value": "production"
    },{
      "name": "S3_REGION",
      "value": "${S3_REGION}"
    },{
      "name": "S3_DATA_BUCKET",
      "value": "${S3_DATA_BUCKET}"
    },{
      "name": "S3_DATA_FILE",
      "value": "${S3_DATA_FILE}"
    },{
      "name": "DATABASE_URL",
      "value": "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}"
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
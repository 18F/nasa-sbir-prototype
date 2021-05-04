[
  {
    "essential": true,
    "name": "api",
    "image": "${REPOSITORY_URL}:${IMAGE_VERSION}",
    "environment": [{
      "name": "PORT",
      "value": "${PORT}"
    },{
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
        "awslogs-stream-prefix": "ehb-ecs"
      }
    },
    "portMappings": [
      {
        "containerPort": ${PORT},
        "hostPort": ${PORT}
      }
    ]
  }
]
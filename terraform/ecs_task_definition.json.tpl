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
    },{
      "name": "DATABASE_URL",
      "value": "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/ehb"
    }],
    "portMappings": [
      {
        "containerPort": ${PORT},
        "hostPort": ${PORT}
      }
    ]
  }
]
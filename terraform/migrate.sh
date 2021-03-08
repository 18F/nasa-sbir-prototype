#!/usr/bin/env bash

aws ecs --profile tts-sandbox run-task \
  --task-definition "$(terraform output -raw migration_task_definition)" \
  --cluster "$(terraform output -raw api_cluster)" \
  --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw subnet_private)],securityGroups=[$(terraform output -raw task_security_group)],assignPublicIp=DISABLED}" \
  --launch-type FARGATE
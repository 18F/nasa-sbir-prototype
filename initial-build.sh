#!/usr/bin/env bash

if [ ! -f variables.tfvars.json ]; then
  echo
  echo "Make sure there is a variables.tfvars.json file in this directory."
  echo "Refer to README.md for instructions about which variables must be"
  echo "defined and what they refer to."
  echo
  exit 1
fi

# Create the infrastructure.
cd terraform
terraform apply --var-file=../variables.tfvars.json -auto-approve

REGISTRY_URL="$(terraform output -raw container_registry_url)"

# Log Docker into the AWS ECR registry
aws ecr \
  --profile="$(terraform output -raw aws_profile)" \
  get-login-password \
  --region "$(terraform output -raw aws_region)" | \
  docker login \
  --username AWS \
  --password-stdin \
  "$(echo $REGISTRY_URL | awk -F/ '{print $1}')"

# Build the image
docker build -t "$REGISTRY_URL":1.0 -f ../api/Dockerfile.prod ../api
docker tag "$REGISTRY_URL":1.0 "$REGISTRY_URL":latest

docker push "$REGISTRY_URL":latest
docker push "$REGISTRY_URL":1.0

# Migrate the database schema
aws ecs \
  --profile="$(terraform output -raw aws_profile)" \
  run-task \
  --task-definition "$(terraform output -raw migration_task_definition)" \
  --cluster "$(terraform output -raw api_cluster)" \
  --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw subnet_private)],securityGroups=[$(terraform output -raw task_security_group)],assignPublicIp=DISABLED}" \
  --launch-type FARGATE

#### --- need to wait here for the migration to finish ---

# Seed the database with initial set of stuff
aws ecs \
  --profile="$(terraform output -raw aws_profile)" \
  run-task \
  --task-definition "$(terraform output -raw seed_task_definition)" \
  --cluster "$(terraform output -raw api_cluster)" \
  --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw subnet_private)],securityGroups=[$(terraform output -raw task_security_group)],assignPublicIp=DISABLED}" \
  --launch-type FARGATE

API_URL="http://$(terraform output -raw api_dns)"

cat > ../web/src/env.js << EOF
export default {
  API_URL: "${API_URL}",
};
EOF


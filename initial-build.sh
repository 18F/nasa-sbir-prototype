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

PROFILE="$(terraform output -raw aws_profile)"
REGION="$(terraform output -raw aws_region)"
REGISTRY_URL="$(terraform output -raw container_registry_url)"

# Log Docker into the AWS ECR registry
aws ecr \
  --profile="$PROFILE" \
  get-login-password \
  --region "$REGION" | \
  docker login \
  --username AWS \
  --password-stdin \
  "$(echo $REGISTRY_URL | awk -F/ '{print $1}')"

# Build the image
docker build -t "$REGISTRY_URL":1.0 -f ../api/Dockerfile.prod ../api
docker tag "$REGISTRY_URL":1.0 "$REGISTRY_URL":latest

docker push "$REGISTRY_URL":latest
docker push "$REGISTRY_URL":1.0

run_task () {
  aws ecs \
    --profile="$PROFILE" \
    run-task \
    --task-definition "$(terraform output -raw $1_task_definition)" \
    --cluster "$(terraform output -raw api_cluster)" \
    --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw subnet_private)],securityGroups=[$(terraform output -raw task_security_group)],assignPublicIp=DISABLED}" \
    --launch-type FARGATE
}

# Migrate the database schema and then seed it with data
run_task "migration"
#### --- need to wait here for the migration to finish ---
run_task "seed"

API_URL="http://$(terraform output -raw api_dns)"

cat > ../web/src/env.js << EOF
export const API_URL = "${API_URL};

export default {
  API_URL,
};
EOF


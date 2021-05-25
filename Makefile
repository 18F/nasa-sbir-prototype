.PHONY: help deploy migrate seed

help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build infrastructure defined in Terraform scripts to AWS
	cd terraform && \
		terraform apply \
			-auto-approve \
			--var-file ../variables.tfvars.json
	
	@echo
	@echo Prototype URL:
	@cd terraform && terraform output -raw api_dns
	@echo
	@echo

destroy: ## Destroy AWS infrastructure created by Terraform
	cd terraform && \
		terraform destroy \
			-auto-approve \
			--var-file ../variables.tfvars.json

deploy: CLUSTER=$(shell cd terraform && terraform output -raw api_cluster)
deploy: PROFILE=$(shell cd terraform && terraform output -raw aws_profile)
deploy: REGION=$(shell cd terraform && terraform output -raw aws_region)
deploy: REGISTRY_URL=$(shell cd terraform && terraform output -raw container_registry_url)
deploy: SERVICE=$(shell cd terraform && terraform output -raw api_service)
deploy: ## Build and deploy the app into AWS infrastructure
	@if [ -z "$(version)" ]; then \
		echo "Deploying requires a version number to tag created images."; \
		echo ""; \
		echo "Usage:"; \
		echo "make deploy version=[version]"; \
		echo ""; \
		exit 2; \
	fi

	@echo "Logging into AWS ECS registry..."
	@aws ecr \
		--profile="$(PROFILE)" \
		get-login-password \
		--region "$(REGION)" | \
		docker login \
		--username AWS \
		--password-stdin \
		"$(shell echo $(REGISTRY_URL) | awk -F/ '{print $1}')"
	
	docker build -t "$(REGISTRY_URL)":$(version) -f ./api/Dockerfile.prod ./api
	docker tag "$(REGISTRY_URL)":$(version) "$(REGISTRY_URL)":latest

	docker push "$(REGISTRY_URL)":$(version)
	docker push "$(REGISTRY_URL)":latest

	@echo "Ordering a new ECS deployment"
	@aws ecs \
		--profile="$(PROFILE)" \
		update-service \
		--force-new-deployment \
		--service "$(SERVICE)" \
		--cluster "$(CLUSTER)" \
		--no-cli-pager

migrate: CLUSTER=$(shell cd terraform && terraform output -raw api_cluster)
migrate: PROFILE=$(shell cd terraform && terraform output -raw aws_profile)
migrate: SECURITY_GROUP=$(shell cd terraform && terraform output -raw task_security_group)
migrate: SUBNET=$(shell cd terraform && terraform output -raw subnet_private)
migrate: TASK=$(shell cd terraform && terraform output -raw migration_task_definition)
migrate: ## Update the database schema to the most recent version
	@echo "Running migration task"
	@aws ecs \
		--profile="$(PROFILE)" \
		run-task \
		--task-definition "$(TASK)" \
		--cluster "$(CLUSTER)" \
		--network-configuration "awsvpcConfiguration={subnets=[$(SUBNET)],securityGroups=[$(SECURITY_GROUP)],assignPublicIp=DISABLED}" \
		--launch-type FARGATE \
		--no-cli-pager

seed: CLUSTER=$(shell cd terraform && terraform output -raw api_cluster)
seed: PROFILE=$(shell cd terraform && terraform output -raw aws_profile)
seed: SECURITY_GROUP=$(shell cd terraform && terraform output -raw task_security_group)
seed: SUBNET=$(shell cd terraform && terraform output -raw subnet_private)
seed: TASK=$(shell cd terraform && terraform output -raw seed_task_definition)
seed: ## Seed the database with sample data. Removes existing data.
	@echo "Running seed task"
	@aws ecs \
		--profile="$(PROFILE)" \
		run-task \
		--task-definition "$(TASK)" \
		--cluster "$(CLUSTER)" \
		--network-configuration "awsvpcConfiguration={subnets=[$(SUBNET)],securityGroups=[$(SECURITY_GROUP)],assignPublicIp=DISABLED}" \
		--launch-type FARGATE \
		--no-cli-pager
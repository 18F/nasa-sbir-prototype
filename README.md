# Prototype for NASA SBIR infrastructure

1. Build all the infrastructure
   ```bash
   cd terraform
   terraform apply
   ```

2. Log into the AWS container registry
   ```bash
   aws ecr get-login-password --region [whichever] | docker login \
     --username AWS \
     --password-stdin \
     001907687576.dkr.ecr.us-east-2.amazonaws.com
   ```
   **NOTE** that the address to log into may change. Log into the AWS management
   console, [browse to the ECR page](https://us-east-2.console.aws.amazon.com/ecr/repositories),
   click the `ehb-prototype-api` repository, and click the "View push commands"
   button at the top of the page for instructions.

3. Build the API Docker image
   ```bash
   docker build \
     -t 001907687576.dkr.ecr.us-east-2.amazonaws.com/ehb-prototype-api:latest \
     api \
     -f api/Dockerfile.prod
   ```

4. Push the Docker image to the AWS container registry
   ```bash
   docker push 001907687576.dkr.ecr.us-east-2.amazonaws.com/ehb-prototype-api:latest
   ```

5. Shortly after the image gets pushed up, AWS will start the API service. In
   the meantime, you'll want to go ahead and setup the database. Run the initial
   migration, relying on outputs from Terraform.
   ```bash
   cd terraform
   aws ecs run-task \
     --task-definition "$(terraform output -raw migration_task_definition)" \
     --cluster "$(terraform output -raw api_cluster)" \
     --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw subnet_private)],securityGroups=[$(terraform output -raw task_security_group)],assignPublicIp=DISABLED}" \
     --launch-type FARGATE
   ```

6. Hooray, your thing is online! You can find the URL for the API with Terraform
   ```bash
   cd terraform
   terraform output api_dns
   ```

## Contributing

Please read the [contribution guidelines](CONTRIBUTING.md) before submitting a
pull request.

## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related
> rights in the work worldwide are waived through the
> [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull
> request, you are agreeing to comply with this waiver of copyright interest.

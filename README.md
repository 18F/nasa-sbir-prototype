# Prototype for NASA SBIR infrastructure

## 1. Build the infrastructure

```bash
cd terraform
terraform apply
```

There are some configuration variables that **_must_** be set, and several
others that have reasonable defaults you can override. It is best to create a
[variable definitions file](https://www.terraform.io/docs/language/values/variables.html#variable-definitions-tfvars-files)
for the required variables as well as any you'd like to override. That way
you can easily re-run Terraform without having to enter variable values every
time. (If you do not create a variable definition file, Terraform will ask you
for each variable one at a time.)

```bash
terraform apply -var-file=your-vars.tfvars.json
```

#### Required variables

These are required because they describe AWS resources that are not managed
by this Terraform configuration. These are provided by a service provider,
are shared between multiple apps, or must not be deleted when the
infrastructure defined here is destroyed.

| Variable            | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| vpc_id              | The ID of the AWS VPC to deploy into.                                                       |
| permission_boundary | For creating IAM roles and/or policies, the ARN of the permission boundary to bind them to. |
| private_subnet_ids  | A list of private subnet IDs to be used by ECS tasks and the RDS database.                  |
| public_subnet_ids   | A list of public subnet IDs to be used by the load balancer.                                |
| s3_data_bucket      | The name of the S3 bucket where database seed data is stored.                               |
| s3_data_file        | The name of the database seed file in the bucket defined above.                             |

#### Optional variables

| Variable              | Description                                                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| aws_profile           | The AWS configuration profile to use for commands. This profile should define credentials. Defaults to `default`.                                                                        |
| aws_region            | The AWS region to deploy this infrastructure into. Defaults to `us-west-2`.                                                                                                              |
| api_container_version | The container version to use for deploying the API task. Defaults to `latest`, which is generally what you want so you can update the API without redeploying the entire infrastructure. |

## 2. Log into the AWS container registry

```bash
aws ecr get-login-password \
  --region "$(terraform output -raw aws_region)" | \
  docker login \
  --username AWS \
  --password-stdin \
  "$(terraform output -raw container_registry_url | awk -F/ '{print $1}')"
```

Note that this command makes calls into Terraform to identify the region
and ECR registry URL, so you do not need to enter those manually.

If you used a non-default profile, you will also need to include a
`--profile` argument to the `aws ecr` command. E.g.:

```bash
aws ecr --profile=my-profile get-login-password [...]
```

## 3. Build the API Docker image

```bash
docker build \
  -t "$(terraform output -raw container_registry_url)":latest \
  api \
  -f api/Dockerfile.prod
```

Again, using Terraform to tell us what to call the image. Note that this
image is being tagged as `latest`. You can also tag it with a specific
version number. If you use a version number, you probably _also_ want to tag
it with latest so the API task will use it whenever it gets restarted:

```bash
docker tag \
  "$(terraform output -raw container_registry_url)":1.3 \
  "$(terraform output -raw container_registry_url)":latest
```

## 4. Push the Docker image to the AWS container registry

```bash
docker push "$(terraform output -raw container_registry_url)":latest
```

If you created a specific version, it might be worth pushing that too. It
does not take up any more space on AWS, it just adds another tag to the same
image. It can be handy to have all deployed versions saved safely in the
cloud.

## 5. Setup the database

Shortly after the image gets pushed up, AWS will start the API service. In
the meantime, you'll want to go ahead and setup the database. Run the initial
schema migration, relying on outputs from Terraform.

```bash
cd terraform
aws ecs run-task \
  --task-definition "$(terraform output -raw migration_task_definition)" \
  --cluster "$(terraform output -raw api_cluster)" \
  --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw subnet_private)],securityGroups=[$(terraform output -raw task_security_group)],assignPublicIp=DISABLED}" \
  --launch-type FARGATE
```

You'll need that `--profile` argument again if you used a non-default AWS
profile in step 1.

If this is the first time you've setup the database, it is still empty. The
schema migration will only create the database schema to get it ready to use.
To load an initial set of data, wait until the migration has finished (you
can check the ECS tasks in the AWS console website to watch for the migration
task to end), then you will run the seed task:

```bash
cd terraform
aws ecs run-task \
  --task-definition "$(terraform output -raw seed_task_definition)" \
  --cluster "$(terraform output -raw api_cluster)" \
  --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw subnet_private)],securityGroups=[$(terraform output -raw task_security_group)],assignPublicIp=DISABLED}" \
  --launch-type FARGATE
```

The only difference between these two is which task definition is being sent
to AWS to execute.

## 6. You're done for now!

Hooray, your thing is online! You can find the URL for the API with Terraform

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

# Prototype for NASA SBIR infrastructure

The infrastructure for the prototype is defined in [Terraform](https://www.terraform.io/).
The prototype itself is written in Javascript using [Koa](https://koajs.com/)
for the web server framework and [Knex](http://knexjs.org/) as a database ORM.

This project includes a Makefile to simplify building the infrastructure,
deploying the prototype, updating the database, populating the database with
an initial set of data, and tearing everything down. The Makefile is the
recommended way of working with the prototype.

The Terraform scripts are configured to use an S3 bucket to store state. You
will need access to that S3 bucket in order to use Terraform.

## Makefile

This repo includes a Makefile to simplify building infrastructure in AWS,
deploying a version of the prototype, migrating the database, seeding it with
an initial set of data, and destroying everything. The Makefile will run
Terraform for you, and requires that you have a file called
`variables.tfvars.json` in the root of this repo that defines the required
Terraform variables described in the [Infrastructure](#Infrastructure) section
below. You are not required to use the Makefile if you prefer to manually run
the steps, but the Makefile is recommended.

## Infrastructure

In order to build and deploy the infrastructure, you will need to set some
Terraform variables. There are some configuration variables that **_must_** be
set, and several others that have reasonable defaults you can override. It is
best to create a [variable definitions file](https://www.terraform.io/docs/language/values/variables.html#variable-definitions-tfvars-files)
for the required variables as well as any you'd like to override. That way
you can easily re-run Terraform without having to enter variable values every
time. (If you do not create a variable definition file, Terraform will ask you
for each variable one at a time.)

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

To use the Makefile, create a variable definitions file at the root of this repo
called `variables.tfvars.json` and populate it with the necessary values and any
optional overrides. This variables file is required for all of the Makefile
functionality, not just creating infrastructure.

## Build the infrastructure

When the commands below are finished, the DNS URL of the prototype instance will
be printed to the console. There's nothing there yet since it hasn't been
deployed, but now you'll know where it's going to go.

### Makefile

```bash
make build
```

### Manual

```bash
cd terraform
terraform apply --var-file [YOUR VAR FILE]
terraform output api_dns
```

## Deploy a version of the prototype

### Makefile

```bash
make deploy
```

### Manual

1. Log into the AWS container registry with Docker:

   ```bash
   aws ecr get-login-password \
     --region "$(terraform output -raw aws_region)" | \
     docker login \
     --username AWS \
     --password-stdin \
     "$(terraform output -raw container_registry_url | awk -F/ '{print $1}')"
   ```

   Note that this command makes calls into Terraform to identify the region and
   ECR registry URL, so you do not need to enter those manually.

   If you used a non-default profile, you will also need to include a
   `--profile` argument to the `aws ecr` command. E.g.:

   ```bash
   aws ecr --profile=my-profile get-login-password [...]
   ```

2. Build the API Docker image

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

3. Push the Docker image to the AWS container registry

   ```bash
   docker push "$(terraform output -raw container_registry_url)":latest
   ```

   If you created a specific version, it might be worth pushing that too. It
   does not take up any more space on AWS, it just adds another tag to the same
   image. It can be handy to have all deployed versions saved safely in the
   cloud.

4. Force a redeploy

   If the prototype was already running, pushing a new version does not
   automatically cause the new version to start running. To do that, y

   ```bash
   aws ecs \
     --profile="$(terraform output -raw aws_profile)" \
     update-service \
     --force-new-deployment \
     --service "$(terraform output -raw api_service)" \
     --cluster "$(terraform output -raw api_cluster)" \
     --no-cli-pager
   ```

   This will cause the image tagged according to the `api_container_version`
   variable (`latest` by default) to be launched, attached to the load balancer,
   and the older version to be shut down and drained.

## Migrate the database

The first time the prototype is deployed, and again each time the database
schema is updated, the database will need to be migrated.

### Makefile

```
make migrate
```

### Manual

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

## Seed the database

Seeding the database will empty anything that's currently in it and add a fresh
copy of the initial toy data. This is *necessary* after the first deployment
because the database starts out empty. It's also useful if the database data
gets messed up somehow, so you can get back to a known-good state.

If this is the first time you're seeding the database, wait until the migration
has finished (you can check the ECS tasks in the AWS console website to watch
for the migration task to end).

### Makefile

```bash
make seed
```

### Manual

```bash
cd terraform
aws ecs run-task \
  --task-definition "$(terraform output -raw seed_task_definition)" \
  --cluster "$(terraform output -raw api_cluster)" \
  --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw subnet_private)],securityGroups=[$(terraform output -raw task_security_group)],assignPublicIp=DISABLED}" \
  --launch-type FARGATE
```

## Teardown

When it's time to take the prototype down and you want to teardown all the
infrastructure that was created, Terraform can handle all that too.

### Makefile

```bash
make destroy
```

### Manual

```bash
cd terraform
terraform destroy --var-file [YOUR VAR FILE]
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

# Fetch AZs in the current region
data "aws_availability_zones" "available" {
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = merge(
    var.default_tags
  )
}

# Create private subnets for each availability zone
resource "aws_subnet" "private" {
  count             = var.az_count
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  vpc_id            = aws_vpc.main.id
  tags = merge(
    var.default_tags,
    { Name = "${var.resource_prefix}-private-${count.index}" }
  )
}

# Create public subnets for each availability zone
resource "aws_subnet" "public" {
  count                   = var.az_count
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, var.az_count + count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  vpc_id                  = aws_vpc.main.id
  map_public_ip_on_launch = true
  tags = merge(
    var.default_tags,
    { Name = "${var.resource_prefix}-public-${count.index}" }
  )
}

# We gotta make this thing available on the internet.
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = merge(
    var.default_tags
  )
}

# Route the public subnet traffic through the gateway
resource "aws_route" "internet_access" {
  route_table_id         = aws_vpc.main.main_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Create a NAT gateway with an Elastic IP for each private subnet to get internet connectivity
resource "aws_eip" "internet" {
  count      = var.az_count
  vpc        = true
  depends_on = [aws_internet_gateway.main]
  tags = merge(
    var.default_tags,
    { Name = "${var.resource_prefix}-${count.index}" }
  )
}

resource "aws_nat_gateway" "internet" {
  count         = var.az_count
  subnet_id     = element(aws_subnet.public.*.id, count.index)
  allocation_id = element(aws_eip.internet.*.id, count.index)
  tags = merge(
    var.default_tags,
    { Name = "${var.resource_prefix}-${count.index}" }
  )
}

# Create a new route table for the private subnets, make it route non-local
# traffic through the NAT gateway to the internet
resource "aws_route_table" "private" {
  count  = var.az_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = element(aws_nat_gateway.internet.*.id, count.index)
  }

  tags = merge(
    var.default_tags,
    { Name = "${var.resource_prefix}-${count.index}" }
  )
}

# Explicitly associate the newly created route tables to the private subnets
# (so they don't default to the main route table)
resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = element(aws_subnet.private.*.id, count.index)
  route_table_id = element(aws_route_table.private.*.id, count.index)
}

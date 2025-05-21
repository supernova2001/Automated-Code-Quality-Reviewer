import boto3
import json
import os
from botocore.exceptions import ClientError
import getpass
import time

def configure_aws_credentials():
    """Configure AWS credentials"""
    print("\nAWS Credentials Setup")
    print("=====================")
    
    aws_access_key = getpass.getpass("AWS Access Key ID: ").strip()
    aws_secret_key = getpass.getpass("AWS Secret Access Key: ").strip()
    aws_region = input("AWS Region (default: us-east-1): ").strip() or "us-east-1"
    
    if not aws_access_key or not aws_secret_key:
        print("\nError: AWS Access Key ID and Secret Access Key are required!")
        return None
    
    os.environ['AWS_ACCESS_KEY_ID'] = aws_access_key
    os.environ['AWS_SECRET_ACCESS_KEY'] = aws_secret_key
    os.environ['AWS_DEFAULT_REGION'] = aws_region
    
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"\nCredentials validated successfully!")
        print(f"AWS Account: {identity['Account']}")
        return aws_region
    except ClientError as e:
        print(f"\nError validating AWS credentials: {e}")
        return None

def create_vpc_and_security_group():
    """Create VPC and Security Group for RDS"""
    ec2 = boto3.client('ec2')
    
    try:
        # Create VPC
        print("Creating VPC...")
        vpc = ec2.create_vpc(
            CidrBlock='10.0.0.0/16',
            TagSpecifications=[{
                'ResourceType': 'vpc',
                'Tags': [{'Key': 'Name', 'Value': 'code-reviewer-vpc'}]
            }]
        )
        vpc_id = vpc['Vpc']['VpcId']
        
        # Enable DNS support and hostnames
        ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsSupport={'Value': True})
        ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsHostnames={'Value': True})
        
        # Create Internet Gateway
        igw = ec2.create_internet_gateway()
        igw_id = igw['InternetGateway']['InternetGatewayId']
        ec2.attach_internet_gateway(InternetGatewayId=igw_id, VpcId=vpc_id)
        
        # Create subnets
        azs = ec2.describe_availability_zones()
        az_names = [az['ZoneName'] for az in azs['AvailabilityZones']][:2]
        subnet_ids = []
        
        for i, az in enumerate(az_names):
            subnet = ec2.create_subnet(
                VpcId=vpc_id,
                CidrBlock=f'10.0.{i}.0/24',
                AvailabilityZone=az
            )
            subnet_id = subnet['Subnet']['SubnetId']
            subnet_ids.append(subnet_id)
            
            # Make subnet public
            ec2.modify_subnet_attribute(
                SubnetId=subnet_id,
                MapPublicIpOnLaunch={'Value': True}
            )
        
        # Create and configure route table
        route_table = ec2.create_route_table(VpcId=vpc_id)
        route_table_id = route_table['RouteTable']['RouteTableId']
        
        # Add route to internet gateway
        ec2.create_route(
            RouteTableId=route_table_id,
            DestinationCidrBlock='0.0.0.0/0',
            GatewayId=igw_id
        )
        
        # Associate route table with subnets
        for subnet_id in subnet_ids:
            ec2.associate_route_table(
                RouteTableId=route_table_id,
                SubnetId=subnet_id
            )
        
        # Create Security Group
        security_group = ec2.create_security_group(
            GroupName='code-reviewer-sg',
            Description='Security group for Code Reviewer RDS',
            VpcId=vpc_id
        )
        sg_id = security_group['GroupId']
        
        # Add inbound rules
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 5432,
                    'ToPort': 5432,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                }
            ]
        )
        
        # Wait for resources to be ready
        time.sleep(30)
        
        return vpc_id, sg_id, subnet_ids
        
    except ClientError as e:
        print(f"Error creating VPC and Security Group: {e}")
        return None, None, None

def create_rds_instance(security_group_id, vpc_id, subnet_ids):
    """Create RDS PostgreSQL instance"""
    rds = boto3.client('rds')
    
    try:
        # Create subnet group
        subnet_group_name = 'code-reviewer-subnet-group'
        rds.create_db_subnet_group(
            DBSubnetGroupName=subnet_group_name,
            DBSubnetGroupDescription='Subnet group for Code Reviewer RDS',
            SubnetIds=subnet_ids
        )
        
        # Create RDS instance
        response = rds.create_db_instance(
            DBInstanceIdentifier='code-reviewer-db',
            DBInstanceClass='db.t3.micro',
            Engine='postgres',
            MasterUsername='postgres',
            MasterUserPassword=getpass.getpass("Enter RDS master password: "),
            AllocatedStorage=20,
            MaxAllocatedStorage=20,
            VpcSecurityGroupIds=[security_group_id],
            DBSubnetGroupName=subnet_group_name,
            DBName='code_reviewer',
            PubliclyAccessible=True,
            MultiAZ=False,
            StorageType='gp2',
            BackupRetentionPeriod=1
        )
        
        print("RDS instance creation initiated...")
        print("This may take several minutes to complete.")
        
        # Wait for RDS instance to be available
        waiter = rds.get_waiter('db_instance_available')
        waiter.wait(DBInstanceIdentifier='code-reviewer-db')
        
        # Get the endpoint
        response = rds.describe_db_instances(DBInstanceIdentifier='code-reviewer-db')
        endpoint = response['DBInstances'][0]['Endpoint']['Address']
        return endpoint
        
    except ClientError as e:
        print(f"Error creating RDS instance: {e}")
        return None

def main():
    """Main function to set up AWS infrastructure"""
    print("Setting up AWS infrastructure for Code Reviewer...")
    
    # Configure AWS credentials
    aws_region = configure_aws_credentials()
    if not aws_region:
        print("\nSetup aborted: Invalid AWS credentials.")
        return
    
    # Create VPC and Security Group
    print("\nCreating VPC and Security Group...")
    vpc_id, security_group_id, subnet_ids = create_vpc_and_security_group()
    if not all([vpc_id, security_group_id, subnet_ids]):
        print("Failed to create VPC and Security Group. Exiting...")
        return
    
    # Create RDS instance
    print("\nCreating RDS instance...")
    rds_endpoint = create_rds_instance(security_group_id, vpc_id, subnet_ids)
    if not rds_endpoint:
        print("Failed to create RDS instance. Exiting...")
        return
    
    # Save configuration
    with open('.env', 'w') as f:
        f.write(f"AWS_REGION={aws_region}\n")
        f.write(f"DB_HOST={rds_endpoint}\n")
        f.write(f"DB_NAME=code_reviewer\n")
        f.write(f"DB_USER=postgres\n")
    
    print("\nAWS infrastructure setup completed!")
    print(f"RDS endpoint: {rds_endpoint}")
    print("\nConfiguration has been saved to .env file")

if __name__ == "__main__":
    main() 
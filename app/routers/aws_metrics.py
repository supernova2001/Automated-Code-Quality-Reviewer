from fastapi import APIRouter
import boto3
from datetime import datetime

REGION = 'us-east-1'  # Set this to your AWS region

router = APIRouter()

@router.get("/api/aws-metrics")
def get_aws_metrics():
    ec2 = boto3.client('ec2', region_name=REGION)
    eks = boto3.client('eks', region_name=REGION)
    cloudwatch = boto3.client('cloudwatch', region_name=REGION)
    # EC2 Instances
    instances = []
    for reservation in ec2.describe_instances()['Reservations']:
        for instance in reservation['Instances']:
            instance_id = instance.get("InstanceId")
            # Get average CPU utilization for the last 24 hours
            cpu = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                StartTime=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
                EndTime=datetime.utcnow(),
                Period=3600,
                Statistics=['Average']
            )
            datapoints = cpu.get('Datapoints', [])
            avg_cpu = round(sum([d['Average'] for d in datapoints])/len(datapoints), 2) if datapoints else 0.0
            instances.append({
                "id": instance_id,
                "type": instance.get("InstanceType"),
                "state": instance.get("State", {}).get("Name"),
                "public_ip": instance.get("PublicIpAddress"),
                "launch_time": str(instance.get("LaunchTime")),
                "cpu_utilization": avg_cpu
            })
    # EKS Clusters
    eks_clusters = eks.list_clusters()['clusters']
    eks_details = [eks.describe_cluster(name=cluster)['cluster'] for cluster in eks_clusters]
    # VPCs
    vpcs = ec2.describe_vpcs()['Vpcs']
    vpc_list = [{"id": vpc.get("VpcId"), "cidr": vpc.get("CidrBlock"), "state": vpc.get("State")} for vpc in vpcs]
    return {
        "ec2_instances": instances,
        "eks_clusters": eks_details,
        "vpcs": vpc_list
    }

@router.get("/api/aws-billing")
def get_aws_billing():
    ce = boto3.client('ce', region_name='us-east-1')
    now = datetime.utcnow()
    start = now.replace(day=1).strftime('%Y-%m-%d')
    end = now.strftime('%Y-%m-%d')
    response = ce.get_cost_and_usage(
        TimePeriod={'Start': start, 'End': end},
        Granularity='MONTHLY',
        Metrics=['UnblendedCost']
    )
    cost = response['ResultsByTime'][0]['Total']['UnblendedCost']['Amount']
    return {"month": now.strftime('%B %Y'), "cost": cost} 
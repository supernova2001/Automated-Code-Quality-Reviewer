import subprocess
import boto3
import time
import os

AWS_REGION = "us-east-1"
EKS_CLUSTER_NAME = "my-eks-cluster"
EC2_INSTANCE_TYPE = "t2.micro"
EC2_AMI_ID = "ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI for us-east-1
EC2_KEY_NAME = "code-reviewer"  # Replace with your key pair name

# # --- EKS Cluster Creation ---
# def create_eks_cluster():
#     print("Creating EKS cluster with 2 t2.micro nodes...")
#     cmd = [
#         "D:\\eksctl.exe", "create", "cluster",
#         "--name", EKS_CLUSTER_NAME,
#         "--region", AWS_REGION,
#         "--nodegroup-name", "my-nodes",
#         "--node-type", EC2_INSTANCE_TYPE,
#         "--nodes", "2",
#         "--nodes-min", "2",
#         "--nodes-max", "2",
#         "--managed"
#     ]
#     subprocess.run(cmd, check=True)
#     print("EKS cluster created.")

# --- EC2 Instance Creation ---
# def create_ec2_instances(count=2):
#     print(f"Launching {count} EC2 instances...")
#     ec2 = boto3.resource('ec2', region_name=AWS_REGION)
#     instances = ec2.create_instances(
#         ImageId=EC2_AMI_ID,
#         InstanceType=EC2_INSTANCE_TYPE,
#         MinCount=count,
#         MaxCount=count,
#         KeyName=EC2_KEY_NAME,
#         SubnetId='subnet-02fd5b5cb9cf27477',
#         SecurityGroupIds=['sg-006b7a4cf27a64bd1'],
#         TagSpecifications=[{
#             'ResourceType': 'instance',
#             'Tags': [{'Key': 'Name', 'Value': 'standalone-ec2'}]
#         }],
#     )
#     for instance in instances:
#         print(f"Waiting for instance {instance.id} to be running...")
#         instance.wait_until_running()
#         instance.reload()
#         print(f"Instance {instance.id} is running at {instance.public_dns_name}")
#     print("All EC2 instances launched.")

# --- Docker Build and Push ---
def build_and_push_docker_image():
    image_name = input("Enter Docker image name (e.g., username/repo:tag): ").strip()
    dockerfile_dir = input("Enter path to Dockerfile directory (default: .): ").strip() or "."
    print(f"Building Docker image {image_name}...")
    subprocess.run(["docker", "build", "-t", image_name, dockerfile_dir], check=True)
    print(f"Pushing Docker image {image_name}...")
    subprocess.run(["docker", "push", image_name], check=True)
    print("Docker image pushed.")
    return image_name

# --- Kubernetes Deployment ---
def deploy_to_eks():
    manifest_path = input("Enter path to Kubernetes manifest YAML (e.g., deployment.yaml): ").strip()
    print(f"Deploying {manifest_path} to EKS...")
    subprocess.run(["kubectl", "apply", "-f", manifest_path], check=True)
    print("Deployment applied.")

if __name__ == "__main__":
    # 1. Create EKS cluster
    # create_eks_cluster()
    # 2. Launch 2 EC2 instances
    # create_ec2_instances(2)
    # 3. Build and push Docker image
    image_name = build_and_push_docker_image()
    # 4. Deploy to EKS
    deploy_to_eks() 
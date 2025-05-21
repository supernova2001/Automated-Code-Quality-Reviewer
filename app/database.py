from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError

# Load environment variables
load_dotenv()

def get_db_credentials():
    """Get database credentials from AWS Secrets Manager"""
    secret_name = os.getenv("AWS_SECRET_NAME", "code-reviewer-db-secret")
    region_name = os.getenv("AWS_REGION", "us-east-1")
    
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    
    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        # Fallback to environment variables if AWS Secrets Manager fails
        return {
            "username": os.getenv("DB_USERNAME", "postgres"),
            "password": os.getenv("DB_PASSWORD", "postgres"),
            "host": os.getenv("DB_HOST", "localhost"),
            "port": os.getenv("DB_PORT", "5432"),
            "dbname": os.getenv("DB_NAME", "code_reviewer")
        }
    else:
        if 'SecretString' in get_secret_value_response:
            return eval(get_secret_value_response['SecretString'])

def get_db_url():
    """Get database URL from AWS RDS or environment variables"""
    if os.getenv("USE_AWS_RDS", "true").lower() == "true":
        credentials = get_db_credentials()
        return f"postgresql://{credentials['username']}:{credentials['password']}@{credentials['host']}:{credentials['port']}/{credentials['dbname']}"
    else:
        return os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/code_reviewer"
        )

# Create SQLAlchemy engine
SQLALCHEMY_DATABASE_URL = get_db_url()
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 
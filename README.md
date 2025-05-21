# Automated Code Quality Reviewer

An automated code quality review service that analyzes code for quality, style issues, and potential bugs. The service provides detailed reports on code quality metrics, security vulnerabilities, and best practices.

## Features

- Code quality analysis using multiple tools (Pylint, Flake8, Bandit)
- Asynchronous processing of code analysis tasks
- RESTful API for submitting code and retrieving analysis results
- Support for both direct code submission and GitHub repository analysis
- Detailed HTML/JSON reports of code quality metrics
- Security vulnerability scanning
- Code style enforcement

## Tech Stack

- FastAPI (Python web framework)
- Celery with Redis (Task queue)
- SQLAlchemy (Database ORM)
- Pylint, Flake8, Bandit (Code analysis tools)
- Docker (Containerization)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/automated-code-quality-reviewer.git
cd automated-code-quality-reviewer
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the services:
```bash
# Start Redis (required for Celery)
docker run -d -p 6379:6379 redis

# Start the FastAPI application
uvicorn app.main:app --reload

# Start Celery worker
celery -A app.worker worker --loglevel=info
```

## API Documentation

Once the application is running, visit `http://localhost:8000/docs` for the interactive API documentation.

### Main Endpoints

- `POST /api/v1/analyze/code`: Submit code for analysis
- `POST /api/v1/analyze/repo`: Submit GitHub repository for analysis
- `GET /api/v1/results/{analysis_id}`: Get analysis results
- `GET /api/v1/history`: Get analysis history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 
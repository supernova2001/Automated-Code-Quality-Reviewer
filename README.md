# Automated Code Quality Reviewer

An automated code quality review service that analyzes code for quality, style issues, and potential bugs. The service provides detailed reports on code quality metrics, security vulnerabilities, and best practices. Check below for the features, screenshots and tech stack.

## Features

- Code quality analysis using multiple tools (Pylint, Flake8, Bandit)
- Asynchronous processing of code analysis tasks
- RESTful API for submitting code and retrieving analysis results
- Support for both direct code submission and GitHub repository analysis
- Detailed HTML/JSON reports of code quality metrics
- Security vulnerability scanning
- Code style enforcement
- ML model to detect code quality: clean or code smell
- GPT integrated suggestions based on the metrics calculated

## Tech Stack

- FastAPI (Python web framework)
- Celery with Redis (Task queue)
- SQLAlchemy (Database ORM)
- Pylint, Flake8, Bandit (Code analysis tools)
- Docker (Containerization)

## Screenshots

![screenshot-1](https://github.com/user-attachments/assets/b6bb0149-1cf8-4f1b-8c2f-754e7153d4c8)

![screenshot-2](https://github.com/user-attachments/assets/c291c780-e9d5-4f52-832c-f8a145fd8591)

![screenshot-3](https://github.com/user-attachments/assets/920e7ce0-3962-45bb-8e1f-172fcb6c6218)


![screenshot-4](https://github.com/user-attachments/assets/1a902e76-0033-4533-b123-885f97ead278)

![screenshot-5](https://github.com/user-attachments/assets/e555ab92-64ba-4544-9013-1a62b7c63dca)


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


### Main Endpoints

- `POST /api/v1/analyze/code`: Submit code for analysis
- `POST /api/v1/analyze/repo`: Submit GitHub repository for analysis
- `GET /api/v1/results/{analysis_id}`: Get analysis results
- `GET /api/v1/history`: Get analysis history
- `POST /admin/ml/train`: Train the ML model to detect code smell


### Future enhancements
- Planning to build a browser extension that can read the code from the IDE and fetch the metrics in the portal
- Improve the ML model with a better approach (either using LLMs or a combination of LLMs instead of conventional machine learning models)

## License

MIT License 

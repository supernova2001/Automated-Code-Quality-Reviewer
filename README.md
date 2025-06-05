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

![home-page](https://github.com/user-attachments/assets/ccc1d010-4212-4aee-90f2-dd4b941add62)


![analysis-result](https://github.com/user-attachments/assets/e7a18da7-8f44-4bd5-9737-79ce3dc5c124)


![code-visualizations](https://github.com/user-attachments/assets/13421645-ee87-4505-9db4-d8b0830377ed)


![repo-analysis](https://github.com/user-attachments/assets/5a4b7522-ad3b-44ef-ad49-8b78055c56e9)

![aws-resource-dashboard](https://github.com/user-attachments/assets/1532e83a-6272-4e6b-8ea2-e526ff519222)


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

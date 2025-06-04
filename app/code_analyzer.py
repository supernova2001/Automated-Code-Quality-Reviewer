import tempfile
import os
import subprocess
import json
from typing import Dict, List, Tuple, Any
import ast
import re
from .schemas import Issue, AnalysisMetrics
from .cache import cache, cached
import hashlib
from transformers import AutoTokenizer, AutoModel
import torch
import joblib
import openai

# Load API key from environment variable
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

class CodeAnalyzer:
    def __init__(self):
        self.tools = {
            'pylint': self._run_pylint,
            'flake8': self._run_flake8,
            'bandit': self._run_bandit
        }
        self.cache_ttl = 3600  # Cache results for 1 hour
        # ML model and tokenizer (temporarily disabled)
        # self.ml_tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
        # self.ml_model = AutoModel.from_pretrained("microsoft/codebert-base")
        # self.smell_clf = joblib.load("code_smell_classifier.pkl")

    def _generate_cache_key(self, code: str) -> str:
        """Generate a unique cache key for the code"""
        return hashlib.md5(code.encode()).hexdigest()

    def get_codebert_embedding(self, code: str):
        # Disabled
        return None

    def ml_code_smell_analysis(self, code: str):
        # Temporarily return empty ML results
        return {
            "ai_code_smell": None,
            "ai_confidence": None,
            "ai_suggestions": []
        }

    def get_gpt_suggestions(self, metrics: dict, code: str = "") -> str:
        prompt = (
            f"Given these code metrics:\n"
            f"- Code size: {metrics['code_size']} lines\n"
            f"- Functions: {metrics['function_count']}\n"
            f"- Classes: {metrics['class_count']}\n"
            f"- Comment ratio: {metrics['comment_ratio']}%\n"
            f"- Complexity score: {metrics['complexity_score']}\n"
            f"- Pylint score: {metrics['pylint_score']}\n"
            f"Suggest 3 actionable tips to improve code quality. "
            f"{'Here is the code:\n' + code if code else ''}"
        )
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            api_key=OPENAI_API_KEY,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.7,
        )
        return response.choices[0].message["content"].strip()

    @cached(ttl_seconds=3600)
    async def analyze(self, code: str) -> Dict[str, Any]:
        """
        Analyze code and return results. Results are cached for 1 hour.
        """
        cache_key = self._generate_cache_key(code)
        
        # Check cache first
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            # Remove ml_prediction if present in cached result
            if 'ml_prediction' in cached_result:
                del cached_result['ml_prediction']
            return cached_result

        # Create temporary file for analysis
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(code)
            temp_file_path = temp_file.name

        try:
            # Run all analysis tools
            results = {}
            for tool_name, tool_func in self.tools.items():
                results[tool_name] = await tool_func(temp_file_path)

            # Calculate metrics
            metrics = self._calculate_metrics(code)
            
            # Update pylint score with actual value
            metrics.pylint_score = results['pylint']['score']

            # Calculate scores (now pass bandit issues)
            scores = self._calculate_scores(metrics, results['bandit']['issues'])

            # Structure the response
            result = {
                'pylint_score': results['pylint']['score'],
                'complexity_score': scores['complexity_score'],
                'maintainability_score': scores['maintainability_score'],
                'security_score': scores['security_score'],
                'overall_score': scores['overall_score'],
                'metrics': {
                    'code_size': metrics.code_size,
                    'function_count': metrics.function_count,
                    'class_count': metrics.class_count,
                    'comment_ratio': metrics.comment_ratio,
                    'complexity_score': metrics.complexity_score,
                    'pylint_score': metrics.pylint_score
                },
                'flake8_issues': results['flake8']['issues'],
                'bandit_issues': results['bandit']['issues']
            }

            # ML-powered code smell/anti-pattern detection
            ml_result = self.ml_code_smell_analysis(code)
            result.update(ml_result)

            # Ensure ml_prediction is never added to result
            if 'ml_prediction' in result:
                del result['ml_prediction']

            # Add ChatGPT AI tips
            try:
                result['ai_tips'] = self.get_gpt_suggestions(metrics.model_dump(), code)
            except Exception as e:
                result['ai_tips'] = f"AI tips unavailable: {str(e)}"

            # Cache the result
            cache.set(cache_key, result, self.cache_ttl)
            
            return result

        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)

    async def _run_pylint(self, file_path: str) -> Dict:
        """Run pylint analysis"""
        try:
            result = subprocess.run(
                ['pylint', '--output-format=json', file_path],
                capture_output=True,
                text=True
            )
            
            issues = json.loads(result.stdout) if result.stdout else []
            
            # Calculate pylint score (10 - (number of issues * 0.1))
            score = max(0, 10 - (len(issues) * 0.1))
            
            return {
                'score': int(score),
                'issues': [
                    Issue(
                        type='error' if issue['type'] == 'error' else 'warning',
                        message=issue['message'],
                        line=issue['line'],
                        column=issue['column'],
                        rule_id=issue['symbol']
                    ).model_dump()  # Convert Issue object to dictionary
                    for issue in issues
                ]
            }
        except Exception as e:
            return {'score': 0, 'issues': [], 'error': str(e)}

    async def _run_flake8(self, file_path: str) -> Dict:
        """Run flake8 analysis"""
        try:
            result = subprocess.run(
                ['flake8', '--format=json', file_path],
                capture_output=True,
                text=True
            )
            
            issues = json.loads(result.stdout) if result.stdout else []
            
            return {
                'issues': [
                    Issue(
                        type='error',
                        message=issue['message'],
                        line=issue['line'],
                        column=issue['column'],
                        rule_id=issue['code']
                    ).model_dump()  # Convert Issue object to dictionary
                    for issue in issues
                ]
            }
        except Exception as e:
            return {'issues': [], 'error': str(e)}

    async def _run_bandit(self, file_path: str) -> Dict:
        """Run bandit security analysis"""
        try:
            result = subprocess.run(
                ['bandit', '-f', 'json', file_path],
                capture_output=True,
                text=True
            )
            
            issues = json.loads(result.stdout)['results'] if result.stdout else []
            
            return {
                'issues': [
                    Issue(
                        type='error',
                        message=issue['issue_text'],
                        line=issue['line_number'],
                        column=None,
                        rule_id=issue['test_id']
                    ).model_dump()  # Convert Issue object to dictionary
                    for issue in issues
                ]
            }
        except Exception as e:
            return {'issues': [], 'error': str(e)}

    def _calculate_metrics(self, code: str) -> AnalysisMetrics:
        """Calculate code metrics"""
        lines = code.splitlines()
        code_lines = [line for line in lines if line.strip() and not line.strip().startswith('#')]
        comment_lines = [line for line in lines if line.strip().startswith('#')]
        
        # Count functions and classes
        function_count = len(re.findall(r'def\s+\w+\s*\(', code))
        class_count = len(re.findall(r'class\s+\w+', code))
        
        # Calculate comment ratio
        total_lines = len(lines)
        comment_ratio = (len(comment_lines) / total_lines * 100) if total_lines > 0 else 0
        
        # Calculate complexity (simple metric based on function count and code size)
        complexity_score = (function_count * 2 + len(code_lines) * 0.1)
        
        # Get pylint score from the results (will be updated in analyze method)
        pylint_score = 0.0  # Initial value, will be updated with actual score
        
        return AnalysisMetrics(
            code_size=len(code_lines),
            function_count=function_count,
            class_count=class_count,
            comment_ratio=round(comment_ratio, 2),
            complexity_score=round(complexity_score, 2),
            pylint_score=pylint_score
        )

    def _calculate_scores(self, metrics: AnalysisMetrics, bandit_issues: list) -> dict:
        """Calculate various quality scores based on metrics and security issues"""
        # Calculate maintainability score based on metrics
        maintainability_score = min(100, max(0, (
            (metrics.function_count * 5) +  # Reward for having functions
            (metrics.class_count * 10) +    # Reward for having classes
            (metrics.comment_ratio * 2)     # Reward for having comments
        )))
        # Calculate security score based on Bandit issues
        base_score = 100
        deduction = len(bandit_issues) * 10  # Deduct 10 points per issue
        security_score = max(0, base_score - deduction)
        # Calculate overall score (weighted average)
        overall_score = (
            (metrics.complexity_score * 0.3) +
            (maintainability_score * 0.3) +
            (security_score * 0.2) +
            (metrics.pylint_score * 0.2)
        )
        return {
            "complexity_score": round(metrics.complexity_score, 2),
            "maintainability_score": round(maintainability_score, 2),
            "security_score": round(security_score, 2),
            "overall_score": round(overall_score, 2)
        } 
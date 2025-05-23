import tempfile
import os
import subprocess
import json
from typing import Dict, List, Tuple
import ast
import re
from .schemas import Issue, AnalysisMetrics

class CodeAnalyzer:
    def __init__(self):
        self.tools = {
            'pylint': self._run_pylint,
            'flake8': self._run_flake8,
            'bandit': self._run_bandit
        }

    async def analyze(self, code: str) -> Dict:
        """
        Analyze the given code using multiple tools and return combined results
        """
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

            # Calculate scores
            scores = self._calculate_scores(metrics)

            # Structure the response
            return {
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
                    )
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
                    )
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
                    )
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
        
        # Calculate pylint score (placeholder - would be based on actual pylint results)
        pylint_score = 80.0  # Placeholder value
        
        return AnalysisMetrics(
            code_size=len(code_lines),
            function_count=function_count,
            class_count=class_count,
            comment_ratio=round(comment_ratio, 2),
            complexity_score=round(complexity_score, 2),
            pylint_score=pylint_score
        )

    def _calculate_scores(self, metrics: AnalysisMetrics) -> dict:
        """Calculate various quality scores based on metrics"""
        # Calculate maintainability score based on metrics
        maintainability_score = min(100, max(0, (
            (metrics.function_count * 5) +  # Reward for having functions
            (metrics.class_count * 10) +    # Reward for having classes
            (metrics.comment_ratio * 2)     # Reward for having comments
        )))
        
        # Calculate security score (placeholder - would be based on security analysis)
        security_score = 80  # Placeholder value
        
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
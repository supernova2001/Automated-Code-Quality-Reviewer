from typing import List, Dict, Any, Optional
import re
import ast
from collections import Counter
import esprima
from esprima import nodes

class BaseAnalyzer:
    def __init__(self):
        self.complexity_threshold = 10
        self.maintainability_threshold = 20

    def _preprocess_code(self, code: str) -> str:
        """Clean and preprocess the code for analysis."""
        raise NotImplementedError

    def _get_code_metrics(self, code: str) -> Dict[str, Any]:
        """Calculate various code metrics using AST analysis."""
        raise NotImplementedError

    def _get_code_patterns(self, code: str) -> List[str]:
        """Extract code patterns for similarity analysis."""
        raise NotImplementedError

    def detect_code_smells(self, code: str) -> List[Dict[str, Any]]:
        """Detect potential code smells and anti-patterns."""
        raise NotImplementedError

    def get_code_suggestions(self, code: str) -> List[Dict[str, Any]]:
        """Generate intelligent suggestions for code improvement."""
        raise NotImplementedError

class PythonAnalyzer(BaseAnalyzer):
    def _preprocess_code(self, code: str) -> str:
        """Clean and preprocess Python code for analysis."""
        # Remove comments
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        # Remove docstrings
        code = re.sub(r'""".*?"""', '', code, flags=re.DOTALL)
        code = re.sub(r"'''.*?'''", '', code, flags=re.DOTALL)
        return code.strip()
    
    def _get_code_metrics(self, code: str) -> Dict[str, Any]:
        """Calculate various code metrics using Python AST analysis."""
        try:
            tree = ast.parse(code)
            metrics = {
                'loc': len(code.splitlines()),
                'complexity': 0,
                'function_count': 0,
                'class_count': 0,
                'comment_count': len(re.findall(r'#.*$', code, flags=re.MULTILINE))
            }
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    metrics['function_count'] += 1
                elif isinstance(node, ast.ClassDef):
                    metrics['class_count'] += 1
                
                if isinstance(node, (ast.If, ast.For, ast.While, ast.Try, ast.ExceptHandler)):
                    metrics['complexity'] += 1
            
            maintainability = 100 - (metrics['complexity'] * 0.5) - (metrics['loc'] * 0.1)
            maintainability = max(0, min(100, maintainability))
            metrics['maintainability'] = maintainability
            
            return metrics
        except:
            return {
                'loc': len(code.splitlines()),
                'complexity': len(re.findall(r'\b(if|for|while|try|except)\b', code)),
                'maintainability': 50,
                'function_count': len(re.findall(r'\bdef\s+\w+', code)),
                'class_count': len(re.findall(r'\bclass\s+\w+', code)),
                'comment_count': len(re.findall(r'#.*$', code, flags=re.MULTILINE))
            }
    
    def _get_code_patterns(self, code: str) -> List[str]:
        """Extract Python code patterns for similarity analysis."""
        try:
            tree = ast.parse(code)
            patterns = []
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                    patterns.append(ast.unparse(node))
            
            return patterns
        except:
            return [b.strip() for b in re.split(r'\n\s*\n', code) if b.strip()]

    def detect_code_smells(self, code: str) -> List[Dict[str, Any]]:
        """Detect potential Python code smells and anti-patterns."""
        metrics = self._get_code_metrics(code)
        issues = []
        
        if metrics['complexity'] > self.complexity_threshold:
            issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': f'High cyclomatic complexity ({metrics["complexity"]}). Consider simplifying the logic.',
                'line': 1
            })
        
        if metrics['maintainability'] < self.maintainability_threshold:
            issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': f'Low maintainability index ({metrics["maintainability"]:.2f}). Consider improving code structure and documentation.',
                'line': 1
            })
        
        if metrics['loc'] > 20:
            issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': f'Method is too long ({metrics["loc"]} lines). Consider breaking it down into smaller methods.',
                'line': 1
            })
        
        patterns = self._get_code_patterns(code)
        if len(patterns) > 1:
            pattern_counter = Counter(patterns)
            duplicates = [p for p, count in pattern_counter.items() if count > 1]
            if duplicates:
                issues.append({
                    'type': 'code_smell',
                    'severity': 'info',
                    'message': 'Potential code duplication detected. Consider extracting common patterns into reusable functions.',
                    'line': 1
                })
        
        return issues

    def get_code_suggestions(self, code: str) -> List[Dict[str, Any]]:
        """Generate intelligent suggestions for Python code improvement."""
        suggestions = []
        metrics = self._get_code_metrics(code)
        
        if metrics['comment_count'] < metrics['loc'] * 0.1:
            suggestions.append({
                'type': 'suggestion',
                'severity': 'info',
                'message': 'Consider adding more documentation to improve code readability.',
                'line': 1
            })
        
        variables = re.findall(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=', code)
        for var in variables:
            if not re.match(r'^[a-z_][a-z0-9_]*$', var):
                suggestions.append({
                    'type': 'suggestion',
                    'severity': 'info',
                    'message': f'Variable "{var}" should follow snake_case naming convention.',
                    'line': 1
                })
        
        if metrics['complexity'] > self.complexity_threshold * 0.7:
            suggestions.append({
                'type': 'suggestion',
                'severity': 'info',
                'message': 'Consider refactoring complex logic into smaller, more manageable functions.',
                'line': 1
            })
        
        return suggestions

class JavaScriptAnalyzer(BaseAnalyzer):
    def _preprocess_code(self, code: str) -> str:
        """Clean and preprocess JavaScript code for analysis."""
        # Remove single-line comments
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        # Remove multi-line comments
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        return code.strip()
    
    def _get_code_metrics(self, code: str) -> Dict[str, Any]:
        """Calculate various code metrics using JavaScript AST analysis."""
        try:
            tree = esprima.parseScript(code, {'loc': True, 'range': True})
            metrics = {
                'loc': len(code.splitlines()),
                'complexity': 0,
                'function_count': 0,
                'class_count': 0,
                'comment_count': len(re.findall(r'//.*$|/\*.*?\*/', code, flags=re.MULTILINE | re.DOTALL))
            }
            
            def traverse(node):
                if isinstance(node, nodes.FunctionDeclaration) or isinstance(node, nodes.FunctionExpression):
                    metrics['function_count'] += 1
                elif isinstance(node, nodes.ClassDeclaration):
                    metrics['class_count'] += 1
                
                if isinstance(node, (nodes.IfStatement, nodes.ForStatement, nodes.WhileStatement, 
                                   nodes.DoWhileStatement, nodes.SwitchCase, nodes.TryStatement)):
                    metrics['complexity'] += 1
                
                for child in node.__dict__.values():
                    if isinstance(child, nodes.Node):
                        traverse(child)
                    elif isinstance(child, list):
                        for item in child:
                            if isinstance(item, nodes.Node):
                                traverse(item)
            
            traverse(tree)
            
            maintainability = 100 - (metrics['complexity'] * 0.5) - (metrics['loc'] * 0.1)
            maintainability = max(0, min(100, maintainability))
            metrics['maintainability'] = maintainability
            
            return metrics
        except:
            return {
                'loc': len(code.splitlines()),
                'complexity': len(re.findall(r'\b(if|for|while|switch|try)\b', code)),
                'maintainability': 50,
                'function_count': len(re.findall(r'\bfunction\s+\w+|\bconst\s+\w+\s*=\s*\([^)]*\)\s*=>', code)),
                'class_count': len(re.findall(r'\bclass\s+\w+', code)),
                'comment_count': len(re.findall(r'//.*$|/\*.*?\*/', code, flags=re.MULTILINE | re.DOTALL))
            }
    
    def _get_code_patterns(self, code: str) -> List[str]:
        """Extract JavaScript code patterns for similarity analysis."""
        try:
            tree = esprima.parseScript(code)
            patterns = []
            
            def traverse(node):
                if isinstance(node, (nodes.FunctionDeclaration, nodes.FunctionExpression, nodes.ClassDeclaration)):
                    patterns.append(esprima.unparse(node))
                
                for child in node.__dict__.values():
                    if isinstance(child, nodes.Node):
                        traverse(child)
                    elif isinstance(child, list):
                        for item in child:
                            if isinstance(item, nodes.Node):
                                traverse(item)
            
            traverse(tree)
            return patterns
        except:
            return [b.strip() for b in re.split(r'\n\s*\n', code) if b.strip()]

    def detect_code_smells(self, code: str) -> List[Dict[str, Any]]:
        """Detect potential JavaScript code smells and anti-patterns."""
        metrics = self._get_code_metrics(code)
        issues = []
        
        if metrics['complexity'] > self.complexity_threshold:
            issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': f'High cyclomatic complexity ({metrics["complexity"]}). Consider simplifying the logic.',
                'line': 1
            })
        
        if metrics['maintainability'] < self.maintainability_threshold:
            issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': f'Low maintainability index ({metrics["maintainability"]:.2f}). Consider improving code structure and documentation.',
                'line': 1
            })
        
        if metrics['loc'] > 20:
            issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': f'Function is too long ({metrics["loc"]} lines). Consider breaking it down into smaller functions.',
                'line': 1
            })
        
        # JavaScript-specific checks
        if re.search(r'var\s+\w+', code):
            issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': 'Usage of var detected. Consider using const or let instead.',
                'line': 1
            })
        
        if re.search(r'==', code):
            issues.append({
                'type': 'code_smell',
                'severity': 'warning',
                'message': 'Usage of == detected. Consider using === for strict equality comparison.',
                'line': 1
            })
        
        patterns = self._get_code_patterns(code)
        if len(patterns) > 1:
            pattern_counter = Counter(patterns)
            duplicates = [p for p, count in pattern_counter.items() if count > 1]
            if duplicates:
                issues.append({
                    'type': 'code_smell',
                    'severity': 'info',
                    'message': 'Potential code duplication detected. Consider extracting common patterns into reusable functions.',
                    'line': 1
                })
        
        return issues

    def get_code_suggestions(self, code: str) -> List[Dict[str, Any]]:
        """Generate intelligent suggestions for JavaScript code improvement."""
        suggestions = []
        metrics = self._get_code_metrics(code)
        
        if metrics['comment_count'] < metrics['loc'] * 0.1:
            suggestions.append({
                'type': 'suggestion',
                'severity': 'info',
                'message': 'Consider adding more documentation to improve code readability.',
                'line': 1
            })
        
        # Check for modern JavaScript features
        if not re.search(r'const|let', code):
            suggestions.append({
                'type': 'suggestion',
                'severity': 'info',
                'message': 'Consider using const and let instead of var for better variable scoping.',
                'line': 1
            })
        
        if not re.search(r'arrow\s+function|=>', code):
            suggestions.append({
                'type': 'suggestion',
                'severity': 'info',
                'message': 'Consider using arrow functions for better readability and this binding.',
                'line': 1
            })
        
        if metrics['complexity'] > self.complexity_threshold * 0.7:
            suggestions.append({
                'type': 'suggestion',
                'severity': 'info',
                'message': 'Consider refactoring complex logic into smaller, more manageable functions.',
                'line': 1
            })
        
        return suggestions

class CodeAnalyzer:
    def __init__(self):
        self.python_analyzer = PythonAnalyzer()
        self.javascript_analyzer = JavaScriptAnalyzer()
    
    def _detect_language(self, code: str) -> str:
        """Detect the programming language of the code."""
        # Check for Python-specific syntax
        if re.search(r'\bdef\s+\w+|\bclass\s+\w+', code):
            return 'python'
        # Check for JavaScript-specific syntax
        elif re.search(r'\bfunction\s+\w+|\bconst\s+\w+|\blet\s+\w+|\bvar\s+\w+', code):
            return 'javascript'
        else:
            # Default to Python if language cannot be determined
            return 'python'
    
    def analyze_code(self, code: str) -> Dict[str, Any]:
        """Perform comprehensive code analysis."""
        language = self._detect_language(code)
        analyzer = self.python_analyzer if language == 'python' else self.javascript_analyzer
        
        code_smells = analyzer.detect_code_smells(code)
        suggestions = analyzer.get_code_suggestions(code)
        metrics = analyzer._get_code_metrics(code)
        
        return {
            'language': language,
            'code_smells': code_smells,
            'suggestions': suggestions,
            'metrics': metrics,
            'ai_score': self._calculate_ai_score(code_smells, suggestions, metrics)
        }
    
    def _calculate_ai_score(self, code_smells: List[Dict[str, Any]], 
                          suggestions: List[Dict[str, Any]], 
                          metrics: Dict[str, Any]) -> float:
        """Calculate an AI-based quality score."""
        base_score = 100.0
        
        # Deduct points for code smells
        for smell in code_smells:
            if smell['severity'] == 'warning':
                base_score -= 5
            elif smell['severity'] == 'info':
                base_score -= 2
        
        # Deduct points for suggestions
        base_score -= len(suggestions) * 1.5
        
        # Adjust score based on metrics
        complexity_penalty = max(0, (metrics['complexity'] - 10) * 2)
        maintainability_penalty = max(0, (20 - metrics['maintainability']) * 2)
        
        base_score -= complexity_penalty + maintainability_penalty
        
        return max(0.0, min(100.0, base_score))

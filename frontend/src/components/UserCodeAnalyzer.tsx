import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios, { AxiosError } from 'axios';
import API_URL from '../config';

interface AnalysisResult {
  id: number;
  code: string;
  pylint_score: number;
  complexity_score: number;
  maintainability_score: number;
  security_score: number;
  overall_score: number;
  metrics: {
    code_size: number;
    function_count: number;
    class_count: number;
    comment_ratio: number;
    complexity_score: number;
    pylint_score: number;
  };
  flake8_issues: Array<{
    type: string;
    message: string;
    line: number;
    column?: number;
    rule_id?: string;
  }>;
  bandit_issues: Array<{
    type: string;
    message: string;
    line: number;
    column?: number;
    rule_id?: string;
  }>;
  ml_prediction?: {
    prediction: number;  // 0 for clean, 1 for code smell
    confidence: number;
  };
  ai_tips?: string;
}

interface ErrorResponse {
  detail: string;
}

const UserCodeAnalyzer: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/analyze/user`, { code });
      setResult(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      if (axiosError.response) {
        const errorMessage = axiosError.response.data?.detail || 'Failed to analyze code';
        setError(`Error: ${errorMessage}`);
      } else if (axiosError.request) {
        setError('No response from server. Please check if the backend is running.');
      } else {
        setError('Failed to analyze code. Please try again.');
      }
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Code Quality Analyzer
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          label="Enter your code here"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          sx={{ mr: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Analyze Code'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Analysis Results
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Code Preview
                  </Typography>
                  <SyntaxHighlighter
                    language="python"
                    style={vscDarkPlus}
                    customStyle={{ maxHeight: '400px' }}
                  >
                    {result.code}
                  </SyntaxHighlighter>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quality Scores
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Overall Score</Typography>
                      <Typography variant="h4" color="primary">
                        {result.overall_score}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Pylint Score</Typography>
                      <Typography variant="h4" color="secondary">
                        {result.pylint_score}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Complexity</Typography>
                      <Typography variant="h4" color="info.main">
                        {result.complexity_score}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Security</Typography>
                      <Typography variant="h4" color="warning.main">
                        {result.security_score}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Code Metrics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Code Size</Typography>
                      <Typography variant="h6">
                        {result.metrics.code_size} lines
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Functions</Typography>
                      <Typography variant="h6">
                        {result.metrics.function_count}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Classes</Typography>
                      <Typography variant="h6">
                        {result.metrics.class_count}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1">Comment Ratio</Typography>
                      <Typography variant="h6">
                        {result.metrics.comment_ratio}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ML Prediction Results */}
          {result.ml_prediction && typeof result.ml_prediction.prediction === 'number' && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Code Smell Detection
                </Typography>
                <Alert 
                  severity={result.ml_prediction.prediction === 0 ? "success" : "warning"}
                  sx={{ mt: 1 }}
                >
                  <strong>Prediction:</strong> {result.ml_prediction.prediction === 0 ? "Clean Code" : "Code Smell Detected"}
                  <br />
                  <strong>Confidence:</strong> {(result.ml_prediction.confidence * 100).toFixed(1)}%
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* AI Tips Section */}
          {result.ai_tips && (
            <Card sx={{ mt: 2, background: 'linear-gradient(135deg, #f0f4ff 60%, #e0e7ff 100%)', border: '1px solid #c7d2fe', boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f916.png" alt="AI" width={32} height={32} style={{ marginRight: 12 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#3730a3', mb: 0 }}>
                    AI Suggestions
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#312e81', fontSize: 17, lineHeight: 1.7 }}>
                  {result.ai_tips}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

export default UserCodeAnalyzer; 
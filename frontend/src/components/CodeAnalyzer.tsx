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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios, { AxiosError } from 'axios';

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
  ai_code_smell?: boolean;
  ai_confidence?: number;
  ai_suggestions?: string[];
  label?: number;
}

interface ErrorResponse {
  detail: string;
}

const CodeAnalyzer: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [label, setLabel] = useState<number | null>(null);
  const [showLabelButton, setShowLabelButton] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const response = await axios.post('http://localhost:8000/analyze', { code });
      setResult(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = axiosError.response.data?.detail || 'Failed to analyze code';
        setError(`Error: ${errorMessage}`);
      } else if (axiosError.request) {
        // The request was made but no response was received
        setError('No response from server. Please check if the backend is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Failed to analyze code. Please try again.');
      }
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update label in DB
  const handleLabelChange = async (newLabel: number) => {
    if (!result) return;
    try {
      await axios.patch(`http://localhost:8000/analyses/${result.id}/label`, { label: newLabel });
      setLabel(newLabel);
      setSuccessMessage('Label added successfully!');
      // Clear the form after successful label update
      setTimeout(() => {
        setCode('');
        setResult(null);
        setLabel(null);
        setShowLabelButton(false);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setError('Failed to update label.');
    }
  };

  // Set label from result if present
  React.useEffect(() => {
    if (result && typeof result.label === 'number') {
      setLabel(result.label);
    }
  }, [result]);

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

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
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

          {/* Admin Labeling UI */}
          <Box sx={{ mt: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="label-select-label">Code Smell Label (Admin)</InputLabel>
              <Select
                labelId="label-select-label"
                value={label !== null ? label : ''}
                label="Code Smell Label (Admin)"
                onChange={(e) => {
                  const newLabel = Number(e.target.value);
                  setLabel(newLabel);
                  if (newLabel === 0) {
                    setShowLabelButton(true);
                  } else {
                    setShowLabelButton(false);
                    handleLabelChange(newLabel);
                  }
                }}
              >
                <MenuItem value={0}>Clean</MenuItem>
                <MenuItem value={1}>Code Smell</MenuItem>
              </Select>
            </FormControl>

            {showLabelButton && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleLabelChange(0)}
                sx={{ mt: 2 }}
              >
                Add Label
              </Button>
            )}
          </Box>

          {result?.ai_code_smell !== undefined && (
            <Alert severity={result.ai_code_smell ? "warning" : "success"} sx={{ mt: 2 }}>
              <strong>AI Code Smell Detection:</strong> {result.ai_code_smell ? "Potential code smell detected." : "No code smell detected."}
              <br />
              <strong>Confidence:</strong> {result.ai_confidence !== undefined ? (result.ai_confidence * 100).toFixed(1) + '%' : 'N/A'}
              {result.ai_suggestions && result.ai_suggestions.length > 0 && (
                <ul>
                  {result.ai_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              )}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CodeAnalyzer; 
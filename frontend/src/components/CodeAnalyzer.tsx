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
  Container,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios, { AxiosError } from 'axios';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircleOutlineIcon sx={{ color: '#10B981' }} />;
    if (score >= 60) return <WarningAmberIcon sx={{ color: '#F59E0B' }} />;
    return <ErrorOutlineIcon sx={{ color: '#EF4444' }} />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(135deg, #0F172A 0%, #3B82F6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Code Quality Analyzer
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Analyze your Python code for quality, maintainability, and security issues
        </Typography>
      </Box>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(37, 99, 235, 0.02) 100%)',
        }}
      >
        <TextField
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          label="Enter your code here"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontFamily: 'monospace',
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          sx={{ 
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontSize: '1.1rem',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Code'}
        </Button>
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#EF4444',
            },
          }}
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#10B981',
            },
          }}
        >
          {successMessage}
        </Alert>
      )}

      {result && (
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4,
              fontWeight: 600,
            }}
          >
            Analysis Results
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Code Preview
                    </Typography>
                  </Box>
                  <SyntaxHighlighter
                    language="python"
                    style={vscDarkPlus}
                    customStyle={{ 
                      margin: 0,
                      borderRadius: 0,
                      fontSize: '0.9rem',
                    }}
                  >
                    {result.code}
                  </SyntaxHighlighter>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 4,
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Quality Scores
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            Overall Score
                          </Typography>
                          <Tooltip title="Combined score based on all metrics">
                            <IconButton size="small" sx={{ ml: 1 }}>
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {getScoreIcon(result.overall_score)}
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              color: getScoreColor(result.overall_score),
                              fontWeight: 700,
                            }}
                          >
                            {result.overall_score}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={result.overall_score}
                          sx={{ 
                            mt: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getScoreColor(result.overall_score),
                            },
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Pylint Score
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: getScoreColor(result.pylint_score),
                            fontWeight: 600,
                          }}
                        >
                          {result.pylint_score}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Complexity
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: getScoreColor(result.complexity_score),
                            fontWeight: 600,
                          }}
                        >
                          {result.complexity_score}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Security
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: getScoreColor(result.security_score),
                            fontWeight: 600,
                          }}
                        >
                          {result.security_score}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Maintainability
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: getScoreColor(result.maintainability_score),
                            fontWeight: 600,
                          }}
                        >
                          {result.maintainability_score}%
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Code Metrics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Code Size
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {result.metrics.code_size} lines
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Functions
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {result.metrics.function_count}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Classes
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {result.metrics.class_count}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Comment Ratio
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {result.metrics.comment_ratio}%
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default CodeAnalyzer; 
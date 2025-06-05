import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  History as HistoryIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  GitHub as GitHubIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import API_URL from '../config';

interface Analysis {
  id: number;
  repository?: string;
  file_path?: string;
  commit_sha?: string;
  commit_author?: string;
  created_at: string;
  overall_score: number;
  pylint_score: number;
  complexity_score: number;
  maintainability_score: number;
  security_score: number;
  ai_score?: number;
  ml_prediction?: {
    prediction: number;  // 0 for clean, 1 for code smell
    confidence: number;
  };
  ai_analysis?: {
    code_smells: Array<{
      type: string;
      severity: string;
      message: string;
      line: number;
    }>;
    suggestions: Array<{
      type: string;
      severity: string;
      message: string;
      line: number;
    }>;
  };
  metrics: {
    code_size: number;
    function_count: number;
    class_count: number;
    comment_ratio: number;
    test_coverage?: number | null;
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
  ai_tips?: string;
}

const AnalysisHistory: React.FC = () => {
  const theme = useTheme();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/analyses`);
        const unique = response.data.filter((analysis: Analysis, idx: number, self: Analysis[]) => {
          if (analysis.file_path && analysis.commit_sha) {
            return idx === self.findIndex(a => a.file_path === analysis.file_path && a.commit_sha === analysis.commit_sha);
          }
          return idx === self.findIndex(a => a.id === analysis.id);
        });
        setAnalyses(unique);
      } catch (err) {
        setError('Failed to load analysis history');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyses();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getIssueIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const renderSkeleton = () => (
    <Stack spacing={3}>
      {[1, 2, 3].map((i) => (
        <Card 
          key={i}
          elevation={0}
          sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" />
              <Divider />
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((j) => (
                  <Grid item xs={12} sm={6} md={3} key={j}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Analysis History
        </Typography>
      </Stack>

      {loading && renderSkeleton()}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2
          }}
        >
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {analyses.map((analysis) => (
          <Card 
            key={`${analysis.file_path || analysis.id}-${analysis.commit_sha || ''}`}
            elevation={0}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CodeIcon color="primary" />
                    <Typography variant="h6">
                      {analysis.repository ? `${analysis.repository} — ` : ''}{analysis.file_path || `Analysis #${analysis.id}`}
                    </Typography>
                  </Stack>
                  
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    sx={{ mt: 1, color: 'text.secondary' }}
                  >
                    {analysis.commit_sha && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <GitHubIcon fontSize="small" />
                        <Typography variant="body2">
                          {analysis.commit_sha.substring(0, 7)}
                        </Typography>
                      </Stack>
                    )}
                    {analysis.commit_author && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2">
                          {analysis.commit_author}
                        </Typography>
                      </Stack>
                    )}
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ScheduleIcon fontSize="small" />
                      <Typography variant="body2">
                        {new Date(analysis.created_at).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                <Divider />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Overall Score
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: getScoreColor(analysis.overall_score),
                          fontWeight: 'bold'
                        }}
                      >
                        {analysis.overall_score.toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Pylint Score
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: getScoreColor(analysis.pylint_score),
                          fontWeight: 'bold'
                        }}
                      >
                        {analysis.pylint_score.toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Security Score
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: getScoreColor(analysis.security_score),
                          fontWeight: 'bold'
                        }}
                      >
                        {analysis.security_score.toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Complexity
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: getScoreColor(analysis.complexity_score),
                          fontWeight: 'bold'
                        }}
                      >
                        {analysis.complexity_score.toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider />

                {/* Code Smell Detection */}
                {analysis.ml_prediction && (
                  <>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, mt: 2 }}>
                      <SecurityIcon color="primary" />
                      <Typography variant="h6">Code Smell Detection</Typography>
                    </Stack>
                    <Alert 
                      severity={analysis.ml_prediction.prediction === 0 ? "success" : "warning"}
                      sx={{ mb: 2 }}
                    >
                      <strong>Prediction:</strong> {analysis.ml_prediction.prediction === 0 ? "Clean Code" : "Code Smell Detected"}
                      <br />
                      <strong>Confidence:</strong> {(analysis.ml_prediction.confidence * 100).toFixed(1)}%
                    </Alert>
                  </>
                )}

                {/* AI Tips Section */}
                {analysis.ai_tips && (
                  <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #f0f4ff 60%, #e0e7ff 100%)', border: '1px solid #c7d2fe', boxShadow: 2 }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f916.png" alt="AI" width={32} height={32} style={{ marginRight: 12 }} />
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#3730a3', mb: 0 }}>
                          AI Suggestions
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#312e81', fontSize: 17, lineHeight: 1.7 }}>
                        {analysis.ai_tips}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <BuildIcon color="primary" />
                  <Typography variant="h6">Code Metrics</Typography>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Code Size
                      </Typography>
                      <Typography variant="h6">
                        {analysis.metrics.code_size}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        lines
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Functions
                      </Typography>
                      <Typography variant="h6">
                        {analysis.metrics.function_count}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Classes
                      </Typography>
                      <Typography variant="h6">
                        {analysis.metrics.class_count}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Comment Ratio
                      </Typography>
                      <Typography variant="h6">
                        {analysis.metrics.comment_ratio.toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Test Coverage
                      </Typography>
                      <Typography variant="h6">
                        {analysis.metrics.test_coverage ? `${analysis.metrics.test_coverage.toFixed(1)}%` : 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {analysis.ai_analysis && (
                  <>
                    <Divider />
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <SecurityIcon color="primary" />
                        <Typography variant="h6">AI Analysis</Typography>
                      </Stack>
                      
                      {analysis.ai_analysis.code_smells.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Code Smells
                          </Typography>
                          <Stack spacing={1}>
                            {analysis.ai_analysis.code_smells.map((smell, index) => (
                              <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  bgcolor: 'background.default',
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                {getIssueIcon(smell.severity)}
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2">
                                    Line {smell.line}: {smell.message}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Type: {smell.type}
                                  </Typography>
                                </Box>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {analysis.ai_analysis.suggestions.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Suggestions
                          </Typography>
                          <Stack spacing={1}>
                            {analysis.ai_analysis.suggestions.map((suggestion, index) => (
                              <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  bgcolor: 'background.default',
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                {getIssueIcon(suggestion.severity)}
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2">
                                    Line {suggestion.line}: {suggestion.message}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Type: {suggestion.type}
                                  </Typography>
                                </Box>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default AnalysisHistory; 
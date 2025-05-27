import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface RepositoryAnalysis {
  id: number;
  repository: string;
  commit_sha: string;
  commit_message: string;
  commit_author: string;
  file_path: string;
  created_at: string;
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
    test_coverage: number | null;
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
}

const RepositoryAnalysis: React.FC = () => {
  const theme = useTheme();
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<RepositoryAnalysis[]>([]);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const repoName = repositoryUrl.split('github.com/')[1]?.replace('.git', '');
      if (!repoName) {
        throw new Error('Invalid GitHub repository URL');
      }

      const response = await fetch(`http://localhost:8000/analyses?repository=${repoName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analysis results');
      }

      const data = await response.json();
      
      const uniqueAnalyses = data.filter((analysis: RepositoryAnalysis, index: number, self: RepositoryAnalysis[]) =>
        index === self.findIndex((a) => 
          a.file_path === analysis.file_path && 
          a.commit_sha === analysis.commit_sha
        )
      );
      
      setAnalyses(uniqueAnalyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <GitHubIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Repository Analysis
        </Typography>
      </Stack>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <TextField
          fullWidth
          label="GitHub Repository URL"
          value={repositoryUrl}
          onChange={(e) => setRepositoryUrl(e.target.value)}
          placeholder="https://github.com/username/repo"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={loading || !repositoryUrl}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GitHubIcon />}
          sx={{ 
            minWidth: 200,
            height: 48,
            borderRadius: 2
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Repository'}
        </Button>
      </Paper>

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
            key={`${analysis.file_path}-${analysis.commit_sha}`}
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
                      {analysis.file_path}
                    </Typography>
                  </Stack>
                  
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    sx={{ mt: 1, color: 'text.secondary' }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <GitHubIcon fontSize="small" />
                      <Typography variant="body2">
                        {analysis.repository}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <CodeIcon fontSize="small" />
                      <Typography variant="body2">
                        {analysis.commit_sha.substring(0, 7)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <PersonIcon fontSize="small" />
                      <Typography variant="body2">
                        {analysis.commit_author}
                      </Typography>
                    </Stack>
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
                        Maintainability
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          color: getScoreColor(analysis.maintainability_score),
                          fontWeight: 'bold'
                        }}
                      >
                        {analysis.maintainability_score.toFixed(1)}%
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
                        Security
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

                <Box>
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
                </Box>

                {(analysis.flake8_issues.length > 0 || analysis.bandit_issues.length > 0) && (
                  <>
                    <Divider />
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <SecurityIcon color="primary" />
                        <Typography variant="h6">Issues</Typography>
                      </Stack>
                      
                      {analysis.flake8_issues.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Flake8 Issues
                          </Typography>
                          <Stack spacing={1}>
                            {analysis.flake8_issues.map((issue, index) => (
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
                                {getIssueIcon(issue.type)}
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2">
                                    Line {issue.line}: {issue.message}
                                  </Typography>
                                  {issue.rule_id && (
                                    <Typography variant="caption" color="text.secondary">
                                      Rule: {issue.rule_id}
                                    </Typography>
                                  )}
                                </Box>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {analysis.bandit_issues.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Security Issues
                          </Typography>
                          <Stack spacing={1}>
                            {analysis.bandit_issues.map((issue, index) => (
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
                                {getIssueIcon(issue.type)}
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2">
                                    Line {issue.line}: {issue.message}
                                  </Typography>
                                  {issue.rule_id && (
                                    <Typography variant="caption" color="text.secondary">
                                      Rule: {issue.rule_id}
                                    </Typography>
                                  )}
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

export default RepositoryAnalysis; 
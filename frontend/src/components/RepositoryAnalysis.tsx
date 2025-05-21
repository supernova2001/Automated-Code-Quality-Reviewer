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
} from '@mui/material';
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
      
      // Extract repository name from URL
      const repoName = repositoryUrl.split('github.com/')[1]?.replace('.git', '');
      if (!repoName) {
        throw new Error('Invalid GitHub repository URL');
      }

      const response = await fetch(`http://localhost:8000/analyses?repository=${repoName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analysis results');
      }

      const data = await response.json();
      
      // Filter out duplicate analyses based on file_path and commit_sha
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Repository Analysis
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="GitHub Repository URL"
          value={repositoryUrl}
          onChange={(e) => setRepositoryUrl(e.target.value)}
          placeholder="https://github.com/username/repo"
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={loading || !repositoryUrl}
        >
          {loading ? <CircularProgress size={24} /> : 'Analyze Repository'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {analyses.map((analysis) => (
          <Grid item xs={12} key={`${analysis.file_path}-${analysis.commit_sha}`}>
            <Card>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {analysis.file_path}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Repository: {analysis.repository}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Commit: {analysis.commit_sha.substring(0, 7)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Author: {analysis.commit_author}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {new Date(analysis.created_at).toLocaleString()}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2">Overall Score</Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: getScoreColor(analysis.overall_score) }}
                    >
                      {analysis.overall_score.toFixed(1)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2">Maintainability</Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: getScoreColor(analysis.maintainability_score) }}
                    >
                      {analysis.maintainability_score.toFixed(1)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2">Security</Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: getScoreColor(analysis.security_score) }}
                    >
                      {analysis.security_score.toFixed(1)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2">Complexity</Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: getScoreColor(analysis.complexity_score) }}
                    >
                      {analysis.complexity_score.toFixed(1)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Code Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4} md={2}>
                    <Typography variant="body2">Code Size</Typography>
                    <Typography variant="body1">{analysis.metrics.code_size} lines</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Typography variant="body2">Functions</Typography>
                    <Typography variant="body1">{analysis.metrics.function_count}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Typography variant="body2">Classes</Typography>
                    <Typography variant="body1">{analysis.metrics.class_count}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Typography variant="body2">Comment Ratio</Typography>
                    <Typography variant="body1">{analysis.metrics.comment_ratio.toFixed(1)}%</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Typography variant="body2">Test Coverage</Typography>
                    <Typography variant="body1">
                      {analysis.metrics.test_coverage ? `${analysis.metrics.test_coverage.toFixed(1)}%` : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                {(analysis.flake8_issues.length > 0 || analysis.bandit_issues.length > 0) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Issues
                    </Typography>
                    <List>
                      {analysis.flake8_issues.map((issue, index) => (
                        <ListItem key={`flake8-${index}`}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label="Flake8"
                                  size="small"
                                  color="warning"
                                />
                                <Typography variant="body2">
                                  Line {issue.line}: {issue.message}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                      {analysis.bandit_issues.map((issue, index) => (
                        <ListItem key={`bandit-${index}`}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label="Bandit"
                                  size="small"
                                  color="error"
                                />
                                <Typography variant="body2">
                                  Line {issue.line}: {issue.message}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RepositoryAnalysis; 
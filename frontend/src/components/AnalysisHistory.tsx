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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

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
        const response = await axios.get('http://localhost:8000/analyses');
        // Filter unique by file_path + commit_sha if available, else by id
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analysis History
      </Typography>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <Grid container spacing={3}>
        {analyses.map((analysis) => (
          <Grid item xs={12} key={`${analysis.file_path || analysis.id}-${analysis.commit_sha || ''}`}> 
            <Card>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {analysis.repository ? `${analysis.repository} — ` : ''}{analysis.file_path || `Analysis #${analysis.id}`}
                  </Typography>
                  {analysis.commit_sha && (
                    <Typography variant="body2" color="text.secondary">
                      Commit: {analysis.commit_sha.substring(0, 7)}
                    </Typography>
                  )}
                  {analysis.commit_author && (
                    <Typography variant="body2" color="text.secondary">
                      Author: {analysis.commit_author}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {new Date(analysis.created_at).toLocaleString()}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2">Overall Score</Typography>
                    <Typography variant="h4" sx={{ color: getScoreColor(analysis.overall_score) }}>
                      {analysis.overall_score.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2">Pylint</Typography>
                    <Typography variant="h4" sx={{ color: getScoreColor(analysis.pylint_score) }}>
                      {analysis.pylint_score.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2">Security</Typography>
                    <Typography variant="h4" sx={{ color: getScoreColor(analysis.security_score) }}>
                      {analysis.security_score.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2">Complexity</Typography>
                    <Typography variant="h4" sx={{ color: getScoreColor(analysis.complexity_score) }}>
                      {analysis.complexity_score.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2">Maintainability</Typography>
                    <Typography variant="h4" sx={{ color: getScoreColor(analysis.maintainability_score) }}>
                      {analysis.maintainability_score.toFixed(2)}%
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
                                <Chip label="Flake8" size="small" color="warning" />
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
                                <Chip label="Bandit" size="small" color="error" />
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

export default AnalysisHistory; 
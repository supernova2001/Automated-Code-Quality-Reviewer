import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import axios, { AxiosError } from 'axios';

interface Analysis {
  id: number;
  code: string;
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

interface ErrorResponse {
  detail: string;
}

const AnalysisHistory: React.FC = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/analyses?skip=${(page - 1) * 10}&limit=10`);
      const newAnalyses = response.data;
      setAnalyses(prev => [...prev, ...newAnalyses]);
      setHasMore(newAnalyses.length === 10);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      if (axiosError.response) {
        const errorMessage = axiosError.response.data?.detail || 'Failed to fetch analysis history';
        setError(`Error: ${errorMessage}`);
      } else if (axiosError.request) {
        setError('No response from server. Please check if the backend is running.');
      } else {
        setError('Failed to fetch analysis history');
      }
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analysis History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {analyses.map((analysis) => (
          <Grid item xs={12} md={6} key={analysis.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analysis #{analysis.id}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {new Date(analysis.created_at).toLocaleString()}
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  Score: {analysis.overall_score}%
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Code Size</Typography>
                    <Typography variant="body1">
                      {analysis.metrics.code_size} lines
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">Functions</Typography>
                    <Typography variant="body1">
                      {analysis.metrics.function_count}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">Classes</Typography>
                    <Typography variant="body1">
                      {analysis.metrics.class_count}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {hasMore && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={loadMore}>
            Load More
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AnalysisHistory; 
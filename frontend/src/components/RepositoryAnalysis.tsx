import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  TextField,
} from '@mui/material';
import axios from 'axios';

interface RepositoryAnalysis {
  repository: string;
  commit: string;
  analyses: Array<{
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
  }>;
}

const RepositoryAnalysis: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract repository name from URL
      const repoMatch = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
      if (!repoMatch) {
        throw new Error('Invalid GitHub repository URL');
      }
      
      const repoName = repoMatch[1];
      
      // Get latest analysis for the repository
      const response = await axios.get(`http://localhost:8000/analyses?repository=${repoName}`);
      setAnalysis(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Repository Analysis
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="GitHub Repository URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAnalyze}
                disabled={loading || !repoUrl}
              >
                {loading ? <CircularProgress size={24} /> : 'Analyze Repository'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {analysis && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Analysis Results for {analysis.repository}
          </Typography>
          
          <Grid container spacing={2}>
            {analysis.analyses.map((fileAnalysis) => (
              <Grid item xs={12} md={6} key={fileAnalysis.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      File Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(fileAnalysis.created_at).toLocaleString()}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle1">Overall Score</Typography>
                        <Typography variant="h4" color="primary">
                          {fileAnalysis.overall_score}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle1">Pylint Score</Typography>
                        <Typography variant="h4" color="secondary">
                          {fileAnalysis.pylint_score}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle1">Complexity</Typography>
                        <Typography variant="h4" color="info.main">
                          {fileAnalysis.complexity_score}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle1">Security</Typography>
                        <Typography variant="h4" color="warning.main">
                          {fileAnalysis.security_score}%
                        </Typography>
                      </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                      Code Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">Code Size</Typography>
                        <Typography variant="body1">
                          {fileAnalysis.metrics.code_size} lines
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Functions</Typography>
                        <Typography variant="body1">
                          {fileAnalysis.metrics.function_count}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Classes</Typography>
                        <Typography variant="body1">
                          {fileAnalysis.metrics.class_count}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Comment Ratio</Typography>
                        <Typography variant="body1">
                          {fileAnalysis.metrics.comment_ratio}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default RepositoryAnalysis; 
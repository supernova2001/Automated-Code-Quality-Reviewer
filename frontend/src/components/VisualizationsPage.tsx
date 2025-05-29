import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e42', '#ef4444'];

const VisualizationsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/analytics') // Use full backend URL
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        try {
          return await res.json();
        } catch {
          throw new Error('Response is not valid JSON');
        }
      })
      .then(data => {
        setAnalytics(data.analytics || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Prepare data for charts
  const lineData = analytics.map((d: any) => ({
    date: d.date,
    score: d.overall_score,
    maintainability: d.maintainability_score,
    security: d.security_score,
    complexity: d.complexity_score,
  }));

  const barData = analytics.map((d: any) => ({
    date: d.date,
    issues: d.complexity_score + d.security_score, // Example: sum of scores as 'issues'
  }));

  // Example pie data (replace with real issue type distribution if available)
  const pieData = [
    { name: 'Maintainability', value: analytics.length ? analytics[analytics.length-1].maintainability_score : 0 },
    { name: 'Security', value: analytics.length ? analytics[analytics.length-1].security_score : 0 },
    { name: 'Complexity', value: analytics.length ? analytics[analytics.length-1].complexity_score : 0 },
  ];

  // Radar chart data for latest metric comparison
  const radarData = [
    { metric: 'Maintainability', value: analytics.length ? analytics[analytics.length-1].maintainability_score : 0 },
    { metric: 'Security', value: analytics.length ? analytics[analytics.length-1].security_score : 0 },
    { metric: 'Complexity', value: analytics.length ? analytics[analytics.length-1].complexity_score : 0 },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Code Quality Visualizations
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Code Quality Trend</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} name="Overall Score" />
                  <Line type="monotone" dataKey="maintainability" stroke="#10b981" strokeWidth={2} name="Maintainability" />
                  <Line type="monotone" dataKey="security" stroke="#ef4444" strokeWidth={2} name="Security" />
                  <Line type="monotone" dataKey="complexity" stroke="#7c3aed" strokeWidth={2} name="Complexity" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #f8fafc 60%, #fce7f3 100%)' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Issues Found Per Period</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="issues" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #f8fafc 60%, #d1fae5 100%)' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Latest Score Distribution</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #f8fafc 60%, #fef9c3 100%)' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Metric Comparison (Radar)</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Score" dataKey="value" stroke="#f59e42" fill="#f59e42" fillOpacity={0.6} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default VisualizationsPage; 
import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, useTheme } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const features = [
  {
    icon: <CodeIcon fontSize="large" />, 
    title: 'Automated Code Analysis',
    description: 'Instantly analyze your code for quality, maintainability, complexity, and security issues.'
  },
  {
    icon: <AssessmentIcon fontSize="large" />, 
    title: 'Comprehensive Analytics',
    description: 'Visualize trends and metrics to track code quality improvements over time.'
  },
  {
    icon: <SecurityIcon fontSize="large" />, 
    title: 'Security Insights',
    description: 'Detect vulnerabilities and security flaws before they reach production. We use the latest packages to ensure your code is secure.'
  },
  {
    icon: <TrendingUpIcon fontSize="large" />, 
    title: 'Seamless GitHub Integration',
    description: 'Integrate with GitHub for automated pull request reviews and repository monitoring.'
  },
];

const HomePage: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        bgcolor: 'background.default',
        pt: 8,
        px: 2,
      }}
    >
      <Typography
        variant="h2"
        align="center"
        sx={{ fontWeight: 500, mb: 2, color: 'primary.main', letterSpacing: 1 }}
      >
        Python Code Quality Reviewer
      </Typography>
      <Typography
        variant="h5"
        align="center"
        sx={{ mb: 4, color: 'text.secondary', maxWidth: 700 }}
      >
        Empower your Python development workflow with instant, automated code reviews, actionable insights, and beautiful analytics. Improve code quality, reduce technical debt, and ship secure, maintainable software faster.
      </Typography>
      <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: 1100 }}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.title}>
            <Card
              elevation={3}
              sx={{
                textAlign: 'center',
                py: 4,
                px: 2,
                borderRadius: 4,
                background: theme.palette.background.paper,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.03)',
                  boxShadow: '0 8px 24px rgba(80,80,180,0.10)',
                },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {feature.icon}
              </Avatar>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 6, textAlign: 'center', color: 'text.secondary', maxWidth: 700 }}>
        <Typography variant="subtitle1">
          Get started by submitting your Python code for instant review, or connect your GitHub repository for continuous quality monitoring!
        </Typography>
      </Box>
    </Box>
  );
};

export default HomePage; 
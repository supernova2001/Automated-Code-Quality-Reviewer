import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, useTheme, Container, Button } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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
        pt: { xs: 6, md: 10 },
        px: 2,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 700,
              mb: 3,
              background: 'linear-gradient(135deg, #0F172A 0%, #3B82F6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              lineHeight: 1.2,
            }}
          >
            Python Code Quality Reviewer
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              color: 'text.secondary',
              maxWidth: 800,
              mx: 'auto',
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              lineHeight: 1.6,
            }}
          >
            Empower your Python development workflow with instant, automated code reviews, actionable insights, and beautiful analytics. Improve code quality, reduce technical debt, and ship secure, maintainable software faster.
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
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
            Get Started
          </Button>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Card
                elevation={0}
                sx={{
                  textAlign: 'left',
                  p: 4,
                  borderRadius: 4,
                  background: theme.palette.background.paper,
                  transition: 'all 0.3s ease-in-out',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48,
                    mb: 3,
                  }}
                >
                  {feature.icon}
                </Avatar>
                <CardContent sx={{ p: 0 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2,
                      fontSize: '1.25rem',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box 
          sx={{ 
            mt: { xs: 8, md: 12 }, 
            textAlign: 'center',
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3,
              fontWeight: 600,
            }}
          >
            Ready to improve your code quality?
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            Get started by submitting your Python code for instant review, or connect your GitHub repository for continuous quality monitoring!
          </Typography>
          <Button
            variant="outlined"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1.1rem',
              textTransform: 'none',
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Connect GitHub
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage; 
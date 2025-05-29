import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const AnalysisPage: React.FC = () => {
  return (
    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Code Analysis
      </Typography>
      <Paper elevation={2} sx={{ p: 4, width: '100%', maxWidth: 700, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Code analysis functionality will appear here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AnalysisPage; 
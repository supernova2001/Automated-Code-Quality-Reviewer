import React, { useEffect, useState } from 'react';
import API_URL from '../config';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Stack,
  Divider,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';
import DnsIcon from '@mui/icons-material/Dns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const stateColor = (state: string) => {
  switch (state) {
    case 'running':
    case 'available':
      return 'success';
    case 'pending':
      return 'warning';
    case 'stopped':
    case 'terminated':
      return 'error';
    default:
      return 'default';
  }
};

const AwsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'info'|'success'|'error'|'warning'}>({open: false, message: '', severity: 'info'});
  const [billing, setBilling] = useState<{month: string, cost: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/aws-metrics`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      });
    fetch(`${API_URL}/api/aws-billing`)
      .then(res => res.json())
      .then(data => setBilling(data));
  }, []);

  const handleAction = (resourceType: string, resourceId: string, action: string) => {
    setSnackbar({
      open: true,
      message: `${action} action for ${resourceType} (${resourceId}) is not implemented in the demo UI`,
      severity: 'info',
    });
  };

  if (loading) return <Box p={4}><CircularProgress /> Loading AWS metrics...</Box>;
  if (!metrics) return <Box p={4}>No data available.</Box>;

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight={700} gutterBottom>AWS Resource Dashboard</Typography>
      <Divider sx={{ mb: 3 }} />
      {/* Billing Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={4} sx={{ bgcolor: 'green.50' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AttachMoneyIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Current Month Cost</Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {billing ? `$${parseFloat(billing.cost).toFixed(2)}` : 'Loading...'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {billing ? billing.month : ''}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        {/* EC2 Instances */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <CloudIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>EC2 Instances</Typography>
                <Chip label={metrics.ec2_instances.length} color="primary" size="small" />
              </Stack>
              {metrics.ec2_instances.length === 0 ? (
                <Typography color="text.secondary">No EC2 instances found.</Typography>
              ) : (
                <Stack spacing={1}>
                  {metrics.ec2_instances.map((inst: any) => (
                    <Card key={inst.id} variant="outlined" sx={{ mb: 1, bgcolor: 'grey.50' }}>
                      <CardContent sx={{ p: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {inst.state === 'running' ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                          <Typography variant="subtitle2">{inst.id}</Typography>
                          <Chip label={inst.state} color={stateColor(inst.state)} size="small" />
                          {inst.state === 'running' && (
                            <Button
                              size="small"
                              color="warning"
                              variant="contained"
                              sx={{ ml: 2 }}
                              onClick={() => handleAction('EC2 Instance', inst.id, 'Stop')}
                            >
                              Stop
                            </Button>
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Type: {inst.type} | Public IP: {inst.public_ip || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Launch Time: {inst.launch_time}
                        </Typography>
                        <Typography variant="caption" color="info.main">
                          CPU Utilization: {inst.cpu_utilization}%
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        {/* EKS Clusters */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <DnsIcon color="secondary" />
                <Typography variant="h6" fontWeight={600}>EKS Clusters</Typography>
                <Chip label={metrics.eks_clusters.length} color="secondary" size="small" />
              </Stack>
              {metrics.eks_clusters.length === 0 ? (
                <Typography color="text.secondary">No EKS clusters found.</Typography>
              ) : (
                <Stack spacing={1}>
                  {metrics.eks_clusters.map((cluster: any) => (
                    <Card key={cluster.name} variant="outlined" sx={{ mb: 1, bgcolor: 'grey.50' }}>
                      <CardContent sx={{ p: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip label={cluster.status} color={stateColor(cluster.status)} size="small" />
                          <Typography variant="subtitle2">{cluster.name}</Typography>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            sx={{ ml: 2 }}
                            onClick={() => handleAction('EKS Cluster', cluster.name, 'Delete')}
                          >
                            Delete
                          </Button>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Endpoint: {cluster.endpoint}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        {/* VPCs */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <StorageIcon color="success" />
                <Typography variant="h6" fontWeight={600}>VPCs</Typography>
                <Chip label={metrics.vpcs.length} color="success" size="small" />
              </Stack>
              {metrics.vpcs.length === 0 ? (
                <Typography color="text.secondary">No VPCs found.</Typography>
              ) : (
                <Stack spacing={1}>
                  {metrics.vpcs.map((vpc: any) => (
                    <Card key={vpc.id} variant="outlined" sx={{ mb: 1, bgcolor: 'grey.50' }}>
                      <CardContent sx={{ p: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip label={vpc.state} color={stateColor(vpc.state)} size="small" />
                          <Typography variant="subtitle2">{vpc.id}</Typography>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            sx={{ ml: 2 }}
                            onClick={() => handleAction('VPC', vpc.id, 'Delete')}
                          >
                            Delete
                          </Button>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          CIDR: {vpc.cidr}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AwsDashboard; 
import React from 'react';
import { Typography } from '@mui/material';

const PageTitle = ({ title }) => {
  return (
    <Typography variant="h5" component="h1" gutterBottom>
      {title}
    </Typography>
  );
};

export default PageTitle; 
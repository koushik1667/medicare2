import React from 'react';
import { Box } from '@mui/material';

interface LogoIconProps {
  size?: number;
  color?: string;
}

const LogoIcon: React.FC<LogoIconProps> = ({ size = 32, color = 'white' }) => {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 60 60"
      sx={{
        display: 'block',
      }}
    >
      {/* Background shield shape representing healthcare protection */}
      <path
        d="M30 5 L50 15 L50 35 Q50 50 30 55 Q10 50 10 35 L10 15 Z"
        fill={color}
        fillOpacity={0.9}
      />
      
      {/* Medical cross inside shield */}
      <rect x="22" y="20" width="16" height="6" fill="currentColor" rx="1" />
      <rect x="27" y="15" width="6" height="16" fill="currentColor" rx="1" />
      
      {/* AI/Technology circuit lines */}
      <circle cx="30" cy="30" r="3" fill="currentColor" fillOpacity={0.7} />
      <line x1="30" y1="27" x2="30" y2="20" stroke="currentColor" strokeWidth="1.5" strokeOpacity={0.7} />
      <line x1="30" y1="33" x2="30" y2="40" stroke="currentColor" strokeWidth="1.5" strokeOpacity={0.7} />
      <line x1="27" y1="30" x2="20" y2="30" stroke="currentColor" strokeWidth="1.5" strokeOpacity={0.7} />
      <line x1="33" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="1.5" strokeOpacity={0.7} />
    </Box>
  );
};

export default LogoIcon;

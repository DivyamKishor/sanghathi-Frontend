import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Avatar, 
  Stack, 
  alpha, 
  useTheme, 
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { 
  Person as PersonIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  Badge as BadgeIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';

const ViewingContextHeader = () => {
  const theme = useTheme();
  const location = useLocation();
  const params = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Extract menteeId or userId from params or query
  const query = new URLSearchParams(location.search);
  const menteeId = params.menteeId || params.studentId || params.userId || query.get('menteeId') || query.get('userId') || query.get('studentId');

  useEffect(() => {
    const fetchTargetUser = async () => {
      if (!menteeId || menteeId === currentUser?._id) {
        setTargetUser(null);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/users/${menteeId}`);
        if (response.data.status === 'success') {
          setTargetUser(response.data.data.user);
        }
      } catch (error) {
        console.error('Error fetching target user for header:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTargetUser();
  }, [menteeId, currentUser?._id]);

  if (!targetUser || !menteeId || menteeId === currentUser?._id) return null;

  const profile = targetUser.studentProfile || targetUser.profile;
  const usn = profile?.usn || profile?.registrationNumber || 'N/A';
  const dept = targetUser.department || profile?.department || 'N/A';
  const name = targetUser.name;

  return (
    <Box
      sx={{
        px: 3,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.primary.main, 0.03),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'fadeIn 0.3s ease-in-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(-10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar 
          src={targetUser.avatar} 
          sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: theme.palette.primary.main,
            boxShadow: theme.customShadows?.z8
          }}
        >
          {name?.charAt(0)}
        </Avatar>
        
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Viewing: {name}
            </Typography>
            <Typography variant="caption" sx={{ 
              px: 1, 
              py: 0.2, 
              borderRadius: 1, 
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: 'info.main',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              {targetUser.roleName}
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <BadgeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                USN: {usn}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <SchoolIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Dept: {dept}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      <Tooltip title="Clear Context">
        <IconButton 
          size="small" 
          onClick={() => {
            // Logic to clear context - usually means going back to dashboard or previous list
            window.history.back();
          }}
          sx={{ 
            '&:hover': { 
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main
            } 
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ViewingContextHeader;

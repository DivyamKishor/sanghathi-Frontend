import React, { useState, useContext } from "react";
import { Container, Grid, Typography, Box, useTheme } from "@mui/material";
import Page from "../../components/Page";
import { Card, CardHeader, CardContent, CardActionArea } from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Fab,
} from "@mui/material";
import {
  BugReport as BugReportIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  SummarizeOutlined as SummarizeOutlinedIcon,
  Grading as GradingIcon,
  ManageAccounts as ManageAccountsIcon,
  EventNote as EventNoteIcon,
  Group as GroupIcon,
  Dashboard as DashboardIcon,
  LiveHelp as LiveHelpIcon,
  Info as InfoOutlinedIcon
} from "@mui/icons-material";
import { blueGrey } from "@mui/material/colors";

import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HdrStrongIcon from '@mui/icons-material/HdrStrong';
import { alpha } from "@mui/material/styles";

import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import DashboardHeroCard from "../../components/dashboard/DashboardHeroCard";

const StudentTile = ({ title, icon, link }) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  
  return (
    <Card
      sx={{
        transition: "all 0.3s ease",
        borderRadius: 3,
        borderLeft: `4px solid ${isLight ? theme.palette.primary.main : theme.palette.info.main}`,
        overflow: 'hidden',
        backgroundColor: isLight 
          ? alpha(theme.palette.primary.main, 0.05)
          : alpha(theme.palette.info.main, 0.12),
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: isLight 
            ? theme.customShadows.primary
            : `0 10px 28px 0 ${alpha(theme.palette.info.dark, 0.3)}`,
        },
      }}
    >
      <CardActionArea component={Link} to={link}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            flexDirection: "row",
            minHeight: "auto",
            p: { xs: 2, sm: 3 },
            "&:hover": {
              backgroundColor: isLight 
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.info.main, 0.2),
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 52, sm: 64 },
              height: { xs: 52, sm: 64 },
              borderRadius: '12px',
              mr: { xs: 2, sm: 3 },
              backgroundColor: isLight
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.info.main, 0.15),
              color: isLight
                ? theme.palette.primary.main
                : theme.palette.info.light,
            }}
          >
            {React.cloneElement(icon, { fontSize: "large" })}
          </Box>
          
          <Box>
            <Typography 
              variant="h6" 
              component="div"
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5
              }}
            >
              {title}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                opacity: 0.8
              }}
            >
              Click to access
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const FacultyDashboard = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { user } = useContext(AuthContext);
  const [bugReportDialogOpen, setBugReportDialogOpen] = useState(false);
  
  const handleBugReportDialogOpen = () => {
    setBugReportDialogOpen(true);
  };
  
  const handleBugReportDialogClose = () => {
    setBugReportDialogOpen(false);
  };
  
  return (
    <Page title="Faculty Dashboard">
      <Box
        sx={{
          pt: 3,
          pb: 5,
          backgroundColor: isLight 
            ? alpha(theme.palette.primary.lighter, 0.4)
            : alpha(theme.palette.grey[900], 0.2),
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 0 } }}>
          <DashboardHeroCard
            user={user}
            fallbackName="Faculty"
            dashboardTitle="Faculty Dashboard"
            description="Welcome to the Sanghathi faculty portal. Access all faculty services from here."
          />

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
              <StudentTile
                title="Profile"
                icon={<PersonIcon />}
                link="/faculty/profile"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
              <StudentTile
                title="My Mentees"
                icon={<PeopleIcon />}
                link="/mentees"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
              <StudentTile
                title="Threads"
                icon={<QuestionAnswerIcon />}
                link="/threads"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6} lg={4}>
              <StudentTile
                title="Mentor-Mentee Conversation"
                icon={<AssignmentIcon />}
                link="/mentor-mentee-conversation"
              />
            </Grid>

            
            {/* <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
              <StudentTile
                title="Meetings"
                icon={<EventNoteIcon />}
                link="/meetings"
              />
            </Grid> */}
            
            <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
              <StudentTile
                title="Campus Buddy"
                icon={<HdrStrongIcon />}
                link="/campus-buddy"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
              <StudentTile
                title="SWOT Analysis"
                icon={<SummarizeOutlinedIcon />}
                link="/faculty/swot-analysis"
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Page>
  );
};

export default FacultyDashboard;

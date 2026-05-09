import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import { Container, Grid, Typography, Box, useTheme } from "@mui/material";
import Page from "../../components/Page";
import { Card, CardHeader, CardContent, CardActionArea } from "@mui/material";
import { useState, useEffect } from "react"; // Import useEffect
import React from "react";
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
  EmojiEvents as EmojiEventsIcon,
  Today as TodayIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { blueGrey } from "@mui/material/colors";
import { alpha } from "@mui/material/styles";

import logger from "../../utils/logger.js";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"; // Import useParams
import api from "../../utils/axios";
import DashboardHeroCard from "../../components/dashboard/DashboardHeroCard";

const StudentTile = ({ title, icon, link, menteeId }) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const updatedLink = link.includes('?') ? `${link}&menteeId=${menteeId}` : `${link}?menteeId=${menteeId}`;

  return (
    <Card
      sx={{
        transition: "all 0.3s ease",
        borderRadius: 3,
        borderLeft: isLight 
          ? `4px solid ${theme.palette.primary.main}` 
          : `4px solid ${theme.palette.info.main}`,
        overflow: 'hidden',
        backgroundColor: isLight 
          ? alpha(theme.palette.primary.main, 0.08) 
          : alpha(theme.palette.info.main, 0.1),
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: isLight 
            ? '0 8px 24px 0 rgba(0,0,0,0.1)' 
            : `0 8px 24px 0 ${alpha(theme.palette.info.dark, 0.3)}`,
        },
      }}
    >
      <CardActionArea component={Link} to={updatedLink}>
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
                ? alpha(theme.palette.primary.main, 0.12) 
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
                ? alpha(theme.palette.primary.main, 0.12)
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

const StudentDashboard = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [bugReportDialogOpen, setBugReportDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { menteeId } = useParams(); // Get menteeId from URL
  const location = useLocation();
  const [menteeData, setMenteeData] = useState(null); // Store mentee data
  const [mentorInfo, setMentorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const routePrefix = location.pathname.startsWith("/hod")
    ? "/hod"
    : location.pathname.startsWith("/director")
      ? "/director"
      : "/faculty";

  const handleBugReportDialogOpen = () => {
    setBugReportDialogOpen(true);
  };
  const handleBugReportDialogClose = () => {
    setBugReportDialogOpen(false);
  };

  useEffect(() => {
    const fetchMenteeData = async () => {
      try {
        const profileResponse = await api.get(`/student-profiles/${menteeId}`);
        logger.info("Student profile response:", profileResponse.data);
        const userData = profileResponse.data?.data || profileResponse.data;
        
        // Skip the user endpoint since it's returning 500 error
        setMenteeData(userData);
      } catch (err) {
        setError("Error fetching mentee data.");
        logger.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (menteeId) {
      fetchMenteeData();
    }
  }, [menteeId]); // Fetch data when menteeId changes

  useEffect(() => {
    const fetchMentorInfo = async () => {
      try {
        const response = await api.get(`/mentorship/mentor/${menteeId}`);
        setMentorInfo(response.data?.mentor || response.data?.data?.mentor || null);
      } catch (err) {
        logger.error("Error fetching mentor info:", err);
        setMentorInfo(null);
      }
    };

    if (menteeId) {
      fetchMentorInfo();
    }
  }, [menteeId]);

  if (loading) {
    return (
      <Page title="Mentee Dashboard">
        <Box
          sx={{
            minHeight: "55vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: 2,
            textAlign: "center",
          }}
        >
          <Typography>Loading Mentee Dashboard...</Typography>
        </Box>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Mentee Dashboard">
        <Box
          sx={{
            minHeight: "55vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: 2,
            textAlign: "center",
          }}
        >
          <Typography color="error">{error}</Typography>
        </Box>
      </Page>
    );
  }

  logger.info("Full menteeData structure:", menteeData);
  
  // Get mentee name based on the student profile structure
  const getFullName = () => {
    if (menteeData?.fullName) {
      const { firstName, middleName, lastName } = menteeData.fullName;
      if (middleName) {
        return `${firstName} ${middleName} ${lastName}`;
      }
      return `${firstName} ${lastName}`;
    }
    
    // Fallbacks if fullName structure is not available
    return menteeData?.name || 
           (menteeData?.firstName && menteeData?.lastName 
             ? `${menteeData.firstName} ${menteeData.lastName}`
             : menteeData?.firstName) ||
           menteeData?.studentName ||
           menteeData?.usn || // Use USN if nothing else is available
           "Mentee";
  };
  
  const menteeName = getFullName();
  const menteeHeroUser = {
    name: menteeName,
    profile: { photo: menteeData?.photo || null },
    photo: menteeData?.photo || null,
    avatar: menteeData?.avatar || null,
  };

  const handleOpenThreads = () => {
    if (mentorInfo?._id) {
      navigate(`/hod/thread-reports/${mentorInfo._id}/${menteeId}`);
      return;
    }

    if (routePrefix === "/faculty") {
      navigate(`/threads?menteeId=${menteeId}`);
    }
  };

  logger.info("Extracted mentee name:", menteeName);
  
  return (
    <Page title={`${menteeName}'s Dashboard`}>
      <Box
        sx={{
          pt: 3,
          pb: 5,
          backgroundColor: isLight 
            ? alpha(theme.palette.primary.lighter, 0.4)
            : alpha(theme.palette.background.default, 0.7),
          minHeight: '100vh',
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            px: { xs: 1.5, sm: 3 },
            py: 0,
          }}
        >
          <DashboardHeroCard
            user={menteeHeroUser}
            fallbackName="Mentee"
            dashboardTitle="Dashboard"
            description="View and manage all information related to your mentee from this dashboard."
          />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={6} lg={4}>
              <StudentTile
                title="Profile"
                icon={<PersonIcon />}
                link="/student/profile"
                menteeId={menteeId}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6} lg={4}>
              <StudentTile
                title="Career review"
                icon={<PersonIcon />}
                link="/career-review"
                menteeId={menteeId}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6} lg={4}>
              <Card
                sx={{
                  transition: "all 0.3s ease",
                  borderRadius: 3,
                  borderLeft: isLight
                    ? `4px solid ${theme.palette.primary.main}`
                    : `4px solid ${theme.palette.info.main}`,
                  overflow: 'hidden',
                  backgroundColor: isLight
                    ? alpha(theme.palette.primary.main, 0.08)
                    : alpha(theme.palette.info.main, 0.1),
                  opacity: routePrefix !== "/faculty" && !mentorInfo?._id ? 0.7 : 1,
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: isLight
                      ? '0 8px 24px 0 rgba(0,0,0,0.1)'
                      : `0 8px 24px 0 ${alpha(theme.palette.info.dark, 0.3)}`,
                  },
                }}
              >
                <CardActionArea
                  onClick={handleOpenThreads}
                  disabled={routePrefix !== "/faculty" && !mentorInfo?._id}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      flexDirection: "row",
                      minHeight: "auto",
                      p: { xs: 2, sm: 3 },
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
                          ? alpha(theme.palette.primary.main, 0.12)
                          : alpha(theme.palette.info.main, 0.15),
                        color: isLight
                          ? theme.palette.primary.main
                          : theme.palette.info.light,
                      }}
                    >
                      <QuestionAnswerIcon fontSize="large" />
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
                        Threads
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ opacity: 0.8 }}
                      >
                        {routePrefix === "/faculty"
                          ? "Open the thread list for this mentee."
                          : mentorInfo?._id
                            ? `View threads between ${mentorInfo.name} and this mentee.`
                            : "Mentor details are loading."}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={6} lg={4}>
              <StudentTile
                title="Scorecard"
                icon={<AssignmentIcon />}
                link="/scorecard"
                menteeId={menteeId}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={6} lg={4}>
              <StudentTile
                title="Placement"
                icon={<EmojiEventsIcon />}
                link="/placement"
                menteeId={menteeId}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={6} lg={4}>
              <StudentTile
                title="Attendance"
                icon={<TodayIcon />}
                link="/student/attendance"
                menteeId={menteeId}
              />
            </Grid>
            
            {/* <Grid item xs={12} sm={6} md={6} lg={4}>
              <StudentTile
                title="Parent Teacher Meeting"
                icon={<GroupIcon />}
                link="/student/ptm"
                menteeId={menteeId}
              />
            </Grid> */}
            
            <Grid item xs={12} sm={6} md={6} lg={4}>
              <StudentTile
                title="PO Attainment and Bloom's Level"
                icon={<GroupIcon />}
                link="/po-attainment-grading"
                menteeId={menteeId}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6} lg={4}>
              <StudentTile
                title="TYL Scorecard"
                icon={<AssignmentIcon />}
                link="/student/tyl-scorecard"
                menteeId={menteeId}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StudentTile
                title="Offline Mentor-Mentee Conversation"
                icon={<QuestionAnswerIcon />}
                link="/mentor-mentee-conversation"
                menteeId={menteeId}   // ✅ add this prop for consistency
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Page>
  );
};
export default StudentDashboard;
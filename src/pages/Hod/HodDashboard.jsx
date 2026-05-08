import React, { useContext } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  useTheme,
  Box,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  PeopleAlt as PeopleAltIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Summarize as SummarizeIcon,
  SupervisorAccount as SupervisorAccountIcon,
  RateReviewOutlined as RateReviewOutlinedIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { blueGrey } from "@mui/material/colors";
import { alpha } from "@mui/material/styles";
import { AuthContext } from "../../context/AuthContext";
import DashboardHeroCard from "../../components/dashboard/DashboardHeroCard";


const HodTile = ({ title, icon, link }) => {
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

const HodDashboard = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { user } = useContext(AuthContext);
  
  return (
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
          fallbackName="HOD"
          dashboardTitle="HOD Dashboard"
          description="Welcome to the Sanghathi HOD portal. Manage users and system data from here."
        />
        
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
            <HodTile
              title="Profile"
              icon={<PersonIcon />}
              link="/faculty/profile"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
            <HodTile
              title="View All Users"
              icon={<PeopleAltIcon />}
              link="/admin/users"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
            <HodTile
              title="Assign Mentors"
              icon={<SupervisorAccountIcon />}
              link="/admin/mentor-assignment"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
            <HodTile
              title="Thread Reports"
              icon={<SummarizeIcon />}
              link="/report"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={isLight ? 6 : 6} lg={isLight ? 4 : 4}>
            <HodTile
              title="Feedback Review"
              icon={<RateReviewOutlinedIcon />}
              link="/feedback/manage"
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HodDashboard;
// @mui
import { Container, Tab, Box, Tabs, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useLocation } from "react-router-dom";
// routes

// hooks
import useTabs from "../../hooks/useTabs";

// components
import Page from "../../components/Page";
import Iconify from "../../components/Iconify";
import Thread from "../Thread/Thread";
import { Box as MuiBox, Paper as MuiPaper, Typography as MuiTypography } from "@mui/material";
// sections
import StudentDetailsForm from "./StudentDetailsForm";
import AdmissionDetails from "./AdmissionDetails";
import LocalGuardianForm from "./LocalGuardianForm";
import ParentsDetails from "./ParentsDetails";
import ContactDetails from "./ContactDetails";
import PrevAcademic from "./PrevAcademic";

// ----------------------------------------------------------------------


export default function StudentProfile() {
  const { currentTab, onChangeTab } = useTabs("Student Details");
  const theme = useTheme();
  const location = useLocation();
  const isLight = theme.palette.mode === 'light';
  const colorMode = isLight ? 'primary' : 'info';
  
  // Check if we're in admin edit mode
  const searchParams = new URLSearchParams(location.search);
  const isAdminEdit = searchParams.get('adminEdit') === 'true';
  const menteeId = searchParams.get('menteeId');

  // Define all available tabs
  const ALL_TABS = [
    {
      value: "Student Details",
      icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
      component: <StudentDetailsForm colorMode={colorMode} menteeId={menteeId} isAdminEdit={isAdminEdit} />,
    },
    {
      value: "Parent Details",
      icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
      component: <ParentsDetails colorMode={colorMode} />,
    },
    {
      value: "Guardian Details",
      icon: <Iconify icon={"ic:round-receipt"} width={20} height={20} />,
      component: <LocalGuardianForm colorMode={colorMode} />,
    },
    {
      value: "Contact Details",
      icon: <Iconify icon={"eva:bell-fill"} width={20} height={20} />,
      component: <ContactDetails colorMode={colorMode} />,
    },
    {
      value: "Academic Details",
      icon: <Iconify icon={"eva:share-fill"} width={20} height={20} />,
      component: <PrevAcademic colorMode={colorMode} />,
    },
    {
      value: "Admission Details",
      icon: <Iconify icon={"eva:share-fill"} width={20} height={20} />,
      component: <AdmissionDetails colorMode={colorMode} />,
    },
    {
      value: "Threads",
      icon: <Iconify icon={"ic:round-forum"} width={20} height={20} />,
      component: (
        <MuiBox sx={{ mt: 2 }}>
          <MuiPaper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 2,
              borderRadius: 2,
              backgroundColor: isLight
                ? 'rgba(255, 255, 255, 0.85)'
                : alpha(theme.palette.background.paper, 0.8),
            }}
          >
            <MuiTypography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Your Threads
            </MuiTypography>
            <MuiTypography variant="body2" color="text.secondary">
              Review the thread list with your mentor and open any thread to see the full conversation.
            </MuiTypography>
          </MuiPaper>
          <Thread />
        </MuiBox>
      ),
    },
  ];

  // Use only student details tab for admin edit mode, all tabs for regular student view
  const ACCOUNT_TABS = isAdminEdit ? [ALL_TABS[0]] : ALL_TABS;

  return (
    <Page title="Student Profile">
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 2,
            backgroundColor: isLight
              ? 'rgba(255, 255, 255, 0.8)'
              : alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
            boxShadow: isLight
              ? '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
              : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                background: isLight
                  ? `-webkit-linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                  : `-webkit-linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
              }}
            >
              Student Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage personal, admission, family, contact, academic, and thread details.
            </Typography>
          </Box>

          <Tabs
            allowScrollButtonsMobile
            variant="scrollable"
            scrollButtons="auto"
            value={currentTab}
            onChange={onChangeTab}
            textColor="inherit"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                px: { xs: 1.5, sm: 3 },
                mx: 0.5,
                borderRadius: '8px 8px 0 0',
                color: isLight ? theme.palette.text.secondary : theme.palette.text.primary,
                '&.Mui-selected': {
                  color: isLight ? theme.palette.primary.main : theme.palette.info.main,
                  backgroundColor: alpha(
                    isLight ? theme.palette.primary.main : theme.palette.info.main,
                    isLight ? 0.1 : 0.2
                  ),
                  fontWeight: 'bold',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                backgroundColor: isLight ? theme.palette.primary.main : theme.palette.info.main,
              },
            }}
          >
            {ACCOUNT_TABS.map((tab) => (
              <Tab
                disableRipple
                key={tab.value}
                label={tab.value}
                icon={tab.icon}
                value={tab.value}
              />
            ))}
          </Tabs>
        </Paper>

        {ACCOUNT_TABS.map((tab) => {
          const isMatched = tab.value === currentTab;
          return isMatched && <Box key={tab.value}>{tab.component}</Box>;
        })}
      </Container>
    </Page>
  );
}

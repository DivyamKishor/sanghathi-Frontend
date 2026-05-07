import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import HdrStrongIcon from '@mui/icons-material/HdrStrong';
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import SchoolIcon from "@mui/icons-material/School";

// Campus buddy icon needs special treatment as it represents a feature
// NavItemButton already handles the correct color for all icons based on theme mode
// This setup keeps the config simpler
const HodNavConfig = [
  {
    text: "Home",
    icon: <HomeOutlinedIcon />,
    link: "/hod/dashboard",
  },
  { text: "View Users", 
    icon: <PeopleOutlinedIcon />, 
    link: "/hod/users" },
  { text: "Reports", icon: <SummarizeOutlinedIcon />, link: "/report" },
  { text: "Settings", icon: <SettingsOutlinedIcon />, link: "/settings" },
];

const adminNavConfig = [
  {
    text: "Home",
    icon: <HomeOutlinedIcon />,
    link: "/admin/dashboard",
  },
  {
    text: "Add User",
    icon: <PersonAddOutlinedIcon />,
    link: "/admin/add-user",
  },
  {
    text: "Add Data",
    icon: <DatasetOutlinedIcon />,
    link: "/admin/data",
  },
  { text: "View Users", 
    icon: <PeopleOutlinedIcon />, 
    link: "/admin/users" },
  { text: "View Mentor", 
    icon: <SchoolIcon />, 
    link: "/admin/mentors" },
  {
    text: "Upload History",
    icon: <HistoryOutlinedIcon />,
    link: "/admin/upload-history",
  },
  { text: "Reports", icon: <SummarizeOutlinedIcon />, link: "/report" },
  { text: "Settings", icon: <SettingsOutlinedIcon />, link: "/settings" },
];

const facultyNavConfig = [
  { text: "Home", icon: <HomeOutlinedIcon />, link: "/faculty/dashboard" },
  { text: "My Mentees", icon: <PeopleIcon />, link: "/mentees" },
  { text: "Threads", icon: <QuestionAnswerOutlinedIcon />, link: "/threads" },
  // { text: "Meetings", icon: <EventOutlinedIcon />, link: "/meetings" },
  { text: "Campus Buddy", icon: <HdrStrongIcon />, link: "/campus-buddy" },
  { text: "What's New", icon: <CampaignOutlinedIcon />, link: "/updates" },
  { text: "Settings", icon: <SettingsOutlinedIcon />, link: "/settings" },
];

const hodNavConfig = [
  { text: "Home", icon: <HomeOutlinedIcon />, link: "/hod/dashboard" },
  { text: "Department Mentors", icon: <PeopleIcon />, link: "/hod/mentors" },
  { text: "Reports", icon: <SummarizeOutlinedIcon />, link: "/report" },
  { text: "Threads", icon: <QuestionAnswerOutlinedIcon />, link: "/threads" },
  { text: "Campus Buddy", icon: <HdrStrongIcon />, link: "/campus-buddy" },
  { text: "What's New", icon: <CampaignOutlinedIcon />, link: "/updates" },
  { text: "Settings", icon: <SettingsOutlinedIcon />, link: "/settings" },
];

const directorNavConfig = [
  { text: "Home", icon: <HomeOutlinedIcon />, link: "/director/dashboard" },
  { text: "All Mentors", icon: <PeopleIcon />, link: "/director/mentors" },
  { text: "View Users", icon: <PeopleOutlinedIcon />, link: "/director/users" },
  { text: "Reports", icon: <SummarizeOutlinedIcon />, link: "/report" },
  { text: "Threads", icon: <QuestionAnswerOutlinedIcon />, link: "/threads" },
  { text: "Campus Buddy", icon: <HdrStrongIcon />, link: "/campus-buddy" },
  { text: "What's New", icon: <CampaignOutlinedIcon />, link: "/updates" },
  { text: "Settings", icon: <SettingsOutlinedIcon />, link: "/settings" },
];

const studentNavConfig = [
  { text: "Home", icon: <HomeOutlinedIcon />, link: "/" },
  { text: "Threads", icon: <QuestionAnswerOutlinedIcon />, link: "/threads" },
  // { text: "Meetings", icon: <EventOutlinedIcon />, link: "/meetings" },
  { text: "Mentor Details", icon: <PersonOutlinedIcon />, link: "/mentor-details" },
  { text: "Campus Buddy", icon: <HdrStrongIcon />, link: "/campus-buddy" },
  { text: "What's New", icon: <CampaignOutlinedIcon />, link: "/updates" },
  { text: "Settings", icon: <SettingsOutlinedIcon />, link: "/settings" },
];

const getNavConfig = (role) => {
  switch (role) {
    case "admin":
      return adminNavConfig;
    case "faculty":
      return facultyNavConfig;
    case "hod":
      return hodNavConfig;
    case "director":
      return directorNavConfig;
    case "student":
      return studentNavConfig;
    default:
      return [];
  }
};

export default getNavConfig;

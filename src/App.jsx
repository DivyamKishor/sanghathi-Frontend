import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useContext, useEffect, lazy } from "react";
import { Box } from "@mui/material";
import ThemeProvider from "./theme";
import LazyLoadWrapper from "./components/loader/LazyLoadWrapper";
import GlobalTopLoader from "./components/loader/GlobalTopLoader";
import ProtectedRouteWrapper from "./ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import MotionLazyContainer from "./components/animate/MotionLazyContainer";
import NotistackProvider from "./components/NotistackProvider";
import { AuthContext } from "./context/AuthContext";
import { initGA, trackPageView } from "./ga";
import Footer from "./components/Footer";

const Signup = lazy(() => import("./pages/Users/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MeetingCalendar = lazy(() => import("./pages/Meeting/MeetingCalendar"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const User = lazy(() => import("./pages/Users/User"));
const StudentProfile = lazy(() => import("./pages/Student/StudentProfile"));
const MentorAllocation = lazy(() => import("./pages/MentorAllocation/MentorAllocation"));
const Academic = lazy(() => import("./pages/Student/Academic"));
const AdmissionDetailsPage = lazy(() => import("./pages/Student/AdmissionDetailsPage"));
const Placement = lazy(() => import("./pages/Placement/Placement"));
const Ptm = lazy(() => import("./pages/ParentsTeacherMeeting/Ptm"));
const Attendance = lazy(() => import("./pages/Student/Attendance"));
const Thread = lazy(() => import("./pages/Thread/Thread"));
const ThreadWindow = lazy(() => import("./pages/Thread/ThreadWindow"));
const Report = lazy(() => import("./pages/Report/Report"));
const ThreadReports = lazy(() => import("./pages/ThreadReports/ThreadReports"));
const ThreadReportsByMentor = lazy(() => import("./pages/ThreadReports/ThreadReportsByMentor"));
const ThreadReportsByStudent = lazy(() => import("./pages/ThreadReports/ThreadReportsByStudent"));
const RecentThreads = lazy(() => import("./pages/ThreadReports/RecentThreads"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const DirectorDashboard = lazy(() => import("./pages/Director/DirectorDashboard"));
const DirectorViewMentors = lazy(() => import("./pages/Director/DirectorViewMentors"));
const DirectorMenteesList = lazy(() => import("./pages/Director/DirectorMenteesList"));
const HodDashboard = lazy(() => import("./pages/Hod/HodDashboard"));
const ViewUsers = lazy(() => import("./pages/Admin/ViewUsers"));
const ViewMentors = lazy(() => import("./pages/Admin/ViewMentors"));
const Data = lazy(() => import("./pages/Admin/Data"));
const UploadHistory = lazy(() => import("./pages/Admin/UploadHistory"));
const FacultyDashboard = lazy(() => import("./pages/Faculty/FacultyDashboard"));
const CareerReview = lazy(() => import("./pages/CareerReview/CareerReview"));
const ScoreCard = lazy(() => import("./pages/Scorecard/ScoreCard"));
const POAttainmentGrading = lazy(() => import("./pages/MenteePOAttainment/POAttainmentGrading"));
const StudentProfileOnly = lazy(() => import("./pages/Student/StudentProfileOnly"));
const FacultyProfile = lazy(() => import("./pages/Faculty/FacultyProfile"));
const FacultyProfileInfo = lazy(() => import("./pages/Faculty/FacultyProfileInfo"));
const FetchStudentProfile = lazy(() => import("./pages/Faculty/FetchStudentProfile"));
const StudentDashboard = lazy(() => import("./pages/Faculty/StudentDashboard"));
const Settings = lazy(() => import("./pages/Settings/Settings"));
const TYLScorecard = lazy(() => import("./pages/Student/TYLScorecard"));
const MentorMenteeConversation = lazy(() => import("./pages/MentorMentee/MentorMenteeConversation"));
const FeedbackForm = lazy(() => import("./pages/Feedback/feedback"));
const FeedbackManagement = lazy(() => import("./pages/Feedback/FeedbackManagement"));
const MyChatBot = lazy(() => import("./mychatbot"));
const Updates = lazy(() => import("./pages/Updates"));

function App() {
  // Track page views on route change using Google Analytics GA4
  const location = useLocation();

  useEffect(() => {
    initGA(); // Initialize GA once on mount
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search); // Track page changes
  }, [location]);

  const globalFooterPrefixes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/resetPassword",
  ];

  const shouldRenderGlobalFooter = globalFooterPrefixes.some(
    (prefix) =>
      location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
  );


  const { user } = useContext(AuthContext);
  return (
    <ThemeProvider>
      <GlobalTopLoader />
      <NotistackProvider>
        <MotionLazyContainer>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Routes>
                <Route
                  path="/login"
                  element={
                    user ? <Navigate replace to="/" /> : <LazyLoadWrapper component={Login} />
                  }
                />
                <Route path="/forgot-password" element={<LazyLoadWrapper component={ForgotPassword} />} />
                <Route path="/reset-password/:token" element={<LazyLoadWrapper component={ResetPassword} />} />
                <Route path="/resetPassword/:token" element={<LazyLoadWrapper component={ResetPassword} />} />
                <Route path="/signup" element={<LazyLoadWrapper component={Signup} />} />

                <Route element={<DashboardLayout />}>
                  <Route
                    path="/"
                    element={
                      user ? (
                        user.roleName === "faculty" ? (
                          <Navigate replace to="/faculty/dashboard" />
                        ) : user.roleName === "admin" ? (
                          <Navigate replace to="/admin/dashboard" />
                        ) : user.roleName === "director" ? (
                          <Navigate replace to="/director/dashboard" />
                        ) : user.roleName === "hod" ? (
                          <Navigate replace to="/hod/dashboard" />
                        ): (
                          <ProtectedRouteWrapper allowedRoles={["student"]}>
                            <LazyLoadWrapper component={Dashboard} />
                          </ProtectedRouteWrapper>
                        )
                      ) : (
                        <Navigate replace to="/login" />
                      )
                    }
                  />

                  <Route
                    path="/faculty/dashboard"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["faculty"]}>
                        <LazyLoadWrapper component={FacultyDashboard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/faculty/mentee-profile/:menteeId"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["faculty"]}>
                        <LazyLoadWrapper component={StudentDashboard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["admin"]}>
                        <LazyLoadWrapper component={AdminDashboard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/hod/dashboard"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["hod"]}>
                        <LazyLoadWrapper component={HodDashboard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/director/dashboard"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["director"]}>
                        <LazyLoadWrapper component={DirectorDashboard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/hod/mentors"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["hod"]}>
                        <LazyLoadWrapper component={DirectorViewMentors} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/hod/thread-reports"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["faculty", "hod", "admin", "director"]}>
                        <LazyLoadWrapper component={ThreadReports} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/hod/thread-reports/:mentorId"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["faculty", "hod", "admin", "director"]}>
                        <LazyLoadWrapper component={ThreadReportsByMentor} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/hod/thread-reports/:mentorId/:studentId"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["faculty", "hod", "admin", "director"]}>
                        <LazyLoadWrapper component={ThreadReportsByStudent} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/recent-threads"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["hod", "admin", "director"]}>
                        <LazyLoadWrapper component={RecentThreads} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/director/mentors"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["director"]}>
                        <LazyLoadWrapper component={DirectorViewMentors} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/director/mentor/:mentorId/mentees"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["director","hod"]}>
                        <LazyLoadWrapper component={DirectorMenteesList} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/hod/mentor/:mentorId/mentees"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["hod"]}>
                        <LazyLoadWrapper component={DirectorMenteesList} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/director/mentee-profile/:menteeId"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["director","hod"]}>
                        <LazyLoadWrapper component={StudentDashboard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/hod/mentee-profile/:menteeId"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["hod"]}>
                        <LazyLoadWrapper component={StudentDashboard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/admin/add-user"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={User} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={ViewUsers} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/admin/mentors"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["admin"]}>
                        <LazyLoadWrapper component={ViewMentors} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/director/users"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={ViewUsers} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/admin/mentor-assignment"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={MentorAllocation} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/admin/data"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={Data} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/admin/upload-history"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["admin"]}>
                        <LazyLoadWrapper component={UploadHistory} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/meetings"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={MeetingCalendar} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/student/profile"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={StudentProfile} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/feedback"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["student"]}>
                        <LazyLoadWrapper component={FeedbackForm} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/feedback/manage"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["admin", "hod", "director"]}>
                        <LazyLoadWrapper component={FeedbackManagement} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/student/academic"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={Academic} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/student/admission"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={AdmissionDetailsPage} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/placement"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={Placement} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route path="/Placement/Placement" element={<Navigate replace to="/placement" />} />

                  <Route
                    path="/mentees"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={FetchStudentProfile} />
                      </ProtectedRouteWrapper>
                    }
                  />

                  <Route
                    path="/mentor-details"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={FacultyProfileInfo} />
                      </ProtectedRouteWrapper>
                    }
                  />

                  <Route
                    path="/student/ptm"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={Ptm} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/campus-buddy"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={MyChatBot} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/student/attendance"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={Attendance} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/career-review"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={CareerReview} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route path="/CareerReview/CareerReview" element={<Navigate replace to="/career-review" />} />
                  <Route
                    path="/scorecard"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={ScoreCard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route path="/scorecard/ScoreCard" element={<Navigate replace to="/scorecard" />} />
                  <Route path="/Scorecard/ScoreCard" element={<Navigate replace to="/scorecard" />} />
                  <Route
                    path="/po-attainment-grading"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={POAttainmentGrading} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/threads"
                    element={
                      <ProtectedRouteWrapper>
                        {["hod", "admin", "director"].includes(user?.roleName) ? (
                          <Navigate replace to="/recent-threads" />
                        ) : (
                          <LazyLoadWrapper component={Thread} />
                        )}
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/threads/:threadId"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={ThreadWindow} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/report"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={Report} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/student/profile-only"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={StudentProfileOnly} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route path="/student/StudentProfileOnly" element={<Navigate replace to="/student/profile-only" />} />
                  <Route
                    path="/faculty/profile"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={FacultyProfile} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route path="/faculty/FacultyProfile" element={<Navigate replace to="/faculty/profile" />} />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={Settings} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/updates"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={Updates} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/mentee/dashboard"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["student"]}>
                        <LazyLoadWrapper component={StudentDashboard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/faculty/mentor-mentee-conversation/:menteeId"
                    element={
                      <ProtectedRouteWrapper allowedRoles={["faculty", "hod", "director"]}>
                        <LazyLoadWrapper component={MentorMenteeConversation} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/student/tyl-scorecard"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={TYLScorecard} />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/mentor-mentee-conversation"
                    element={
                      <ProtectedRouteWrapper>
                        <LazyLoadWrapper component={MentorMenteeConversation} />
                      </ProtectedRouteWrapper>
                    }
                  />
                </Route>
                
              </Routes>
              {shouldRenderGlobalFooter ? <Footer /> : null}
            </Box>
          </Box>
        </MotionLazyContainer>
      </NotistackProvider>
    </ThemeProvider>
  );
}

export default App;

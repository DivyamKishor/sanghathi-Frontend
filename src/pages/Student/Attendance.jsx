import { useState, useEffect, useContext, useCallback } from "react";
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { AuthContext } from "../../context/AuthContext";
import useStudentSemester from "../../hooks/useStudentSemester";
import api from "../../utils/axios";

import logger from "../../utils/logger.js";
const Attendance = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();
  const { semester: studentSemester, loading: semesterLoading } = useStudentSemester();
  const [attendanceData, setAttendanceData] = useState([]);
  const [studentInfo, setStudentInfo] = useState({ usn: '', name: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(null); // Initialize to null
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 for "All"

  const fetchAttendance = useCallback(async () => {
    // Wait for semester to load before fetching
    if (semesterLoading) {
      return;
    }

    try {
      // Get menteeId from URL params if viewing as faculty
      const menteeId = searchParams.get('menteeId') || user?._id;

      if (!menteeId) {
        setError("User not authenticated or mentee ID not provided.");
        setLoading(false);
        return;
      }
      
      logger.info("Fetching attendance for ID:", menteeId); // Debug log
      
      // Fetch student info (optional - don't fail if this errors)
      try {
        const userResponse = await api.get(`/users/${menteeId}`);
        
        if (userResponse.data?.data?.user) {
          setStudentInfo({
            usn: userResponse.data.data.user.usn || '',
            name: userResponse.data.data.user.name || ''
          });
        }
      } catch (userError) {
        logger.warn("Could not fetch user info:", userError);
        // Use user from context as fallback
        if (user) {
          setStudentInfo({
            usn: user.usn || '',
            name: user.name || ''
          });
        }
      }
      
      const response = await api.get(`/students/attendance/${menteeId}`);
      
      logger.info("Attendance API response:", response.data); // Debug log
      
      const data = response.data.data.attendance;
      if (data && data.semesters) {
        setAttendanceData(data.semesters);
        if (data.semesters.length > 0) {
          // Use student's current semester from profile if available and exists in data
          const defaultSem = studentSemester && data.semesters.find(s => s.semester === studentSemester)
            ? studentSemester
            : data.semesters[0].semester;
          logger.info('[Attendance] Setting semester to:', defaultSem, '(studentSemester:', studentSemester, ', first available:', data.semesters[0].semester, ')');
          setSelectedSemester(defaultSem);
        }
      } else {
        setAttendanceData([]);
      }
      setLoading(false);
    } catch (err) {
      logger.error("Attendance fetch error:", err); // Debug log
      setError("Failed to fetch attendance data");
      setLoading(false);
    }
  }, [semesterLoading, searchParams, user, studentSemester]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // No need for transformBackendData in the old way

    const getCumulativeAttendance = (subjectName, semester) => {
        const semesterData = attendanceData.find(s => s.semester === semester);
        if (!semesterData || !semesterData.months || semesterData.months.length === 0) return "No Data";

        // The latest month contains cumulative attendance, so only use the month with the highest month number
        const latestMonthData = semesterData.months.reduce((latest, current) => 
            (current.month > latest.month) ? current : latest
        , semesterData.months[0]);

        // Find subject ignoring case and whitespace
        const targetName = subjectName.trim().toLowerCase();
        const sub = latestMonthData.subjects.find(s => 
            s.subjectName && s.subjectName.trim().toLowerCase() === targetName
        );

        if (!sub) return "No Data";

        const totalAttended = sub.attendedClasses;
        const totalTaken = sub.totalClasses;

        if (totalTaken === 0) return "No Data";
        const percentage = ((totalAttended / totalTaken) * 100).toFixed(2);
        return `${totalAttended}/${totalTaken} (${percentage}%)`;
    };
    
    const getOverallAttendance = (semester) => {
        const semesterData = attendanceData.find(s => s.semester === semester);
        if (!semesterData || !semesterData.months || semesterData.months.length === 0) return "No Data";
        
        let totalAttended = 0;
        let totalTaken = 0;

        // The latest month contains cumulative attendance, so use the highest month number for the overall average too
        const latestMonthData = semesterData.months.reduce((latest, current) => 
            (current.month > latest.month) ? current : latest
        , semesterData.months[0]);

        latestMonthData.subjects.forEach((subject) => {
            totalAttended += subject.attendedClasses;
            totalTaken += subject.totalClasses;
        });

        if (totalTaken === 0) return "No Data";

        const percentage = ((totalAttended / totalTaken) * 100).toFixed(2);
        return `${totalAttended}/${totalTaken} (${percentage}%)`;
      };

  const getMonthAttendance = (subjectName, semester, month) => {
    if (month === 0) {
      // "All" months: show cumulative for the semester
      return getCumulativeAttendance(subjectName, semester);
    }

    const semesterData = attendanceData.find((s) => s.semester === semester);
    if (!semesterData) return "No Data";

    const monthData = semesterData.months.find((m) => m.month === month);
    if (!monthData) return "No Data";

    const targetName = subjectName.trim().toLowerCase();
    const subject = monthData.subjects.find((s) => 
      s.subjectName && s.subjectName.trim().toLowerCase() === targetName
    );
    if (!subject) return "No Data";

    const { attendedClasses, totalClasses } = subject;
    if (totalClasses === 0) return "No Data";
    const percentage = ((attendedClasses / totalClasses) * 100).toFixed(2);
    return `${attendedClasses}/${totalClasses} (${percentage}%)`;
  };

  const handleSemesterChange = (event) => {
    setSelectedSemester(parseInt(event.target.value, 10)); // Ensure it's a number
    setSelectedMonth(0); // Reset month selection
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(parseInt(event.target.value, 10)); // Ensure it's a number
  };

  const getAvailableMonths = () => {
    if (!selectedSemester) return []; // No semester selected
    const semesterData = attendanceData.find((s) => s.semester === selectedSemester);
    if (!semesterData) return []; // No data for the selected semester
    const months = semesterData.months.map((m) => m.month);
    return [0, ...months]; // Add 0 for "All"
  };

    // Helper function to get unique subjects for the selected semester
    const getSubjectsForSemester = () => {
        if (!selectedSemester) return [];
        const semesterData = attendanceData.find(s => s.semester === selectedSemester);
        if (!semesterData) return [];

        // Get all subjects from all months in the selected semester
        const allSubjects = semesterData.months.flatMap(monthData => monthData.subjects);
        
        // Create a Map to store unique subjects by subjectName 
        const uniqueSubjects = new Map();
        
        // Process all subjects, keeping only the most recent entry for each subject
        allSubjects.forEach(subject => {
            // Standardize the subject name to avoid duplicates due to casing or spaces
            const rawName = subject.subjectName || 'Unknown Subject';
            const key = rawName.trim().toLowerCase();
            
            if (!uniqueSubjects.has(key)) {
                uniqueSubjects.set(key, {
                    subjectName: rawName.trim()
                });
            }
        });

        // Convert Map to array and sort by subjectName
        return Array.from(uniqueSubjects.values())
            .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Typography
        variant={isSmDown ? "h5" : "h4"}
        component="h1"
        gutterBottom
        align="center"
      >
        Attendance Report
      </Typography>
      {studentInfo.usn && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 0.5, sm: 2 }}
          sx={{ mb: 2, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "center" }}
        >
          <Typography variant="body2"><strong>USN:</strong> {studentInfo.usn}</Typography>
          {studentInfo.name && (
            <Typography variant="body2"><strong>Name:</strong> {studentInfo.name}</Typography>
          )}
          {selectedSemester && (
            <Typography variant="body2"><strong>Semester:</strong> {selectedSemester}</Typography>
          )}
        </Stack>
      )}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2, alignItems: { xs: "stretch", sm: "center" }, justifyContent: "center" }}
      >
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
          <InputLabel id="attendance-semester-select-label">Semester</InputLabel>
          <Select
            labelId="attendance-semester-select-label"
            value={selectedSemester ?? ""}
            onChange={handleSemesterChange}
            label="Semester"
            displayEmpty
          >
            {attendanceData.map((sem) => (
              <MenuItem key={sem.semester} value={sem.semester}>
                Semester {sem.semester}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
          <InputLabel id="attendance-month-select-label">Month</InputLabel>
            <Select
              labelId="attendance-month-select-label"
              value={selectedMonth}
              onChange={handleMonthChange}
              label="Month"
            >
              {getAvailableMonths().map((month) => (
                <MenuItem key={month} value={month}>
                  {month === 0 ? "All" : `Month ${month}`}
                </MenuItem>
              ))}
            </Select>
        </FormControl>
      </Stack>

      {loading && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
          Loading attendance data...
        </Typography>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <TableContainer sx={{ border: "1px solid gray", overflowX: "auto" }}>
          <Table sx={{ minWidth: { xs: 720, md: "100%" } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: "1px solid gray" }}>
                Subject Name
              </TableCell>
              <TableCell sx={{ border: "1px solid gray" }}>
                Attendance
              </TableCell>
              <TableCell sx={{ border: "1px solid gray" }}>
                Cumulative Attendance
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getSubjectsForSemester().length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ border: "1px solid gray", py: 3 }}>
                  No attendance data available for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              getSubjectsForSemester().map((subject, index) => (
                <TableRow key={`${subject.subjectName}-${index}`}>
                  <TableCell sx={{ border: "1px solid gray" }}>
                    {subject.subjectName}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid gray" }}>
                    {getMonthAttendance(subject.subjectName, selectedSemester, selectedMonth)}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid gray" }}>
                    {getCumulativeAttendance(subject.subjectName, selectedSemester)}
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow sx={{ fontWeight: "bold" }}>
              <TableCell>Overall Attendance</TableCell>
              <TableCell>
                {getOverallAttendance(selectedSemester)}
                <Box component="span" sx={{ ml: 1 }}>
                  (for selected semester)
                </Box>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default Attendance;
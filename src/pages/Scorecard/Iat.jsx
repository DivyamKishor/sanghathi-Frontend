import { useState, useEffect, useContext, useCallback } from "react";
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
import { useSearchParams } from "react-router-dom";
import useStudentSemester from "../../hooks/useStudentSemester";
import api from "../../utils/axios";
import logger from "../../utils/logger.js";
import DataStateCard from "../../components/DataStateCard";

const Iat = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();
  const menteeId = searchParams.get('menteeId');
  const { semester: studentSemester, loading: semesterLoading } = useStudentSemester();
  
  const [iatData, setIatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noDataMessage, setNoDataMessage] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(null);

  const getSelectedSemesterSubjects = useCallback(() => {
    if (!selectedSemester) return [];

    const semesterData = iatData.find((s) => s.semester === selectedSemester);
    if (!semesterData || !Array.isArray(semesterData.subjects)) return [];

    const subjectsMap = new Map();
    semesterData.subjects.forEach((subject) => {
      subjectsMap.set(subject.subjectCode, subject);
    });

    return Array.from(subjectsMap.values());
  }, [iatData, selectedSemester]);

  const formatAverage = (subject) => {
    if (!subject) return "";

    if (subject.avg !== undefined && subject.avg !== null && subject.avg !== "") {
      return subject.avg;
    }

    const iat1 = Number(subject.iat1);
    const iat2 = Number(subject.iat2);
    const values = [iat1, iat2].filter((value) => Number.isFinite(value));

    if (!values.length) return "";

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const rounded = Math.round(average * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  };

  const fetchIatData = useCallback(async () => {
    // Wait for semester to load before fetching
    if (semesterLoading) {
      return;
    }

    try {
      // Use menteeId from URL params if available, otherwise use logged-in user ID
      const userId = menteeId || user?._id;
      
      if (!userId) {
        setError("User not authenticated or mentee ID not provided.");
        setLoading(false);
        return;
      }
      
      logger.info(`Fetching IAT marks for user ID: ${userId} (${menteeId ? 'menteeId from URL' : 'logged-in user'})`);
      
      //  Adapt the endpoint to your IAT data endpoint
      const response = await api.get(`/students/iat/${userId}`);
      const data = response.data.data.iat; // Adjust based on your API response structure

      if (data && data.semesters) {
        setIatData(data.semesters);
        if (data.semesters.length > 0) {
          // Use student's current semester from profile if available and exists in data
          const defaultSem = studentSemester && data.semesters.find(s => s.semester === studentSemester)
            ? studentSemester
            : data.semesters[0].semester;
          logger.info('[Iat] Setting semester to:', defaultSem, '(studentSemester:', studentSemester, ', first available:', data.semesters[0].semester, ')');
          setSelectedSemester(defaultSem);
        }
      } else {
          setIatData([]);
          setNoDataMessage("No IAT data found for this student yet.");
      }

      setLoading(false);
    } catch (err) {
      if (err?.response?.status === 404) {
        setIatData([]);
        setNoDataMessage("No IAT data found for this student yet.");
        setError("");
      } else {
        setError("Failed to fetch IAT data");
      }
      setLoading(false);
      logger.error(err); // Log the error for debugging
    }
  }, [semesterLoading, menteeId, user?._id, studentSemester]);

  useEffect(() => {
    fetchIatData();
  }, [fetchIatData]);

  const handleSemesterChange = (event) => {
    setSelectedSemester(parseInt(event.target.value, 10));
  };

  const getSubjectsForSemester = () => {
    return getSelectedSemesterSubjects();
  };

  //  Get IAT marks for a specific subject and IAT number
    const getIatMarks = (subjectCode, iatNumber) => {
        const subject = getSelectedSemesterSubjects().find((s) => s.subjectCode === subjectCode);
        if (!subject) return "";

        switch (iatNumber) {
            case 1: return subject.iat1 || "";
            case 2: return subject.iat2 || "";
          case 3: return formatAverage(subject);
            default: return "";
        }
    };



  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Typography variant={isSmDown ? "h5" : "h4"} component="h1" gutterBottom align="center">
        IAT Marks Report
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} sx={{ mb: 2, justifyContent: "center" }}>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
          <InputLabel id="iat-semester-select-label">Semester</InputLabel>
          <Select
            labelId="iat-semester-select-label"
            value={selectedSemester ?? ""}
            onChange={handleSemesterChange}
            label="Semester"
            displayEmpty
          >
            {iatData.map((sem) => (
              <MenuItem key={sem.semester} value={sem.semester}>
                Semester {sem.semester}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
          Loading IAT marks...
        </Typography>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
      <TableContainer sx={{ border: "1px solid gray", overflowX: "auto" }}>
        {noDataMessage && iatData.length === 0 ? (
          <Box sx={{ mb: 2 }}>
            <DataStateCard
              title="IAT marks not found"
              message={noDataMessage}
            />
          </Box>
        ) : null}
        <Table sx={{ minWidth: { xs: 640, md: "100%" } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: "1px solid gray", display: { xs: "none", sm: "table-cell" } }}>
                Subject Code
              </TableCell>
              <TableCell sx={{ border: "1px solid gray" }}>
                Subject Name
              </TableCell>
              <TableCell sx={{ border: "1px solid gray" }}>IAT 1(Out of 50)</TableCell>
              <TableCell sx={{ border: "1px solid gray" }}>IAT 2(Out of 50)</TableCell>
              <TableCell sx={{ border: "1px solid gray" }}>IAT Avg(Out of 50)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getSubjectsForSemester().length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ border: "1px solid gray", py: 3 }}>
                  {noDataMessage || "No IAT data available for the selected semester."}
                </TableCell>
              </TableRow>
            ) : (
            getSubjectsForSemester().map((subject) => (
              <TableRow key={subject.subjectCode}>
                <TableCell sx={{ border: "1px solid gray", display: { xs: "none", sm: "table-cell" } }}>
                  {subject.subjectCode}
                </TableCell>
                <TableCell sx={{ border: "1px solid gray" }}>
                  {subject.subjectName}
                </TableCell>
                <TableCell sx={{ border: "1px solid gray" }}>
                    {getIatMarks(subject.subjectCode, 1)}
                </TableCell>
                <TableCell sx={{ border: "1px solid gray" }}>
                    {getIatMarks(subject.subjectCode, 2)}
                </TableCell>
                <TableCell sx={{ border: "1px solid gray" }}>
                    {getIatMarks(subject.subjectCode, 3)}
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}
    </Container>
  );
};

export default Iat;
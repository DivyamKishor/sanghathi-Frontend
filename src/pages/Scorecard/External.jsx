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
import api from "../../utils/axios";
import logger from "../../utils/logger.js";
import DataStateCard from "../../components/DataStateCard";

const External = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();
  const menteeId = searchParams.get('menteeId');
  
  const [externalData, setExternalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noDataMessage, setNoDataMessage] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(null);
  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const fetchExternalData = useCallback(async () => {
    // Use menteeId from URL params if available, otherwise use logged-in user ID
    const userId = menteeId || user?._id;
    
    if (!userId) {
      setError("User not authenticated or mentee ID not provided.");
      setLoading(false);
      return;
    }

    try {
      logger.info(`Fetching external marks for user ID: ${userId} (${menteeId ? 'menteeId from URL' : 'logged-in user'})`);
      
      const response = await api.get(`/students/external/${userId}`);
      
      logger.info("Response data:", response.data);
      
      if (response.data && response.data.data && response.data.data.external) {
        const data = response.data.data.external;
        if (data.semesters && data.semesters.length > 0) {
          setExternalData(data.semesters);
          setSelectedSemester(data.semesters[0].semester);
          setNoDataMessage("");
        } else {
          setExternalData([data]);
          setSelectedSemester(1); // Default to first semester
          setNoDataMessage("");
        }
      } else {
        setExternalData([]);
        setSelectedSemester(1); // Default to first semester
        setNoDataMessage("No external marks data found for this student yet.");
      }

      setLoading(false);
    } catch (err) {
      logger.error("Error fetching external marks:", err);
      
      if (err?.response?.status === 404) {
        setExternalData([]);
        setNoDataMessage("No external marks data found for this student yet.");
      } else {
        setError("Failed to fetch external marks data");
        setExternalData([]);
      }
      setSelectedSemester(1); // Default to first semester
      setLoading(false);
    }
  }, [user?._id, menteeId]);

  useEffect(() => {
    fetchExternalData();
  }, [fetchExternalData]);

  const handleSemesterChange = (event) => {
    setSelectedSemester(parseInt(event.target.value, 10));
  };

  const getSubjectsForSemester = () => {
    if (!selectedSemester) return [];
    const semesterData = externalData.find((s) => s.semester === selectedSemester);
    if (!semesterData) return [];

    const subjectsMap = new Map();
    semesterData.subjects.forEach((subject) => {
      subjectsMap.set(subject.subjectCode, subject);
    });
    return Array.from(subjectsMap.values());
  };

  // Get the CGPA for the current semester
  const getSemesterCGPA = () => {
    if (!selectedSemester) return null;
    const semesterData = externalData.find((s) => s.semester === selectedSemester);
    if (!semesterData || !semesterData.subjects || semesterData.subjects.length === 0) return null;
    
    // Get CGPA from the first subject that has it (assuming all subjects in a semester have the same CGPA)
    const subjectWithCGPA = semesterData.subjects.find(subject => subject.cgpa);
    return subjectWithCGPA ? subjectWithCGPA.cgpa : null;
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Typography variant={isSmDown ? "h5" : "h4"} component="h1" gutterBottom align="center">
        External Marks Report
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} sx={{ mb: 2, justifyContent: "center" }}>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
          <InputLabel id="external-semester-select-label">Semester</InputLabel>
          <Select
            labelId="external-semester-select-label"
            value={selectedSemester || ""}
            onChange={handleSemesterChange}
            label="Semester"
            displayEmpty
          >
            {availableSemesters.map((sem) => (
              <MenuItem key={sem} value={sem}>
                Semester {sem}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
          Loading external marks...
        </Typography>
      )}

      {!loading && error && (
      <TableContainer sx={{ border: "1px solid gray", overflowX: "auto" }}>
        {noDataMessage && externalData.length === 0 ? (
          <Box sx={{ mb: 2 }}>
            <DataStateCard
              title="External marks not found"
              message={noDataMessage}
            />
          </Box>
        ) : null}
          {error}
        </Alert>
      )}

      {!loading && (
      <TableContainer sx={{ border: "1px solid gray", overflowX: "auto" }}>
        <Table sx={{ minWidth: { xs: 920, md: "100%" } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: "1px solid gray", fontWeight: "bold" }}>
                Subject Code
              </TableCell>
              <TableCell sx={{ border: "1px solid gray", fontWeight: "bold" }}>
                Subject Name
              </TableCell>
              <TableCell sx={{ border: "1px solid gray", fontWeight: "bold" }}>
                Internal Marks
              </TableCell>
              <TableCell sx={{ border: "1px solid gray", fontWeight: "bold" }}>
                External Marks
              </TableCell>
              <TableCell sx={{ border: "1px solid gray", fontWeight: "bold" }}>
                Total
              </TableCell>
              <TableCell sx={{ border: "1px solid gray", fontWeight: "bold", display: { xs: "none", sm: "table-cell" } }}>
                Attempt
              </TableCell>
              <TableCell sx={{ border: "1px solid gray", fontWeight: "bold", display: { xs: "none", md: "table-cell" } }}>
                Result
              </TableCell>
              <TableCell sx={{ border: "1px solid gray", fontWeight: "bold", display: { xs: "none", md: "table-cell" } }}>
                Completion Date
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getSubjectsForSemester().length > 0 ? (
              getSubjectsForSemester().map((subject) => (
                <TableRow key={subject.subjectCode}>
                  <TableCell sx={{ border: "1px solid gray" }}>
                    {subject.subjectCode}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid gray" }}>
                    {subject.subjectName}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid gray" }}>
                    {subject.internalMarks ?? "-"}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid gray" }}>
                    {subject.externalMarks ?? "-"}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid gray" }}>
                    {subject.total ?? "-"}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid gray", display: { xs: "none", sm: "table-cell" } }}>
                    {subject.attempt || "1"}
                  </TableCell>
                  <TableCell sx={{ 
                    border: "1px solid gray",
                    color: subject.result === "PASS" ? "success.main" : "error.main",
                    fontWeight: "bold",
                    display: { xs: "none", md: "table-cell" }
                  }}>
                    {subject.result || "-"}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid gray", display: { xs: "none", md: "table-cell" } }}>
                    {externalData.find(s => s.semester === selectedSemester)?.passingDate || "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  No external marks data available for this semester.
                </TableCell>
              </TableRow>
            )}
            
            {/* CGPA Row - only show if there's data and a CGPA value */}
            {getSubjectsForSemester().length > 0 && (
              <TableRow>
                <TableCell 
                  colSpan={8}
                  align="center"
                  sx={{
                    border: "1px solid gray",
                    fontWeight: "bold",
                    bgcolor: "action.hover"
                  }}
                >
                  SGPA: {
                    (() => {
                      const semesterObj = externalData.find(s => s.semester === selectedSemester);
                      return semesterObj?.sgpa ?? "-";
                    })()
                  }
                </TableCell>
              </TableRow>
            )}

          </TableBody>
        </Table>
      </TableContainer>
      )}
    </Container>
  );
};

export default External;
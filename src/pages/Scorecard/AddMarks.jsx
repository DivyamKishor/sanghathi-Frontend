import { useState, useContext, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Container,
  Stack,
  Divider,
} from "@mui/material";
import api from "../../utils/axios";
import { AuthContext } from "../../context/AuthContext";
import Papa from "papaparse";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { alpha, useTheme } from "@mui/material/styles";
import useDraftPersistence from "../../hooks/useDraftPersistence";
import { resolveDraftScopeId } from "../../utils/draftScope";
import { recordAdminUploadSession } from "../../utils/uploadHistory";
import logger from "../../utils/logger.js";

const AddMarks = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);

  const draftScopeId = useMemo(() => resolveDraftScopeId(), []);

  const restoreDraftState = useCallback((draftData = {}) => {
    setError(typeof draftData.error === "string" ? draftData.error : "");
    setSuccess(typeof draftData.success === "string" ? draftData.success : "");
  }, []);

  useDraftPersistence({
    formType: "external-marks-upload",
    scopeId: draftScopeId,
    values: {
      error,
      success,
      hasSelectedFile: Boolean(file),
      isLoading: loading,
    },
    reset: restoreDraftState,
    enableServerSync: false,
  });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const downloadTemplate = () => {
    const headers = [
      "Semester",
      "USN",

      "Result1", "Result2", "Result3", "Result4", "Result5", "Result6", "Result7", "Result8", "Result9",
      "Passing_Date",
      "SGPA",
    ];

    const row1 = [

    ];

    const csvContent = [
      headers.join(","),
      row1.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "vtu_marks_template.csv";

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };


  const processCSV = (csvData) => {
    const studentGroups = new Map();

    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];
      if (!row || row.length < 5) continue;

      const semester = parseInt(row[0]);
      const usn = row[1]?.trim();

      if (!semester || !usn) continue;

      if (!studentGroups.has(usn)) {
        studentGroups.set(usn, new Map());
      }

      const semesterGroups = studentGroups.get(usn);
      if (!semesterGroups.has(semester)) {
        semesterGroups.set(semester, []);
      }

      // Flexible parser: handle both older 6-col-per-subject and new VTU 7-col-per-subject templates.
      // We iterate across subject columns until we reach the trailing metadata (passingDate, cgpa).
      let idx = 2; // start after Semester, USN
      const subjects = [];
      // assume last two columns are passingDate and cgpa when present
      const trailing = 2;
      while (idx + 3 < row.length - trailing) {
        const subjectCode = row[idx]?.toString().trim();
        const subjectName = row[idx + 1]?.toString().trim();
        if (!subjectCode || !subjectName) break;

        const internalMarks = parseInt(row[idx + 2]);
        const externalMarks = parseInt(row[idx + 3]);

        // Heuristic: check if next column is Total (internal+external) or Attempt
        const possibleTotal = row[idx + 4];
        let attempt;
        let result;
        let consumed = 6; // default for old format (code,name,int,ext,attempt,result)

        if (possibleTotal !== undefined && possibleTotal !== null) {
          const asNum = parseInt(possibleTotal);
          if (!isNaN(asNum) && asNum === ((isNaN(internalMarks) ? 0 : internalMarks) + (isNaN(externalMarks) ? 0 : externalMarks))) {
            // This is the Total column (new VTU template). Consume total, then attempt, then result
            attempt = parseInt(row[idx + 5]);
            result = row[idx + 6]?.toUpperCase();
            consumed = 7; // code,name,int,ext,total,attempt,result
          } else {
            // Not a total column — treat as attempt
            attempt = parseInt(possibleTotal);
            result = row[idx + 5]?.toUpperCase();
            consumed = 6; // code,name,int,ext,attempt,result
          }
        } else {
          // Fallback: try to read attempt/result positions
          attempt = parseInt(row[idx + 4]);
          result = row[idx + 5]?.toUpperCase();
          consumed = 6;
        }

        subjects.push({
          subjectCode,
          subjectName,
          internalMarks: isNaN(internalMarks) ? 0 : internalMarks,
          externalMarks: isNaN(externalMarks) ? 0 : externalMarks,
          attempt: isNaN(attempt) ? 1 : attempt,
          result: result === "PASS" || result === "FAIL" ? result : "FAIL",
        });

        idx += consumed;
      }

      // attach parsed subjects to semester group
      semesterGroups.get(semester).push(...subjects);

      // Optional global fields (assume last two columns when present)
      const passingDate = row[row.length - 2];
      const cgpa = parseFloat(row[row.length - 1]);

      const semesterSubjects = semesterGroups.get(semester);
      if (semesterSubjects.length > 0) {
        semesterSubjects[0].passingDate = passingDate || null;
        semesterSubjects[0].cgpa = isNaN(cgpa) ? null : cgpa;
      }
    }

    return studentGroups;
  };

  // Function to look up a student's userId by their USN
  const fetchUserIdByUSN = async (usn) => {
    try {
      // Call the API to get user ID from USN
      const response = await api.get(`/users/usn/${usn}`);

      if (response.data && response.data.userId) {
        return response.data.userId;
      } else {
        logger.error(`No userId found for USN: ${usn}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error looking up userId for USN ${usn}:`, error.response?.data || error.message);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!file) {
      setError("Please select a CSV file");
      setLoading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          const parsedData = Papa.parse(csvText).data;
          const studentGroups = processCSV(parsedData);

          // Create an array to track results for each student
          const results = [];
          const affectedUserIds = new Set();

          // Process each student
          for (const [usn, semesterGroups] of studentGroups) {
            try {
              // First look up student ID by USN
              logger.info(`Looking up student with USN: ${usn}`);

              let studentId = null;
              try {
                logger.info(`Making API call to fetch user ID for USN: ${usn}`);
                studentId = await fetchUserIdByUSN(usn);
                logger.info(`Result of user lookup for USN ${usn}:`, studentId ? `Found: ${studentId}` : "Not found");
              } catch (lookupError) {
                logger.error(`Error looking up student with USN ${usn}:`, lookupError);
              }

              // If lookup failed, fall back to admin ID
              if (!studentId) {
                logger.warn(`Could not find userId for USN ${usn}, falling back to admin ID: ${user?._id}`);
                throw new Error(`Student not found for USN: ${usn}`);
              }

              affectedUserIds.add(String(studentId));

              // Submit data for each semester
              for (const [semester, subjects] of semesterGroups) {
                logger.info(`Submitting semester ${semester} data for USN ${usn}:`, subjects);

                // Make sure we're sending all fields properly
                const formattedSubjects = subjects.map(subject => ({
                  subjectCode: subject.subjectCode,
                  subjectName: subject.subjectName,
                  internalMarks: subject.internalMarks ?? 0,
                  externalMarks: subject.externalMarks,
                  total: subject.externalMarks + (subject.internalMarks || 0),
                  attempt: subject.attempt || 1,
                  result: subject.result || "FAIL"
                }));

                await api.post(
                  `/students/external/${studentId}`,
                  {
                    semester,
                    subjects: formattedSubjects,
                    passingDate: subjects[0]?.passingDate || null,
                    sgpa: subjects[0]?.cgpa || null
                  }
                );
              }

              // Add success result for this student
              results.push({ usn, status: 'success' });
            } catch (error) {
              // Add failure result for this student
              results.push({
                usn,
                status: 'error',
                message: error.response?.data?.message || error.message
              });
              logger.error(`Error processing student ${usn}:`, error);
            }
          }

          // Show summary results
          const successCount = results.filter(r => r.status === 'success').length;
          const totalCount = results.length;

          if (successCount === totalCount) {
            setSuccess(`All ${totalCount} students processed successfully!`);
          } else {
            setSuccess(`Processed ${successCount} out of ${totalCount} students successfully.`);
            setError(`Failed to process ${totalCount - successCount} students. See console for details.`);
          }

          await recordAdminUploadSession({
            tabType: "add-external-marks",
            fileName: file?.name || "",
            totalRows: totalCount,
            successCount,
            errorCount: totalCount - successCount,
            errors: results
              .filter((entry) => entry.status === "error")
              .map((entry) => `${entry.usn}: ${entry.message || "Unknown error"}`),
            affectedUserIds: Array.from(affectedUserIds),
          });

          setFile(null);
          // Reset file input
          const fileInput = document.getElementById("csv-file-input");
          if (fileInput) fileInput.value = "";
        } catch (err) {
          setError("Error processing CSV file: " + (err.message || "Unknown error"));
          logger.error("CSV processing error:", err);
        }
        setLoading(false);
      };

      reader.onerror = () => {
        setError("Error reading file");
        setLoading(false);
      };

      reader.readAsText(file);
    } catch (err) {
      setError("Error uploading marks: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 4 },
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
        <Box
          sx={{
            textAlign: 'center',
            mb: 4
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{
              fontWeight: 'bold',
              background: isLight
                ? `-webkit-linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                : `-webkit-linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Upload External Marks
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            Upload a CSV file with student external marks data
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 2,
            }}
          >
            {success}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            borderRadius: 2,
            backgroundColor: isLight
              ? alpha(theme.palette.primary.main, 0.04)
              : alpha(theme.palette.info.main, 0.08),
            p: 3,
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ mb: 2 }}
          >
            CSV Format Instructions
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              mb: 3,
              pl: 2,
              borderLeft: `4px solid ${isLight ? theme.palette.primary.main : theme.palette.info.main}`,
              py: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">• Column 1: Semester Number</Typography>
            <Typography variant="body2" color="text.secondary">• Column 2: USN</Typography>
            <Typography variant="body2" color="text.secondary">• Column 3: Subject Code</Typography>
            <Typography variant="body2" color="text.secondary">• Column 4: Subject Name</Typography>
            <Typography variant="body2" color="text.secondary">• Column 5: External Marks</Typography>
            <Typography variant="body2" color="text.secondary">• Column 6: Attempt Number (1-4)</Typography>
            <Typography variant="body2" color="text.secondary">• Column 7: Passing Date (YYYY-MM-DD)</Typography>
            <Typography variant="body2" color="text.secondary">• Column 8: CGPA</Typography>
            <Typography variant="body2" color="text.secondary">• Column 9: Result (PASS/FAIL)</Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={downloadTemplate}
              startIcon={<FileDownloadIcon />}
              sx={{
                borderRadius: '8px',
                py: 1.2,
                px: 3,
                borderColor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                color: isLight ? theme.palette.primary.main : theme.palette.info.main,
                '&:hover': {
                  borderColor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                  backgroundColor: isLight
                    ? alpha(theme.palette.primary.main, 0.04)
                    : alpha(theme.palette.info.main, 0.08),
                }
              }}
            >
              Download Template
            </Button>

            <Box
              sx={{
                position: 'relative',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="csv-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadFileIcon />}
                  sx={{
                    borderRadius: '8px',
                    py: 1.2,
                    px: 3,
                    width: { xs: '100%', sm: 'auto' },
                    borderColor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                    color: isLight ? theme.palette.primary.main : theme.palette.info.main,
                    '&:hover': {
                      borderColor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                      backgroundColor: isLight
                        ? alpha(theme.palette.primary.main, 0.04)
                        : alpha(theme.palette.info.main, 0.08),
                    }
                  }}
                >
                  {file ? file.name : "Choose File"}
                </Button>
              </label>
            </Box>

            <Button
              variant="contained"
              type="submit"
              disabled={loading || !file}
              startIcon={loading ? null : <CloudUploadIcon />}
              sx={{
                position: "relative",
                borderRadius: '8px',
                py: 1.2,
                px: 3,
                width: { xs: '100%', sm: 'auto' },
                bgcolor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                '&:hover': {
                  bgcolor: isLight
                    ? theme.palette.primary.dark
                    : theme.palette.info.dark,
                },
                '&.Mui-disabled': {
                  backgroundColor: isLight
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha(theme.palette.info.main, 0.3),
                }
              }}
            >
              {loading ? (
                <>
                  <CircularProgress
                    size={24}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginTop: "-12px",
                      marginLeft: "-12px",
                      color: 'white',
                    }}
                  />
                  Uploading...
                </>
              ) : (
                "Upload Marks"
              )}
            </Button>
          </Stack>
        </Box>

        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: isLight
              ? alpha(theme.palette.warning.main, 0.05)
              : alpha(theme.palette.warning.dark, 0.05),
            border: `1px dashed ${alpha(theme.palette.warning.main, 0.2)}`,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <HelpOutlineIcon
            fontSize="small"
            color="warning"
            sx={{ flexShrink: 0 }}
          />
          <Typography variant="body2" color="text.secondary">
            <strong>Sample format:</strong> Each row should include semester number, USN, subject details, marks, and results.
            Make sure the USN matches a student in the system.
          </Typography>
        </Paper>
      </Paper>
    </Container>
  );
};

export default AddMarks; 

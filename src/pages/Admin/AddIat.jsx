import { useCallback, useMemo, useState } from "react";
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  Container,
  Paper,
  Stack,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton
} from "@mui/material";
import { 
  FileDownload as FileDownloadIcon,
  CloudUpload as CloudUploadIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';
import { alpha, useTheme } from "@mui/material/styles";
import ClearIcon from "@mui/icons-material/Clear";
import Papa from "papaparse";
import api from "../../utils/axios";
import useDraftPersistence from "../../hooks/useDraftPersistence";
import { resolveDraftScopeId } from "../../utils/draftScope";
import { recordAdminUploadSession } from "../../utils/uploadHistory";

const AddIat = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [processing, setProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [file, setFile] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [tempRows, setTempRows] = useState([]);

  const normalizeHeader = (header = "") =>
    header.toString().toLowerCase().replace(/[^a-z0-9]/g, "");

  const parseScore = (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const formatAverage = (value) => {
    if (!Number.isFinite(value)) return undefined;
    const rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? rounded : Number(rounded.toFixed(2));
  };

  const getColumnIndex = (header) => {
    const suffixMatch = header.match(/_(\d+)$/);
    if (suffixMatch) return suffixMatch[1];

    const normalized = normalizeHeader(header);
    const indexedHeaderPatterns = [
      /^(subjectcode|coursecode|subcode)(\d+)$/,
      /^(subjectname|coursename)(\d+)$/,
      /^(iat1|iat2|avg|average)(\d+)$/,
    ];

    for (const pattern of indexedHeaderPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        return match[2];
      }
    }

    return "1";
  };

  const extractSubjectsFromRow = (row) => {
    const subjectBuckets = {};

    for (const [column, rawValue] of Object.entries(row)) {
      if (rawValue === undefined || rawValue === null || rawValue === "") continue;

      const normalized = normalizeHeader(column);
      const bucketIndex = getColumnIndex(column);
      if (!subjectBuckets[bucketIndex]) {
        subjectBuckets[bucketIndex] = {};
      }

      if (normalized.includes("subjectcode") || normalized.includes("coursecode") || normalized.includes("subcode")) {
        subjectBuckets[bucketIndex].subjectCode = String(rawValue).trim();
      } else if (normalized.includes("subjectname") || normalized.includes("coursename")) {
        subjectBuckets[bucketIndex].subjectName = String(rawValue).trim();
      } else if (normalized.includes("iat1")) {
        subjectBuckets[bucketIndex].iat1 = parseScore(rawValue);
      } else if (normalized.includes("iat2")) {
        subjectBuckets[bucketIndex].iat2 = parseScore(rawValue);
      } else if (normalized.startsWith("avg") || normalized.includes("average")) {
        subjectBuckets[bucketIndex].avg = parseScore(rawValue);
      }
    }

    return Object.values(subjectBuckets)
      .filter((subject) => subject.subjectCode && subject.subjectName)
      .map((subject) => {
        const iat1 = parseScore(subject.iat1);
        const iat2 = parseScore(subject.iat2);

        if (subject.avg === undefined) {
          const values = [iat1, iat2].filter((value) => Number.isFinite(value));
          if (values.length > 0) {
            subject.avg = formatAverage(values.reduce((sum, value) => sum + value, 0) / values.length);
          }
        }

        return subject;
      });
  };

  const getFieldValueFromRow = (row, aliases = []) => {
    const normalizedAliases = aliases.map((alias) => normalizeHeader(alias));

    for (const [column, rawValue] of Object.entries(row)) {
      if (rawValue === undefined || rawValue === null || rawValue === "") continue;

      const normalizedColumn = normalizeHeader(column);
      const matched = normalizedAliases.some((alias) => {
        const matcher = new RegExp(`^${alias}(\\d+)?$`);
        return matcher.test(normalizedColumn);
      });

      if (matched) {
        return typeof rawValue === "string" ? rawValue.trim() : rawValue;
      }
    }

    return undefined;
  };

  const downloadTemplate = () => {
    const headers = [
      "USN",
      "Sem",
      "SubjectCode", 
      "SubjectName",
      "IAT1",
      "IAT2",
      "Avg"
    ];
    const exampleRow = ["USN123", "1", "CS101", "Introduction to Programming", "50", "50","50" ];
    const csvContent = Papa.unparse([headers, exampleRow], { quotes: true });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "iat_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      let rows = [];
      if (file.type === "application/json") {
        try {
          rows = JSON.parse(content);
        } catch (error) {
          logger.error("JSON parse error:", error);
          return;
        }
      } else {
        const headerTracker = {};
        const results = Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          transform: (value) => (value === "" ? undefined : value),
          transformHeader: (header) => {
            const trimmed = header.trim();
            const count = headerTracker[trimmed] || 0;
            headerTracker[trimmed] = count + 1;
            return count === 0 ? trimmed : `${trimmed}_${count + 1}`;
          },
        });
        rows = results.data;
      }
      
      if (rows.length === 0) {
        return;
      }

      setTempRows(rows);
      setOpenConfirm(true);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleConfirmUpload = async () => {
    setOpenConfirm(false);
    setProcessing(true);
    setErrors([]);
    setSuccessCount(0);
    setErrorCount(0);
    await processRows(tempRows);
  };

  const handleClearResults = () => {
    setSuccessCount(0);
    setErrorCount(0);
    setErrors([]);
    setFile(null);
  };

  const processRows = async (rows) => {
    let success = 0;
    let errors = 0;
    const newErrors = [];
    const affectedUserIds = new Set();
    const uploadEntries = [];

    // Group rows by USN and Semester
    const groupedData = {};
    for (const row of rows) {
      const usn = getFieldValueFromRow(row, ["USN"]);
      const semValue = getFieldValueFromRow(row, ["Sem", "Semester"]);
      const semester = semValue !== undefined ? parseInt(semValue, 10) : undefined;
      const rowSubjects = extractSubjectsFromRow(row);

      if (!usn || !semester || Number.isNaN(semester) || rowSubjects.length === 0) {
        newErrors.push(`Row with missing USN, Sem, or valid subject data: ${JSON.stringify(row)}`);
        errors++;
        continue; // Skip to the next row
      }

      const key = `${usn}-${semester}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          usn,
          semester,
          subjects: [],
        };
      }
      groupedData[key].subjects.push(...rowSubjects);
    }

    // Process each group (USN and Semester combination)
    for (const key in groupedData) {
      const data = groupedData[key];
      try {
        // Get userId by USN (as before)
        const response = await api.get(`/users/usn/${data.usn}`);
        if (!response.data?.userId) {
          throw new Error(`User with USN ${data.usn} not found`);
        }
        const userId = response.data.userId;

        // Prepare the data for the IAT API
        const iatData = {
          semester: data.semester,
          subjects: data.subjects,
        };

        // Submit IAT data
        await api.post(`/students/iat/${userId}`, iatData);
        success++;
        affectedUserIds.add(String(userId));
        uploadEntries.push({
          uploadIndex: uploadEntries.length + 1,
          userId: String(userId),
          usn: data.usn,
          semester: data.semester,
        });
      } catch (error) {
        errors++;
        newErrors.push(`Error for USN ${data.usn}, Semester ${data.semester}: ${error.message}`);
      }
    }

    await recordAdminUploadSession({
      tabType: "add-iat-marks",
      fileName: file?.name || "",
      totalRows: rows.length,
      successCount: success,
      errorCount: errors,
      errors: newErrors,
      affectedUserIds: Array.from(affectedUserIds),
      metadata: {
        entries: uploadEntries,
      },
    });

    setSuccessCount(success);
    setErrorCount(errors);
    setErrors(newErrors);
    setProcessing(false);
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
          mb: 4
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
            Upload IAT Marks
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            Upload a row-wise CSV/JSON file with Internal Assessment Test marks for students.
          </Typography>
        </Box>

        <Box
          sx={{
            backgroundColor: isLight 
              ? alpha(theme.palette.primary.main, 0.04)
              : alpha(theme.palette.info.main, 0.08),
            p: 3,
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Upload Instructions
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please ensure each row represents one subject for one student and includes these columns:
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
            <Typography variant="body2" color="text.secondary">• USN - Student USN</Typography>
            <Typography variant="body2" color="text.secondary">• Sem - Semester number</Typography>
            <Typography variant="body2" color="text.secondary">• SubjectCode - Course code</Typography>
            <Typography variant="body2" color="text.secondary">• SubjectName - Course name</Typography>
            <Typography variant="body2" color="text.secondary">• IAT1 - First IAT marks</Typography>
            <Typography variant="body2" color="text.secondary">• IAT2 - Second IAT marks</Typography>
            <Typography variant="body2" color="text.secondary">• Avg - Optional average field</Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Accepted mark values: numeric marks and AB/NE/ABSENT. If your file has repeated subject blocks in one row (wide-format sheet), use local script ingest.
          </Alert>

          <Divider sx={{ my: 3 }} />

          <Stack 
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Button 
              variant="outlined" 
              onClick={downloadTemplate}
              startIcon={<FileDownloadIcon />}
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
              Download Template
            </Button>
            
            <Box
              sx={{
                position: 'relative',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              <input
                accept=".csv,.json"
                style={{ display: 'none' }}
                id="upload-file"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="upload-file">
                <Button 
                  variant="contained" 
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={processing}
                  sx={{
                    borderRadius: '8px',
                    py: 1.2,
                    px: 3,
                    width: { xs: '100%', sm: 'auto' },
                    position: 'relative',
                    bgcolor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                    '&:hover': {
                      bgcolor: isLight 
                        ? theme.palette.primary.dark
                        : theme.palette.info.dark,
                    }
                  }}
                >
                  {processing ? (
                    <>
                      <CircularProgress
                        size={24}
                        thickness={4}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: '-12px',
                          marginLeft: '-12px',
                          color: 'white',
                        }}
                      />
                      Processing...
                    </>
                  ) : (
                    `${file ? 'File Selected' : 'Upload File'}`
                  )}
                </Button>
              </label>
            </Box>
          </Stack>
        </Box>

        {!processing && (successCount > 0 || errorCount > 0) && (
          <Box sx={{ mt: 3 }}>
            {successCount > 0 && (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                }}
              >
                Successfully processed: {successCount} student record(s)
              </Alert>
            )}
            
            {errorCount > 0 && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                }}
              >
                Errors encountered: {errorCount} record(s)
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                size="small" 
                onClick={handleClearResults}
                startIcon={<ClearIcon />}
                color="inherit"
                sx={{ opacity: 0.7 }}
              >
                Clear Results
              </Button>
            </Box>
            
            {errors.length > 0 && (
              <Box 
                sx={{ 
                  mt: 2,
                  backgroundColor: isLight 
                    ? alpha(theme.palette.error.main, 0.05)
                    : alpha(theme.palette.error.dark, 0.1),
                  borderRadius: 2,
                  p: 2,
                  maxHeight: 200,
                  overflowY: "auto",
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Error Details:</Typography>
                <List dense>
                  {errors.map((error, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={error}
                        primaryTypographyProps={{ 
                          variant: 'body2', 
                          color: 'error.main' 
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        <Paper 
          elevation={1} 
          sx={{ 
            p: 2,
            mt: 4,
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
            <strong>Note:</strong> Make sure each USN corresponds to a registered student in the system. 
            Missing or invalid USNs will result in errors.
          </Typography>
        </Paper>
      </Paper>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        PaperProps={{
          sx: { borderRadius: 2, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Upload</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have selected <strong>{file?.name}</strong> with <strong>{tempRows.length}</strong> records. 
            Are you sure you want to proceed with the bulk upload for <strong>IAT Marks</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenConfirm(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmUpload} 
            variant="contained" 
            autoFocus
            sx={{ bgcolor: isLight ? theme.palette.primary.main : theme.palette.info.main }}
          >
            Start Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddIat;
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
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import ClearIcon from "@mui/icons-material/Clear";
import Papa from "papaparse";
import api from "../../utils/axios";
import useDraftPersistence from "../../hooks/useDraftPersistence";
import { resolveDraftScopeId } from "../../utils/draftScope";
import { recordAdminUploadSession } from "../../utils/uploadHistory";

const AddTylMarks = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  const [processing, setProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [file, setFile] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [tempRows, setTempRows] = useState([]);

  const draftScopeId = useMemo(() => resolveDraftScopeId(), []);

  const restoreDraftState = useCallback((draftData = {}) => {
    setSuccessCount(Number(draftData.successCount) || 0);
    setErrorCount(Number(draftData.errorCount) || 0);
    setErrors(Array.isArray(draftData.errors) ? draftData.errors : []);
  }, []);

  const persistedErrors = useMemo(() => errors.slice(0, 200), [errors]);

  useDraftPersistence({
    formType: "admin-tyl-upload",
    scopeId: draftScopeId,
    values: {
      successCount,
      errorCount,
      errors: persistedErrors,
      hasSelectedFile: Boolean(file),
      isProcessing: processing,
    },
    reset: restoreDraftState,
    enableServerSync: false,
  });

  // ================= TEMPLATE DOWNLOAD =================
  const downloadTemplate = () => {
    const headers = [
      "SlNo", "Email", "FullName", "USN", "Phone", "Branch",

      "L1", "L2", "L3", "L4",
      "A1", "A2", "A3", "A4",
      "S1", "S2", "S3", "S4",

      "C2_Odd", "C2_Full", "C3_Odd", "C3_Full",
      "C4_Odd", "C4_Full", "C5_Full",

      "P1_C", "P2_Python", "P3_Python", "P3_Java",
      "P4_Programming_Part1", "P4_Programming_Part2",
      "P4_MAD_FSD", "P4_DS", "P2Plus_Python"
    ];

    const TotalMarks = [
      "", "", "", "", "", "Total Marks: ",   // for SNo, Email, FullName, etc.

      100, 100, 100, 100,
      100, 100, 100, 100,
      100, 100, 100, 100,

      25, 25, 50, 100, 100, 100, 100,

      100, 100, 100, 100, 100, 100, 100, 100, 100
    ];
    const passingRow = [
      "", "", "", "", "", "Passing Criteria",   // for SNo, Email, FullName, etc.

      65, 65, 70, 70,   // L1, L2, L3, L4
      50, 50, 50, 65,   // A1, A2, A3, A4
      50, 50, 50, 50,   // S1, S2, S3, S4

      10, 10, 50, 50,   // C2, C3 etc (example)
      50, 50, 50,

      50, 50, 60, 60,   // P1, P2 etc
      100, 100, 0, 0
    ];
    const exampleRow = [
      1, "student@cmrit.ac.in", "AAMITH PRAMOD", "1CR23IS001", "9148164893", "ISE",

    ];
    const csv = Papa.unparse([headers, TotalMarks, passingRow, exampleRow], { quotes: true });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "tyl_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ================= LEVEL CALCULATION =================
  const calculateLevel = (marksObj, passingCriteria) => {
    let passed = 0;
    const total = Object.keys(passingCriteria).length;

    for (const key in passingCriteria) {
      const mark = parseInt(marksObj[key] || 0, 10);
      if (mark >= passingCriteria[key]) passed++;
    }

    if (passed === total) return 2;
    if (passed > 0) return 1;
    return 0;
  };

  // ================= FILE UPLOAD =================
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const results = Papa.parse(content, {
        header: true,
        skipEmptyLines: true
      });
      
      if (results.data.length === 0) {
        return;
      }
      
      setTempRows(results.data);
      setOpenConfirm(true);
    };
    reader.readAsText(uploadedFile);
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

  // ================= PROCESS ROWS =================
  const processRows = async (rows) => {
    let success = 0;
    let errCount = 0;
    const newErrors = [];
    const affectedUserIds = new Set();

    for (const row of rows) {

      const branch = (row.Branch || "").toLowerCase().trim();

      if (
        !row.USN ||
        branch.includes("total") ||
        branch.includes("passing")
      ) continue;

      try {
        if (!row.USN) throw new Error("USN missing");

        // MARK GROUPS
        const language = { L1: row.L1, L2: row.L2, L3: row.L3, L4: row.L4 };
        const aptitude = { A1: row.A1, A2: row.A2, A3: row.A3, A4: row.A4 };
        const softskill = { S1: row.S1, S2: row.S2, S3: row.S3, S4: row.S4 };
        const core = {
          C2_Odd: row.C2_Odd, C2_Full: row.C2_Full,
          C3_Odd: row.C3_Odd, C3_Full: row.C3_Full,
          C4_Odd: row.C4_Odd, C4_Full: row.C4_Full,
          C5_Full: row.C5_Full
        };
        const programming = {
          P1_C: row.P1_C,
          P2_Python: row.P2_Python,
          P3_Python: row.P3_Python,
          P3_Java: row.P3_Java,
          P4_Programming_Part1: row.P4_Programming_Part1,
          P4_Programming_Part2: row.P4_Programming_Part2,
          P4_MAD_FSD: row.P4_MAD_FSD,
          P4_DS: row.P4_DS,
          P2Plus_Python: row.P2Plus_Python
        };

        // PASS CRITERIA
        const languagePass = { L1: 65, L2: 65, L3: 70, L4: 70 };
        const aptitudePass = { A1: 50, A2: 50, A3: 50, A4: 65 };
        const softPass = { S1: 50, S2: 50, S3: 50, S4: 50 };
        const corePass = {
          C2_Odd: 10, C2_Full: 10,
          C3_Odd: 25, C3_Full: 50,
          C4_Odd: 50, C4_Full: 50,
          C5_Full: 50
        };
        const progPass = {
          P1_C: 50, P2_Python: 50,
          P3_Python: 60, P3_Java: 60,
          P4_Programming_Part1: 70,
          P4_Programming_Part2: 70,
          P4_MAD_FSD: 70,
          P4_DS: 70,
          P2Plus_Python: 60
        };

        const levels = {
          Lx_Level: calculateLevel(language, languagePass),
          Ax_Level: calculateLevel(aptitude, aptitudePass),
          Sx_Level: calculateLevel(softskill, softPass),
          Cx_Level: calculateLevel(core, corePass),
          Px_Level: calculateLevel(programming, progPass)
        };
        const scores = {
          "Language Proficiency in English": {
            target: 4,
            actual: levels.Lx_Level
          },
          "Aptitude": {
            target: 3,
            actual: levels.Ax_Level
          },
          "Core Fundamentals": {
            target: 3,
            actual: levels.Cx_Level
          },
          "Certifications": {
            target: 4,
            actual: 0
          },
          "Experiential Mini Projects": {
            target: 4,
            actual: 0
          },
          "Internships": {
            target: 4,
            actual: 0
          },
          "Soft Skills": {
            target: 3,
            actual: levels.Sx_Level
          }
        };

        const normalizedUsn = row.USN
          ?.toString()
          .trim()
          .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
          .toUpperCase();

        const response = await api.get(`/users/usn/${encodeURIComponent(normalizedUsn)}`, {
          params: { _ts: Date.now() },
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache"
          }
        });
        const userId = response.data?.userId || response.data?._id;
        if (!userId) throw new Error("User not found");

        await api.post(`/tyl-scores`, {
          userId,
          semester: 1,
          scores
        });

        success++;
        affectedUserIds.add(String(userId));
      } catch (error) {
        errCount++;
        newErrors.push(`Error for ${row.USN}: ${error.message}`);
      }
    }

    await recordAdminUploadSession({
      tabType: "add-tyl-marks",
      fileName: file?.name || "",
      totalRows: rows.length,
      successCount: success,
      errorCount: errCount,
      errors: newErrors,
      affectedUserIds: Array.from(affectedUserIds),
    });

    setSuccessCount(success);
    setErrorCount(errCount);
    setErrors(newErrors);
    setProcessing(false);
  };

  // ================= UI =================
  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 4 }}>
        <Typography variant="h4" align="center" sx={{ mb: 2 }}>
          Upload TYL Marks
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" alignItems="stretch">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={downloadTemplate}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Download Template
          </Button>

          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={processing}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {processing ? "Processing..." : "Upload File"}
            <input
              hidden
              accept=".csv"
              type="file"
              onChange={handleFileUpload}
            />
          </Button>
        </Stack>

        {!processing && (successCount > 0 || errorCount > 0) && (
          <Box sx={{ mt: 3 }}>
            {successCount > 0 && (
              <Alert severity="success">
                Successfully processed: {successCount}
              </Alert>
            )}
            {errorCount > 0 && (
              <Alert severity="error">
                Errors encountered: {errorCount}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
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
          </Box>
        )}

        {errors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <List dense>
              {errors.map((err, index) => (
                <ListItem key={index}>
                  <ListItemText primary={err} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Paper sx={{ mt: 4, p: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Levels are automatically calculated based on passing criteria.
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
            Are you sure you want to proceed with the bulk upload for <strong>TYL Marks</strong>?
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
            sx={{ bgcolor: theme.palette.primary.main, '&:hover': { bgcolor: theme.palette.primary.dark } }}
          >
            Start Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddTylMarks;
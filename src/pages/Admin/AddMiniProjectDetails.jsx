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

const AddMiniProjectDetails = () => {
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
    formType: "admin-mini-project-upload",
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
      "SlNo",
      "USN",
      "Name",
      "Title",
      "Man Hours",
      "Start Date",
      "End Date"
    ];

    const exampleRow = [
      1,
      "1CR23IS001",
      "AAMITH PRAMOD",
      "AI Based Smart Traffic Optimization System"
    ];

    const csvContent = Papa.unparse([headers, exampleRow], { quotes: true });

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "mini_project_template.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      try {
        if (!row.USN) throw new Error("USN missing");
        if (!row.Title) throw new Error("Project Title missing");

        const response = await api.get(`/users/usn/${row.USN}`, {
          params: { _ts: Date.now() },
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache"
          }
        });
        const userId = response.data?.userId || response.data?._id;

        if (!userId) throw new Error("User not found");

        await api.post(`/project/miniproject`, {
          userId,
          miniproject: [
            {
              title: row.Title,
              manHours: row["Man Hours"] ? Number(row["Man Hours"]) : null,
              startDate: row["Start Date"] || null,
              completedDate: row["End Date"] || null
            }
          ]
        });

        success++;
        affectedUserIds.add(String(userId));
      } catch (error) {
        errCount++;
        newErrors.push(`Error for ${row.USN}: ${error.message}`);
      }
    }

    await recordAdminUploadSession({
      tabType: "add-mini-project-details",
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
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 2,
          backgroundColor: isLight
            ? "rgba(255, 255, 255, 0.9)"
            : alpha(theme.palette.background.paper, 0.9),
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            Upload Mini Project 
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Upload student project 
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Upload Instructions
          </Typography>

          <Typography variant="body2">• USN must exist in system</Typography>
          <Typography variant="body2">• Title is mandatory</Typography>
          <Typography variant="body2">• Name should match registered student</Typography>
          <Typography variant="body2">• Do not leave blank rows</Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
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
            {processing ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              "Upload File"
            )}
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
            <strong>Note:</strong> Ensure project titles are accurate before uploading.
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
            Are you sure you want to proceed with the bulk upload for <strong>Mini Project Details</strong>?
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
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            Start Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddMiniProjectDetails;
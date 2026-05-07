import { useCallback, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import Papa from 'papaparse';
import { 
  Container, 
  Button, 
  Stack, 
  Typography,
  Box,
  Paper,
  Divider,
  CircularProgress,
  Tab,
  Tabs,
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
  CloudUpload as CloudUploadIcon,
  FileDownload as FileDownloadIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  HelpOutline as HelpOutlineIcon,
  SupervisorAccount as SupervisorAccountIcon
} from '@mui/icons-material';
import api from "../../utils/axios";
import { alpha, useTheme } from "@mui/material/styles";
import ClearIcon from "@mui/icons-material/Clear";
import useDraftPersistence from "../../hooks/useDraftPersistence";
import { resolveDraftScopeId } from "../../utils/draftScope";
import { recordAdminUploadSession } from "../../utils/uploadHistory";

import logger from "../../utils/logger.js";
// Define role options with their related info
const ROLES = [
  { 
    value: "student", 
    label: "Students", 
    icon: <PersonIcon />,
    template: [
      "Full Name",
      "Email Address",
      "Phone Number",
      "Department",
      "Semester",
      "USN",
      "Password"
    ],
    exampleRow: [
      "John Smith",
      "john@example.com",
      "9876543210",
      "CSE",
      "3",
      "1MS21CS001",
      "password123"
    ]
  },
  { 
    value: "faculty", 
    label: "Faculty", 
    icon: <SchoolIcon />,
    template: [
      "Full Name",
      "Email Address",
      "Phone Number",
      "Department",
      "Password"
    ],
    exampleRow: [
      "Dr. Jane Doe",
      "jane@example.com",
      "9876543211",
      "Computer Science",
      "password123"
    ]
  },
  { 
    value: "admin", 
    label: "Admin", 
    icon: <SupervisorAccountIcon />,
    template: [
      "Full Name",
      "Email Address",
      "Phone Number",
      "Department",
      "Password"
    ],
    exampleRow: [
      "Admin User",
      "admin@example.com",
      "9876543212",
      "Administration",
      "password123"
    ]
  }
];

const AddStudents = () => {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [selectedRole, setSelectedRole] = useState("student");
  const [processing, setProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [file, setFile] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [tempRows, setTempRows] = useState([]);

  const draftScopeId = useMemo(() => resolveDraftScopeId(), []);

  const restoreDraftState = useCallback((draftData = {}) => {
    const nextRole = ROLES.some((role) => role.value === draftData.selectedRole)
      ? draftData.selectedRole
      : "student";

    setSelectedRole(nextRole);
    setSuccessCount(Number(draftData.successCount) || 0);
    setErrorCount(Number(draftData.errorCount) || 0);
    setErrors(Array.isArray(draftData.errors) ? draftData.errors : []);
  }, []);

  const persistedErrors = useMemo(() => errors.slice(0, 200), [errors]);

  useDraftPersistence({
    formType: "admin-user-bulk-upload",
    scopeId: draftScopeId,
    values: {
      selectedRole,
      successCount,
      errorCount,
      errors: persistedErrors,
      hasSelectedFile: Boolean(file),
      isProcessing: processing,
    },
    reset: restoreDraftState,
    enableServerSync: false,
  });

  // Get the color based on the current theme mode
  const activeColor = isLight ? theme.palette.primary.main : theme.palette.info.main;
  
  // Get current role object
  const currentRole = ROLES.find(role => role.value === selectedRole);

  const handleRoleChange = (event, newValue) => {
    setSelectedRole(newValue);
    // Reset state when changing roles
    setFile(null);
    setErrors([]);
    setSuccessCount(0);
    const fileInput = document.getElementById("upload-file");
    if (fileInput) fileInput.value = "";
  };

  const handleClearResults = () => {
    setSuccessCount(0);
    setErrorCount(0);
    setErrors([]);
    setFile(null);
    const fileInput = document.getElementById("upload-file");
    if (fileInput) fileInput.value = "";
  };

  const downloadTemplate = () => {
    const headers = currentRole.template;
    const exampleRow = currentRole.exampleRow;
    
    const csvContent = Papa.unparse({
      fields: headers,
      data: [exampleRow]
    }, { quotes: true });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `${selectedRole.toLowerCase()}_template.csv`);
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
          enqueueSnackbar("Invalid JSON format", { variant: "error" });
          return;
        }
      } else {
        const results = Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
        });
        rows = results.data;
      }
      
      if (rows.length === 0) {
        enqueueSnackbar("The file is empty", { variant: "warning" });
        return;
      }

      setTempRows(rows);
      setOpenConfirm(true);
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
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

  const processRows = async (rows) => {
    let success = 0;
    let errors = 0;
    const newErrors = [];
    const affectedUserIds = new Set();
    const createdUserIds = new Set();

    for (const [index, row] of rows.entries()) {
      try {
        // Check required fields based on role
        let endpoint;
        let data;

        if (selectedRole === "student") {
          if (!row["Full Name"] || !row["Email Address"] || !row["Phone Number"] || !row["Password"] || !row["USN"]) {
            throw new Error("Missing required fields (Full Name, Email Address, Phone Number, USN, Password)");
          }
          if (row["Password"].length < 8) {
            throw new Error("Password must be at least 8 characters long");
          }
          
          // Split the full name into first and last name
          const nameParts = row["Full Name"].split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName; // Use first name as last name if not provided
          
          endpoint = `/users/signup`;
          data = {
            name: row["Full Name"],
            email: row["Email Address"],
            phone: row["Phone Number"],
            department: row["Department"],
            semester: row["Semester"] ? parseInt(row["Semester"], 10) : undefined,
            usn: row["USN"],
            password: row["Password"],
            passwordConfirm: row["Password"],
            roleName: selectedRole,
            firstName: firstName,
            lastName: lastName
          };
        } else if (selectedRole === "faculty") {
          if (!row["Full Name"] || !row["Email Address"] || !row["Phone Number"] || !row["Password"]) {
            throw new Error("Missing required fields (Full Name, Email Address, Phone Number, Password)");
          }
          if (row["Password"].length < 8) {
            throw new Error("Password must be at least 8 characters long");
          }
          endpoint = `/users/signup`;
          data = {
            name: row["Full Name"],
            email: row["Email Address"],
            phone: row["Phone Number"],
            department: row["Department"],
            password: row["Password"],
            passwordConfirm: row["Password"],
            roleName: selectedRole
          };
        } else if (selectedRole === "admin") {
          if (!row["Full Name"] || !row["Email Address"] || !row["Phone Number"] || !row["Password"]) {
            throw new Error("Missing required fields (Full Name, Email Address, Phone Number, Password)");
          }
          if (row["Password"].length < 8) {
            throw new Error("Password must be at least 8 characters long");
          }
          endpoint = `/users/signup`;
          data = {
            name: row["Full Name"],
            email: row["Email Address"],
            phone: row["Phone Number"],
            department: row["Department"],
            password: row["Password"],
            passwordConfirm: row["Password"],
            roleName: selectedRole
          };
        }

        try {
          logger.info("Sending data:", data); // Add this for debugging
          const response = await api.post(endpoint, data);
          if (response.data) {
            success++;

            const createdUserId =
              response.data?.data?.user?._id ||
              response.data?.data?.user?.id ||
              response.data?._id ||
              response.data?.user?._id ||
              null;

            if (createdUserId) {
              createdUserIds.add(String(createdUserId));
              affectedUserIds.add(String(createdUserId));
            }
          }
        } catch (error) {
          errors++;
          const errorMessage = error.response?.data?.message || error.message;
          logger.error("Error details:", error.response?.data); // Keep this for debugging
          newErrors.push(`Row ${index + 1}: ${errorMessage}`);
        }
      } catch (error) {
        errors++;
        newErrors.push(`Row ${index + 1}: ${error.response?.data?.message || error.message}`);
      }
    }

    await recordAdminUploadSession({
      tabType: "add-users",
      fileName: file?.name || "",
      totalRows: rows.length,
      successCount: success,
      errorCount: errors,
      errors: newErrors,
      affectedUserIds: Array.from(affectedUserIds),
      createdUserIds: Array.from(createdUserIds),
      metadata: {
        role: selectedRole,
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
            Add Users
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ maxWidth: { xs: '100%', sm: 600 }, mx: 'auto' }}
          >
            Upload a CSV file to add multiple users at once
          </Typography>
        </Box>
        
        <Tabs
          value={selectedRole}
          onChange={handleRoleChange}
          variant="fullWidth"
          textColor="inherit"
          TabIndicatorProps={{
            style: {
              backgroundColor: activeColor
            }
          }}
          sx={{ 
            mb: 4,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          {ROLES.map(role => (
            <Tab
              key={role.value}
              value={role.value}
              label={role.label}
              icon={role.icon}
              iconPosition="start"
              sx={{
                fontWeight: 'medium',
                borderRadius: '8px 8px 0 0',
                '&.Mui-selected': {
                  color: activeColor,
                }
              }}
            />
          ))}
        </Tabs>

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
            Upload {currentRole.label}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please ensure your CSV file has the following columns:
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              mb: 3,
              pl: 2,
              borderLeft: `4px solid ${activeColor}`,
              py: 1,
            }}
          >
            {currentRole.template.map((field, index) => (
              <Typography key={index} variant="body2" color="text.secondary">
                • {field}{index < 4 ? " (required)" : ""}
              </Typography>
            ))}
          </Box>

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
                borderColor: activeColor,
                color: activeColor,
                '&:hover': {
                  borderColor: activeColor,
                  backgroundColor: alpha(activeColor, 0.04),
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
                    bgcolor: activeColor,
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
                Successfully added: {successCount} {currentRole.label.toLowerCase()}
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
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
          }}
        >
          <HelpOutlineIcon 
            fontSize="small" 
            color="warning" 
            sx={{ flexShrink: 0 }}
          />
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Ensure all required fields are properly filled. 
            Use strong passwords. Emails should be unique across the system.
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
            Are you sure you want to proceed with the bulk upload for <strong>{currentRole.label}</strong>?
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
            sx={{ bgcolor: activeColor, '&:hover': { bgcolor: activeColor } }}
          >
            Start Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddStudents;
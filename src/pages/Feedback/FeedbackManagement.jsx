import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Drawer,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
  Container,
  Tooltip,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { alpha, useTheme } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import { Controller, useForm } from "react-hook-form";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axios";
import Page from "../../components/Page";
import { FormProvider, RHFTextField } from "../../components/hook-form";
import logger from "../../utils/logger.js";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupIcon from "@mui/icons-material/Group";
import UpdateIcon from "@mui/icons-material/Update";

const roundOptions = [
  { value: 1, label: "Feedback 1" },
  { value: 2, label: "Feedback 2" },
];

const RATING_OPTIONS = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

const FEEDBACK_QUESTIONS = [
  { field: "mentorAccessibility", label: "Mentor accessibility & availability" },
  { field: "mentorInteraction", label: "Mentor interaction frequency" },
  { field: "academicHelp", label: "Academic help provided" },
  { field: "mentorConcern", label: "Mentor concern/interest" },
  { field: "listeningSkills", label: "Listening skills" },
  { field: "professionalMotivation", label: "Professional development motivation" },
  { field: "barrierResolution", label: "Barrier resolution" },
  { field: "systemEffectiveness", label: "System effectiveness" },
  { field: "continuationWillingness", label: "Continuation willingness" },
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const FeedbackManagement = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);
  const canEditWindow = user?.roleName === "admin";
  const isHodOrDirector = user?.roleName === "hod" || user?.roleName === "director";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackWindow, setFeedbackWindow] = useState(null);
  const [stats, setStats] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

  // Use localStorage for persistence
  const [semesterFilter, setSemesterFilter] = useState(() => localStorage.getItem("feedback_sem_filter") || "");
  const [selectedFeedbackRound, setSelectedFeedbackRound] = useState(() => Number(localStorage.getItem("feedback_round_filter")) || 1);
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [mentorFilter, setMentorFilter] = useState("");
  const [semesterDraft, setSemesterDraft] = useState("");
  const [roundDraft, setRoundDraft] = useState(1);
  const [enabledDraft, setEnabledDraft] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFeedbacks, setStudentFeedbacks] = useState({});
  const [selectedRound, setSelectedRound] = useState(0);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [isEditingInDialog, setIsEditingInDialog] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [mentorGroups, setMentorGroups] = useState([]);
  const [expandedMentors, setExpandedMentors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const [allStudents, setAllStudents] = useState([]);
  
  const editorMethods = useForm({
    defaultValues: {
      mentorAccessibility: "",
      mentorInteraction: "",
      academicHelp: "",
      mentorConcern: "",
      listeningSkills: "",
      professionalMotivation: "",
      barrierResolution: "",
      systemEffectiveness: "",
      continuationWillingness: "",
      awareOfPST: "",
      awareOfPLT: "",
      remarks: "",
    },
  });

  const loadFeedbackData = async (query = {}) => {
    setLoading(true);

    try {
      // 1. Always get the latest window status
      const windowResponse = await api.get("/feedback/window");
      const windowData = windowResponse.data?.data?.window || null;
      setFeedbackWindow(windowData);

      // 2. Prepare active parameters (provided query OR existing filter OR window default)
      const activeSem = query.semester || semesterFilter || windowData?.semester || "";
      const activeRound = query.feedbackRound || selectedFeedbackRound || windowData?.feedbackRound || 1;

      // 3. Update the filter UI state if it's the first load or if we want to sync with window
      if (!semesterFilter && activeSem) setSemesterFilter(activeSem.toString());
      // Only auto-select the round if we haven't manually changed it or if it's the first load
      if (!query.feedbackRound && windowData?.feedbackRound && !semesterFilter) {
        setSelectedFeedbackRound(windowData.feedbackRound);
      }

      // 4. Fetch the data based on active parameters
      const overviewResponse = await api.get("/feedback/overview", { 
        params: { 
          semester: activeSem || undefined, 
          feedbackRound: activeRound,
          department: user.roleName !== 'admin' ? user.department : undefined
        } 
      });
      const overviewData = overviewResponse.data?.data || {};
      setFeedbacks(overviewData.feedbacks || []);

      // 5. Fetch stats if semester is available
      if (activeSem) {
        try {
          const statsParams = {};
          if (user.roleName !== 'admin' && user.department) {
            statsParams.department = user.department;
          }
          const statsResponse = await api.get(`/feedback/stats/${activeSem}/${activeRound}`, {
            params: statsParams
          });
          setStats(statsResponse.data?.data || null);
        } catch (err) {
          logger.error("Error fetching stats:", err);
          setStats(null);
        }
      }

      // 6. Fetch all students for this semester/department to show pending status
      if (activeSem) {
        try {
          const studentResponse = await api.get("/users", {
            params: {
              role: "student",
              semester: activeSem,
              department: user.roleName !== 'admin' ? user.department : undefined,
              limit: 1000 // Get all for this semester
            }
          });
          setAllStudents(studentResponse.data?.data?.users || []);
        } catch (err) {
          logger.error("Error fetching students:", err);
          setAllStudents([]);
        }
      }

      // 7. Fetch mentor groups for HOD/Director
      if (isHodOrDirector && activeSem) {
        try {
          const mentorResponse = await api.get(`/feedback/by-mentor/${user._id}`, {
            params: {
              semester: activeSem,
              round: activeRound,
              department: user.department,
            },
          });
          setMentorGroups(mentorResponse.data?.data?.mentors || []);
        } catch (err) {
          logger.error("Error fetching mentor groups:", err);
        }
      }

      // Sync window editor drafts
      setSemesterDraft(windowData?.semester || "");
      setRoundDraft(windowData?.feedbackRound || 1);
      setEnabledDraft(Boolean(windowData?.isEnabled));
    } catch (error) {
      logger.error("Error loading feedback management data:", error);
      enqueueSnackbar("Unable to load feedback data", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbackData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveWindow = async () => {
    try {
      if (enabledDraft && !semesterDraft.trim()) {
        enqueueSnackbar("Semester is required to enable feedback", { variant: "error" });
        return;
      }

      setSaving(true);

      await api.patch("/feedback/window", {
        isEnabled: enabledDraft,
        semester: semesterDraft.trim(),
        feedbackRound: roundDraft,
      });

      enqueueSnackbar("Feedback window updated", { variant: "success" });
      await loadFeedbackData({
        semester: semesterFilter.trim() || undefined,
        feedbackRound: selectedFeedbackRound,
      });
    } catch (error) {
      logger.error("Error updating feedback window:", error);
      enqueueSnackbar(error.response?.data?.message || "Failed to update feedback window", {
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyFilters = async () => {
    if (!semesterFilter.trim()) {
      enqueueSnackbar("Please select a semester first", { variant: "warning" });
      return;
    }
    // Save to localStorage
    localStorage.setItem("feedback_sem_filter", semesterFilter);
    localStorage.setItem("feedback_round_filter", selectedFeedbackRound);

    await loadFeedbackData({
      semester: semesterFilter.trim(),
      feedbackRound: selectedFeedbackRound,
    });
  };

  const handleOpenDrillDown = async (student) => {
    setSelectedStudent(student);
    setSelectedRound(0);
    try {
      const response = await api.get(`/feedback/student/${student.studentId}`, {
        params: {
          semester: semesterFilter,
        },
      });
      setStudentFeedbacks(response.data?.data?.feedbackByRound || {});
      setDrillDownOpen(true);
    } catch (err) {
      enqueueSnackbar("Error fetching student feedback details", { variant: "error" });
    }
  };

  const handleCloseDrillDown = () => {
    setDrillDownOpen(false);
    setSelectedStudent(null);
    setStudentFeedbacks({});
    setIsEditMode(false);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setEditingFeedback(null);
    editorMethods.reset();
  };

  const handleOpenEditInDialog = (feedback) => {
    setEditingFeedback(feedback);
    editorMethods.reset({
      mentorAccessibility: feedback.mentorAccessibility?.toString() || "",
      mentorInteraction: feedback.mentorInteraction?.toString() || "",
      academicHelp: feedback.academicHelp?.toString() || "",
      mentorConcern: feedback.mentorConcern?.toString() || "",
      listeningSkills: feedback.listeningSkills?.toString() || "",
      professionalMotivation: feedback.professionalMotivation?.toString() || "",
      barrierResolution: feedback.barrierResolution?.toString() || "",
      systemEffectiveness: feedback.systemEffectiveness?.toString() || "",
      continuationWillingness: feedback.continuationWillingness?.toString() || "",
      awareOfPST: feedback.awareOfPST ? "yes" : "no",
      awareOfPLT: feedback.awareOfPLT ? "yes" : "no",
      remarks: feedback.remarks || "",
    });
    setIsEditMode(true);
  };

  const handleDialogSubmit = async (formData) => {
    try {
      if (editingFeedback) {
        await api.patch(`/feedback/${editingFeedback._id}`, {
          mentorAccessibility: Number(formData.mentorAccessibility),
          mentorInteraction: Number(formData.mentorInteraction),
          academicHelp: Number(formData.academicHelp),
          mentorConcern: Number(formData.mentorConcern),
          listeningSkills: Number(formData.listeningSkills),
          professionalMotivation: Number(formData.professionalMotivation),
          barrierResolution: Number(formData.barrierResolution),
          systemEffectiveness: Number(formData.systemEffectiveness),
          continuationWillingness: Number(formData.continuationWillingness),
          awareOfPST: formData.awareOfPST === "yes",
          awareOfPLT: formData.awareOfPLT === "yes",
          remarks: formData.remarks,
        });
        enqueueSnackbar("Feedback updated successfully", { variant: "success" });
        
        // Refresh local student feedback data
        const response = await api.get(`/feedback/student/${selectedStudent.studentId}`, {
          params: { semester: semesterFilter },
        });
        setStudentFeedbacks(response.data?.data?.feedbackByRound || {});
        setIsEditMode(false);
        
        // Refresh main list
        await loadFeedbackData({
          semester: semesterFilter.trim(),
          feedbackRound: selectedFeedbackRound,
        });
      }
    } catch (error) {
      logger.error("Error saving feedback:", error);
      enqueueSnackbar(error.response?.data?.message || "Error saving feedback", { variant: "error" });
    }
  };

  const handleSidebarSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editingFeedback) {
        // Update existing feedback
        await api.patch(`/feedback/${editingFeedback._id}`, {
          mentorAccessibility: Number(formData.mentorAccessibility),
          mentorInteraction: Number(formData.mentorInteraction),
          academicHelp: Number(formData.academicHelp),
          mentorConcern: Number(formData.mentorConcern),
          listeningSkills: Number(formData.listeningSkills),
          professionalMotivation: Number(formData.professionalMotivation),
          barrierResolution: Number(formData.barrierResolution),
          systemEffectiveness: Number(formData.systemEffectiveness),
          continuationWillingness: Number(formData.continuationWillingness),
          awareOfPST: formData.awareOfPST === "yes",
          awareOfPLT: formData.awareOfPLT === "yes",
          remarks: formData.remarks,
        });
        enqueueSnackbar("Feedback updated successfully", { variant: "success" });
      } else {
        // Create new feedback (would need studentId, semester, feedbackRound from context)
        await api.post("/feedback", {
          userId: editingFeedback?.userId,
          semester: semesterFilter,
          feedbackRound: selectedFeedbackRound,
          mentorAccessibility: Number(formData.mentorAccessibility),
          mentorInteraction: Number(formData.mentorInteraction),
          academicHelp: Number(formData.academicHelp),
          mentorConcern: Number(formData.mentorConcern),
          listeningSkills: Number(formData.listeningSkills),
          professionalMotivation: Number(formData.professionalMotivation),
          barrierResolution: Number(formData.barrierResolution),
          systemEffectiveness: Number(formData.systemEffectiveness),
          continuationWillingness: Number(formData.continuationWillingness),
          awareOfPST: formData.awareOfPST === "yes",
          awareOfPLT: formData.awareOfPLT === "yes",
          remarks: formData.remarks,
        });
        enqueueSnackbar("Feedback created successfully", { variant: "success" });
      }
      
      // Refresh main list
      await loadFeedbackData({
        semester: semesterFilter.trim(),
        feedbackRound: selectedFeedbackRound,
      });
      
      handleCloseSidebar();
    } catch (error) {
      logger.error("Error saving feedback:", error);
      enqueueSnackbar(error.response?.data?.message || "Error saving feedback", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredStudents = useMemo(() => {
    // Merge allStudents with feedbacks to show status
    let studentList = allStudents.map(student => {
      const feedback = feedbacks.find(f => f.userId?._id === student._id && f.feedbackRound === selectedFeedbackRound);
      return {
        ...student,
        feedback,
        hasResponded: !!feedback
      };
    });

    if (statusFilter === "responded") {
      studentList = studentList.filter(s => s.hasResponded);
    } else if (statusFilter === "pending") {
      studentList = studentList.filter(s => !s.hasResponded);
    }

    if (!searchTerm) return studentList;
    return studentList.filter((s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.collegeCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allStudents, feedbacks, searchTerm, selectedFeedbackRound, statusFilter]);

  const filteredMentorGroups = useMemo(() => {
    let groups = mentorGroups;
    if (statusFilter !== "all") {
      groups = groups.map(group => ({
        ...group,
        mentees: group.mentees.filter(m => {
          const hasFb = m.feedbacks?.some(f => f.feedbackRound === selectedFeedbackRound);
          return statusFilter === "responded" ? hasFb : !hasFb;
        })
      }));
    }

    if (!searchTerm) return groups;
    return groups.map((group) => ({
      ...group,
      mentees: group.mentees.filter((m) =>
        m.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }));
  }, [mentorGroups, searchTerm, statusFilter, selectedFeedbackRound]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Page title="Feedback Management">
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Feedback Control Center
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage feedback windows and analyze student responses.
              </Typography>
            </Box>
            <Chip
              icon={<AssessmentIcon />}
              label={canEditWindow ? "Administrator" : "Viewer"}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Grid container spacing={3}>
            {/* Window Control Card (ADMIN ONLY) */}
            {canEditWindow && (
              <Grid item xs={12} lg={4}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    height: "100%",
                    boxShadow: theme.customShadows?.z12,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      opacity: 0.05,
                      transform: "rotate(15deg)",
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: 160 }} />
                  </Box>

                  <Stack spacing={3} sx={{ position: "relative" }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      >
                        <UpdateIcon />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Window Control
                      </Typography>
                    </Stack>

                    <Divider />

                    <Stack spacing={2.5}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Target Semester</InputLabel>
                        <Select
                          label="Target Semester"
                          value={semesterDraft}
                          onChange={(e) => setSemesterDraft(e.target.value)}
                        >
                          {(user?.department === "MCA" ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8]).map((sem) => (
                            <MenuItem key={sem} value={sem.toString()}>
                              Semester {sem}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth size="small">
                        <InputLabel>Feedback Round</InputLabel>
                        <Select
                          label="Feedback Round"
                          value={roundDraft}
                          onChange={(e) => setRoundDraft(Number(e.target.value))}
                        >
                          <MenuItem value={1}>Feedback 1</MenuItem>
                          <MenuItem value={2}>Feedback 2</MenuItem>
                        </Select>
                      </FormControl>

                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: alpha(enabledDraft ? theme.palette.success.main : theme.palette.grey[500], 0.05),
                          borderColor: alpha(enabledDraft ? theme.palette.success.main : theme.palette.grey[500], 0.2),
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              Active Status
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {enabledDraft ? "Students can submit" : "Submissions disabled"}
                            </Typography>
                          </Box>
                          <Switch
                            checked={enabledDraft}
                            color="success"
                            onChange={(e) => setEnabledDraft(e.target.checked)}
                          />
                        </Stack>
                      </Paper>

                      <LoadingButton
                        fullWidth
                        variant="contained"
                        size="large"
                        loading={saving}
                        onClick={handleSaveWindow}
                        sx={{ fontWeight: 800, borderRadius: 2 }}
                      >
                        Apply Changes
                      </LoadingButton>

                      <Alert
                        severity={feedbackWindow?.isEnabled ? "success" : "info"}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        {feedbackWindow?.isEnabled
                          ? `Live: Semester ${feedbackWindow.semester} - Round ${feedbackWindow.feedbackRound}`
                          : "No active feedback window"}
                      </Alert>
                    </Stack>
                  </Stack>
                </Card>
              </Grid>
            )}

            {/* Stats & Filters */}
            <Grid item xs={12} lg={canEditWindow ? 8 : 12}>
              <Stack spacing={3}>
                {/* Stats Cards */}
                {stats && (
                  <Grid container spacing={2}>
                    {[
                      { label: "Responded", value: stats.responded || 0, color: "success", icon: <GroupIcon /> },
                      { label: "Enrolled", value: stats.totalEnrolled || 0, color: "primary", icon: <GroupIcon /> },
                      { label: "Response Rate", value: `${stats.responseRate || 0}%`, color: "info", icon: <AssessmentIcon /> },
                      { label: "Avg. Score", value: `${(stats.averageScoreOverall || 0).toFixed(2)}/5.0`, color: "warning", icon: <AssessmentIcon /> },
                    ].map((s) => (
                      <Grid item xs={6} sm={3} key={s.label}>
                        <Card sx={{ 
                          p: 2.5, 
                          textAlign: "center", 
                          borderRadius: 3, 
                          border: `1px solid ${alpha(theme.palette[s.color].main, 0.15)}`, 
                          backgroundColor: alpha(theme.palette[s.color].main, 0.04),
                          transition: theme.transitions.create(['transform', 'box-shadow']),
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.customShadows?.z8,
                            backgroundColor: alpha(theme.palette[s.color].main, 0.08),
                          }
                        }}>
                          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>{s.label}</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: theme.palette[s.color].main }}>{s.value}</Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Filter Toolbar */}
                <Card sx={{ p: 3, borderRadius: 3, boxShadow: theme.customShadows?.z8 }}>
                  <Stack spacing={3}>
                    {/* Row 1: Data View Filters */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon fontSize="small" /> Data View Filters
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>View Semester</InputLabel>
                            <Select
                              label="View Semester"
                              value={semesterFilter}
                              onChange={(e) => setSemesterFilter(e.target.value)}
                            >
                              {(user?.department === "MCA" ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8]).map((sem) => (
                                <MenuItem key={sem} value={sem.toString()}>
                                  Semester {sem}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>View Round</InputLabel>
                            <Select
                              label="View Round"
                              value={selectedFeedbackRound}
                              onChange={(e) => setSelectedFeedbackRound(Number(e.target.value))}
                            >
                              <MenuItem value={1}>Feedback 1</MenuItem>
                              <MenuItem value={2}>Feedback 2</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <LoadingButton
                            fullWidth
                            variant="contained"
                            loading={loading}
                            onClick={handleApplyFilters}
                            sx={{ height: 40, fontWeight: 700 }}
                          >
                            Search
                          </LoadingButton>
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    {/* Row 2: Search, Status & Mentor Filter */}
                    <Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon color="disabled" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Response Status</InputLabel>
                            <Select
                              label="Response Status"
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                            >
                              <MenuItem value="all">All Students</MenuItem>
                              <MenuItem value="responded">Responded</MenuItem>
                              <MenuItem value="pending">Pending</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        {isHodOrDirector && (
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Filter by Mentor</InputLabel>
                              <Select
                                label="Filter by Mentor"
                                value={mentorFilter}
                                onChange={(e) => setMentorFilter(e.target.value)}
                              >
                                <MenuItem value="">All Mentors</MenuItem>
                                {mentorGroups.map((group) => (
                                  <MenuItem key={group.mentorId} value={group.mentorId}>
                                    {group.mentorName}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Grid>
          </Grid>

          {/* Results Section */}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
              <AssessmentIcon color="primary" />
              Response Analysis
            </Typography>

            {!semesterFilter ? (
              <Paper sx={{ p: 8, textAlign: "center", borderRadius: 4, backgroundColor: alpha(theme.palette.grey[500], 0.05), border: `2px dashed ${theme.palette.divider}` }}>
                <Typography variant="h6" color="text.secondary">Please select a semester and click "Search" to view feedback data.</Typography>
              </Paper>
            ) : !loading && ((isHodOrDirector && filteredMentorGroups.length === 0) || (!isHodOrDirector && filteredStudents.length === 0)) ? (
              <Paper sx={{ p: 8, textAlign: "center", borderRadius: 4, backgroundColor: alpha(theme.palette.grey[500], 0.05), border: `2px dashed ${theme.palette.divider}` }}>
                <Typography variant="h6" color="text.secondary">No responses found for Semester {semesterFilter}, Feedback {selectedFeedbackRound}.</Typography>
              </Paper>
            ) : loading ? (
              <Stack spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Card key={i} sx={{ p: 4, borderRadius: 2, opacity: 0.5, border: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2">Loading feedback records...</Typography>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box>
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                        {isHodOrDirector && <TableCell sx={{ fontWeight: 800 }}>Mentor</TableCell>}
                        <TableCell align="center" sx={{ fontWeight: 800 }}>Avg Score</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isHodOrDirector ? (
                        // HOD/Director View: Flattened list or Grouped? 
                        // Let's flatten it for the "User List" feel
                        filteredMentorGroups
                          .filter((group) => !mentorFilter || group.mentorId === mentorFilter)
                          .flatMap((group) => group.mentees.map(mentee => ({ ...mentee, mentorName: group.mentorName })))
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((mentee) => {
                            const feedback = mentee.feedbacks?.find(f => f.feedbackRound === selectedFeedbackRound);
                            return (
                              <TableRow key={mentee.studentId} hover>
                                <TableCell>
                                  <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: theme.palette.primary.main, fontWeight: 700, width: 36, height: 36 }}>
                                      {mentee.studentName?.charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{mentee.studentName}</Typography>
                                      <Typography variant="caption" color="text.secondary">{mentee.collegeCode || mentee.studentId}</Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{mentee.mentorName}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="subtitle2" sx={{ 
                                    fontWeight: 800, 
                                    color: feedback ? (feedback.averageScore >= 4 ? 'success.main' : feedback.averageScore >= 3 ? 'warning.main' : 'error.main') : 'text.disabled'
                                  }}>
                                    {feedback?.averageScore?.toFixed(2) || "N/A"}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={feedback ? "Responded" : "Pending"} 
                                    size="small" 
                                    color={feedback ? "success" : "default"}
                                    variant={feedback ? "filled" : "outlined"}
                                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button size="small" variant="text" onClick={() => handleOpenDrillDown(mentee)}>Details</Button>
                                    {canEditWindow && feedback && (
                                      <IconButton size="small" onClick={() => handleOpenEditInDialog(feedback)}>
                                        <SettingsIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })
                      ) : (
                        filteredStudents
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((student) => (
                            <TableRow key={student._id} hover>
                              <TableCell>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Avatar sx={{ bgcolor: theme.palette.primary.main, fontWeight: 700, width: 36, height: 36 }}>
                                    {student.name?.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{student.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{student.collegeCode}</Typography>
                                  </Box>
                                </Stack>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="subtitle2" sx={{ 
                                  fontWeight: 800, 
                                  color: student.hasResponded 
                                    ? (student.feedback.averageScore >= 4 ? 'success.main' : student.feedback.averageScore >= 3 ? 'warning.main' : 'error.main') 
                                    : 'text.disabled'
                                }}>
                                  {student.hasResponded ? student.feedback.averageScore?.toFixed(2) : "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={student.hasResponded ? "Responded" : "Pending"} 
                                  size="small" 
                                  color={student.hasResponded ? "success" : "default"}
                                  variant={student.hasResponded ? "filled" : "outlined"}
                                  sx={{ fontWeight: 700, fontSize: '0.7rem' }} 
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button size="small" variant="text" onClick={() => handleOpenDrillDown({ studentId: student._id, studentName: student.name })}>Details</Button>
                                  {canEditWindow && student.hasResponded && (
                                    <IconButton size="small" onClick={() => handleOpenEditInDialog(student.feedback)}>
                                      <SettingsIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={isHodOrDirector ? filteredMentorGroups.flatMap(g => g.mentees).length : filteredStudents.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </Box>
            )}
          </Box>
        </Stack>

        {/* Drill-Down Modal */}
         <Dialog 
          open={drillDownOpen} 
          onClose={handleCloseDrillDown} 
          maxWidth="md" 
          fullWidth 
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {selectedStudent?.studentName} 
              <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                {isEditingInDialog ? "Editing Feedback" : "Feedback Details"}
              </Typography>
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`Semester ${semesterFilter}`} color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
              {isEditingInDialog && (
                <IconButton onClick={() => setIsEditingInDialog(false)}>
                  <CloseIcon />
                </IconButton>
              )}
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {Object.keys(studentFeedbacks).length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Alert severity="warning" sx={{ borderRadius: 2, mb: 2, justifyContent: 'center' }}>
                  Student has not responded to feedback for this window.
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Status: Pending Response
                </Typography>
              </Box>
            ) : isEditingInDialog ? (
              <FormProvider methods={editorMethods} onSubmit={editorMethods.handleSubmit(handleDialogEditSubmit)}>
                <Stack spacing={4}>
                  <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
                    <Stack spacing={4}>
                      {FEEDBACK_QUESTIONS.map((question, idx) => (
                        <Box key={question.field}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 24, height: 24, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                              {idx + 1}
                            </Box>
                            {question.label}
                          </Typography>
                          <Controller
                            name={question.field}
                            control={editorMethods.control}
                            render={({ field }) => (
                              <RadioGroup {...field} row sx={{ justifyContent: 'space-between', px: 1 }}>
                                {RATING_OPTIONS.map((option) => (
                                  <FormControlLabel
                                    key={option.value}
                                    value={option.value.toString()}
                                    control={<Radio size="small" />}
                                    label={
                                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{option.value}</Typography>
                                    }
                                    labelPlacement="bottom"
                                    sx={{ m: 0 }}
                                  />
                                ))}
                              </RadioGroup>
                            )}
                          />
                        </Box>
                      ))}

                      <Divider />

                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Program Awareness</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ mb: 1 }}>PST Awareness</Typography>
                            <Controller
                              name="awareOfPST"
                              control={editorMethods.control}
                              render={({ field }) => (
                                <RadioGroup {...field} row>
                                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                                </RadioGroup>
                              )}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ mb: 1 }}>PLT Awareness</Typography>
                            <Controller
                              name="awareOfPLT"
                              control={editorMethods.control}
                              render={({ field }) => (
                                <RadioGroup {...field} row>
                                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                                </RadioGroup>
                              )}
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      <RHFTextField
                        name="remarks"
                        label="Additional Remarks"
                        multiline
                        minRows={3}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                    <Button variant="outlined" onClick={() => setIsEditingInDialog(false)}>
                      Cancel
                    </Button>
                    <LoadingButton
                      type="submit"
                      variant="contained"
                      loading={editorMethods.formState.isSubmitting}
                    >
                      Save Changes
                    </LoadingButton>
                  </Stack>
                </Stack>
              </FormProvider>
            ) : (
              <>
                <Tabs 
                  value={selectedRound} 
                  onChange={(_, val) => setSelectedRound(val)}
                  sx={{ 
                    mb: 3, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': { fontWeight: 700, fontSize: '1rem' }
                  }}
                >
                  {[1, 2].map((round) => (
                    <Tab
                      key={round}
                      label={`Feedback Round ${round}`}
                      disabled={!studentFeedbacks[round]}
                    />
                  ))}
                </Tabs>

                {Object.keys(studentFeedbacks).map((round) => (
                  <TabPanel key={round} value={selectedRound} index={Number(round) - 1}>
                    {studentFeedbacks[round] && (
                      <Stack spacing={4}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                            Performance Metrics
                          </Typography>
                          <Stack spacing={2}>
                            {FEEDBACK_QUESTIONS.map((q) => (
                              <Box key={q.field}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{q.label}</Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                      {studentFeedbacks[round][q.field]}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">/ 5</Typography>
                                  </Box>
                                </Stack>
                                <Paper sx={{ height: 6, width: '100%', bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 3, overflow: 'hidden' }}>
                                  <Box sx={{ height: '100%', width: `${(studentFeedbacks[round][q.field] / 5) * 100}%`, bgcolor: 'primary.main', borderRadius: 3 }} />
                                </Paper>
                              </Box>
                            ))}
                          </Stack>
                        </Box>

                        <Divider />

                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Awareness Check</Typography>
                            <Stack spacing={1.5}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Aware of PST?</Typography>
                                <Chip label={studentFeedbacks[round].awareOfPST ? "Yes" : "No"} size="small" color={studentFeedbacks[round].awareOfPST ? "success" : "error"} sx={{ fontWeight: 800 }} />
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Aware of PLT?</Typography>
                                <Chip label={studentFeedbacks[round].awareOfPLT ? "Yes" : "No"} size="small" color={studentFeedbacks[round].awareOfPLT ? "success" : "error"} sx={{ fontWeight: 800 }} />
                              </Box>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Summary Score</Typography>
                            <Card sx={{ p: 2.5, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`, textAlign: 'center' }}>
                              <Typography variant="overline" color="success.main" sx={{ fontWeight: 800 }}>Overall Satisfaction</Typography>
                              <Typography variant="h3" sx={{ fontWeight: 900, color: theme.palette.success.main }}>
                                {studentFeedbacks[round].averageScore?.toFixed(2) || "N/A"}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">out of 5.0</Typography>
                            </Card>
                          </Grid>
                        </Grid>

                        {studentFeedbacks[round].remarks && (
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>Student Remarks</Typography>
                            <Paper sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{studentFeedbacks[round].remarks}"</Typography>
                            </Paper>
                          </Box>
                        )}

                        {canEditWindow && (
                          <Button
                            variant="outlined"
                            startIcon={<SettingsIcon />}
                            onClick={() => {
                              setEditingFeedback(studentFeedbacks[round]);
                              setIsEditingInDialog(true);
                              editorMethods.reset({
                                ...studentFeedbacks[round],
                                awareOfPST: studentFeedbacks[round].awareOfPST ? 'yes' : 'no',
                                awareOfPLT: studentFeedbacks[round].awareOfPLT ? 'yes' : 'no'
                              });
                            }}
                            fullWidth
                            sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                          >
                            Modify This Feedback Entry
                          </Button>
                        )}
                      </Stack>
                    )}
                  </TabPanel>
                ))}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Sidebar Editor */}
        <Drawer
          anchor="right"
          open={sidebarOpen}
          onClose={handleCloseSidebar}
          PaperProps={{ sx: { width: { xs: "100%", md: 480 }, borderRadius: '16px 0 0 16px' } }}
        >
          <Box sx={{ p: 4, height: "100%", display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                {editingFeedback ? "Update Feedback" : "Create Feedback Entry"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manually adjust or review student feedback responses.
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 4 }} />

            <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
              <FormProvider methods={editorMethods} onSubmit={editorMethods.handleSubmit(handleSidebarSubmit)}>
                <Stack spacing={4}>
                  {FEEDBACK_QUESTIONS.map((question, idx) => (
                    <Box key={question.field}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 24, height: 24, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                          {idx + 1}
                        </Box>
                        {question.label}
                      </Typography>
                      <Controller
                        name={question.field}
                        control={editorMethods.control}
                        render={({ field }) => (
                          <RadioGroup {...field} row sx={{ justifyContent: 'space-between', px: 1 }}>
                            {RATING_OPTIONS.map((option) => (
                              <FormControlLabel
                                key={option.value}
                                value={option.value.toString()}
                                control={<Radio size="small" />}
                                label={
                                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{option.value}</Typography>
                                }
                                labelPlacement="bottom"
                                sx={{ m: 0 }}
                              />
                            ))}
                          </RadioGroup>
                        )}
                      />
                    </Box>
                  ))}

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Program Awareness</Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">PST Awareness</Typography>
                        <Controller
                          name="awareOfPST"
                          control={editorMethods.control}
                          render={({ field }) => (
                            <RadioGroup {...field} row>
                              <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                              <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                            </RadioGroup>
                          )}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">PLT Awareness</Typography>
                        <Controller
                          name="awareOfPLT"
                          control={editorMethods.control}
                          render={({ field }) => (
                            <RadioGroup {...field} row>
                              <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                              <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                            </RadioGroup>
                          )}
                        />
                      </Box>
                    </Stack>
                  </Box>

                  <RHFTextField
                    name="remarks"
                    label="Additional Remarks"
                    multiline
                    minRows={4}
                    placeholder="Enter any qualitative feedback or notes..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <Box sx={{ pt: 2, pb: 4 }}>
                    <Stack direction="row" spacing={2}>
                      <LoadingButton
                        type="submit"
                        variant="contained"
                        size="large"
                        loading={editorMethods.formState.isSubmitting}
                        fullWidth
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                      >
                        {editingFeedback ? "Save Changes" : "Create Entry"}
                      </LoadingButton>
                      <Button 
                        variant="outlined" 
                        size="large" 
                        onClick={handleCloseSidebar} 
                        fullWidth
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </FormProvider>
            </Box>
          </Box>
        </Drawer>
      </Container>
    </Page>
  );
};

export default FeedbackManagement;

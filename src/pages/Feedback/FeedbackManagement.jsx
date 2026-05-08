import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { alpha, useTheme } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axios";
import Page from "../../components/Page";
import logger from "../../utils/logger.js";

const roundOptions = [
  { value: 1, label: "Feedback 1" },
  { value: 2, label: "Feedback 2" },
];

const emptySummary = {
  totalCount: 0,
  roundCounts: [],
  semesterCounts: [],
};

const FeedbackManagement = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);
  const canEditWindow = user?.roleName === "admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackWindow, setFeedbackWindow] = useState(null);
  const [summary, setSummary] = useState(emptySummary);
  const [feedbacks, setFeedbacks] = useState([]);
  const [semesterFilter, setSemesterFilter] = useState("");
  const [roundFilter, setRoundFilter] = useState("all");
  const [semesterDraft, setSemesterDraft] = useState("");
  const [roundDraft, setRoundDraft] = useState(1);
  const [enabledDraft, setEnabledDraft] = useState(false);

  const loadFeedbackData = async (query = {}) => {
    setLoading(true);

    try {
      const [windowResponse, overviewResponse] = await Promise.all([
        api.get("/feedback/window"),
        api.get("/feedback/overview", { params: query }),
      ]);

      const windowData = windowResponse.data?.data?.window || null;
      const overviewData = overviewResponse.data?.data || {};

      setFeedbackWindow(windowData);
      setSummary(overviewData.summary || emptySummary);
      setFeedbacks(overviewData.feedbacks || []);

      if (!query.semester && windowData?.semester) {
        setSemesterFilter(windowData.semester);
      }

      if (!query.feedbackRound && windowData?.feedbackRound) {
        setRoundFilter(String(windowData.feedbackRound));
      }

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

  const activeSummaryCards = useMemo(() => {
    return [
      { label: "Total feedbacks", value: summary.totalCount },
      {
        label: "Feedback 1",
        value: summary.roundCounts?.find((item) => Number(item._id) === 1)?.count || 0,
      },
      {
        label: "Feedback 2",
        value: summary.roundCounts?.find((item) => Number(item._id) === 2)?.count || 0,
      },
    ];
  }, [summary]);

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
        feedbackRound: roundFilter === "all" ? "all" : roundFilter || undefined,
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
    await loadFeedbackData({
      semester: semesterFilter.trim() || undefined,
      feedbackRound: roundFilter === "all" ? "all" : roundFilter || undefined,
    });
  };

  return (
    <Page title="Feedback Management">
      <Box
        sx={{
          minHeight: "100vh",
          py: 3,
          backgroundColor: isLight
            ? alpha(theme.palette.primary.lighter, 0.35)
            : alpha(theme.palette.grey[900], 0.22),
        }}
      >
        <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1.5, sm: 2.5 } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 4,
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            }}
          >
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
                <Box>
                  <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.4 }}>
                    Feedback Control Center
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                    Semester feedback windows and response review
                  </Typography>
                </Box>
                <Chip
                  label={canEditWindow ? "Admin control enabled" : "Read-only review"}
                  color={canEditWindow ? "primary" : "default"}
                  sx={{ fontWeight: 800, ml: "auto" }}
                />
              </Stack>
              <Typography variant="body1" color="text.secondary">
                Open or close the current feedback window, then review responses by semester and round.
              </Typography>
            </Stack>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, borderRadius: 4, height: "100%" }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Active Window
                  </Typography>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Enable feedback</Typography>
                    <Switch
                      checked={enabledDraft}
                      onChange={(event) => setEnabledDraft(event.target.checked)}
                      disabled={!canEditWindow}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Semester"
                    value={semesterDraft}
                    onChange={(event) => setSemesterDraft(event.target.value)}
                    disabled={!canEditWindow}
                  />
                  <FormControl fullWidth disabled={!canEditWindow}>
                    <InputLabel>Feedback round</InputLabel>
                    <Select
                      label="Feedback round"
                      value={roundDraft}
                      onChange={(event) => setRoundDraft(Number(event.target.value))}
                    >
                      {roundOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <LoadingButton
                    variant="contained"
                    loading={saving}
                    onClick={handleSaveWindow}
                    disabled={!canEditWindow}
                  >
                    Save Window
                  </LoadingButton>
                  <Alert severity={feedbackWindow?.isEnabled ? "success" : "warning"}>
                    {feedbackWindow?.isEnabled
                      ? `Open for ${feedbackWindow.semester || "the active semester"} - ${feedbackWindow.label}`
                      : "Feedback is currently closed."}
                  </Alert>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, borderRadius: 4, mb: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Filters
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label="Semester"
                        value={semesterFilter}
                        onChange={(event) => setSemesterFilter(event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Round</InputLabel>
                        <Select
                          label="Round"
                          value={roundFilter}
                          onChange={(event) => setRoundFilter(event.target.value)}
                        >
                          <MenuItem value="all">All rounds</MenuItem>
                          {roundOptions.map((option) => (
                            <MenuItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button fullWidth variant="outlined" onClick={handleApplyFilters} disabled={loading}>
                        Apply
                      </Button>
                    </Grid>
                  </Grid>
                </Stack>
              </Card>

              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {activeSummaryCards.map((card) => (
                  <Grid item xs={12} sm={4} key={card.label}>
                    <Card sx={{ p: 2.5, borderRadius: 4, height: "100%" }}>
                      <Typography variant="body2" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
                        {card.value}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Card sx={{ p: 3, borderRadius: 4 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Responses
                  </Typography>
                  <Divider />
                  {loading ? (
                    <Typography color="text.secondary">Loading feedback data...</Typography>
                  ) : feedbacks.length === 0 ? (
                    <Alert severity="info">No feedback found for the selected filters.</Alert>
                  ) : (
                    <Stack spacing={2}>
                      {feedbacks.map((entry) => (
                        <Paper key={entry._id} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                          <Stack spacing={1.2}>
                            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {entry.userId?.name || "Unknown user"}
                              </Typography>
                              <Chip label={entry.userId?.email || "No email"} size="small" />
                              <Chip label={entry.semester} size="small" color="primary" variant="outlined" />
                              <Chip label={`Feedback ${entry.feedbackRound}`} size="small" color="secondary" variant="outlined" />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {entry.userId?.collegeCode || ""} {entry.userId?.department ? `• ${entry.userId.department}` : ""}
                            </Typography>
                            <Divider />
                            <Typography variant="body2">
                              <strong>Issues:</strong> {entry.issues || "-"}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Features:</strong> {entry.features || "-"}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Performance:</strong> {entry.performance || "-"}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Additional feedback:</strong> {entry.feedback || "-"}
                            </Typography>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Page>
  );
};

export default FeedbackManagement;

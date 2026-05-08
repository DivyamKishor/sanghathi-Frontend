import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useSnackbar } from "notistack";
import api from "../../utils/axios";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Alert,
  Box,
  Card,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FormProvider, RHFTextField } from "../../components/hook-form";
import { alpha, useTheme } from "@mui/material/styles";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";

import logger from "../../utils/logger.js";

const DEFAULT_VALUES = {
  issues: "",
  features: "",
  performance: "",
  feedback: "",
};

const roundLabel = (round) => (round ? `Feedback ${round}` : "Feedback");

export default function FeedbackForm() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("menteeId") || user?._id;

  const [isLoading, setIsLoading] = useState(true);
  const [feedbackWindow, setFeedbackWindow] = useState(null);
  const [isEditable, setIsEditable] = useState(false);

  const methods = useForm({ defaultValues: DEFAULT_VALUES });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    let mounted = true;

    const fetchFeedbackData = async () => {
      setIsLoading(true);

      try {
        const windowResponse = await api.get("/feedback/window");
        const windowData = windowResponse.data?.data?.window || null;

        if (!mounted) {
          return;
        }

        setFeedbackWindow(windowData);
        setIsEditable(Boolean(windowData?.isEnabled));

        if (targetUserId && windowData?.semester) {
          try {
            const feedbackResponse = await api.get(`/feedback/user/${targetUserId}`, {
              params: {
                semester: windowData.semester,
                feedbackRound: windowData.feedbackRound,
              },
            });
            const feedbackData = feedbackResponse.data?.data?.feedback || null;

            if (feedbackData) {
              reset({
                issues: feedbackData.issues || "",
                features: feedbackData.features || "",
                performance: feedbackData.performance || "",
                feedback: feedbackData.feedback || "",
              });
            } else {
              reset(DEFAULT_VALUES);
            }
          } catch (err) {
            if (err?.response?.status !== 404) {
              logger.error("Error fetching feedback:", err);
            }
            reset(DEFAULT_VALUES);
          }
        } else {
          reset(DEFAULT_VALUES);
        }
      } catch (err) {
        logger.error("Error fetching feedback window:", err);
        enqueueSnackbar("Unable to load feedback window", { variant: "error" });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFeedbackData();

    return () => {
      mounted = false;
    };
  }, [targetUserId, enqueueSnackbar, reset]);

  const onSubmit = async (formData) => {
    try {
      if (!targetUserId) {
        enqueueSnackbar("User ID is required", { variant: "error" });
        return;
      }

      if (!feedbackWindow?.isEnabled) {
        enqueueSnackbar("Feedback is currently disabled", { variant: "warning" });
        return;
      }

      const requestData = { ...formData, userId: targetUserId };
      const response = await api.post("/feedback", requestData);
      const savedFeedback = response.data?.data?.feedback || null;

      if (savedFeedback) {
        reset({
          issues: savedFeedback.issues || "",
          features: savedFeedback.features || "",
          performance: savedFeedback.performance || "",
          feedback: savedFeedback.feedback || "",
        });
      }

      enqueueSnackbar("Feedback saved successfully!", { variant: "success" });
    } catch (error) {
      logger.error("Error saving feedback:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred while saving feedback";
      enqueueSnackbar(errorMessage, { variant: "error" });
    }
  };

  const statusLabel = feedbackWindow?.isEnabled ? "Open" : "Closed";
  const statusSeverity = feedbackWindow?.isEnabled ? "success" : "warning";
  const windowLabel = roundLabel(feedbackWindow?.feedbackRound);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: isLight
          ? alpha(theme.palette.primary.lighter, 0.35)
          : alpha(theme.palette.grey[900], 0.22),
        py: 3,
      }}
    >
      <Box sx={{ maxWidth: 1040, mx: "auto", px: { xs: 1.5, sm: 2.5 } }}>
        <Card
          sx={{
            mb: 3,
            p: { xs: 2, sm: 3 },
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.info.main, 0.06)} 100%)`,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
              }}
            >
              <FeedbackOutlinedIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 240 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.4 }}>
                Mentee Feedback
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                Share feedback for {windowLabel}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
                Feedback is recorded sem-wise and separated into two rounds, so HOD can review the exact session they need.
              </Typography>
            </Box>
            <Chip label={statusLabel} color={statusSeverity} variant="filled" sx={{ fontWeight: 800 }} />
          </Stack>
        </Card>

        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4 }}>
                <Stack spacing={1.25}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Current Window
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} flexWrap="wrap">
                    <Chip label={feedbackWindow?.semester ? `Semester: ${feedbackWindow.semester}` : "Semester not set"} variant="outlined" />
                    <Chip label={windowLabel} variant="outlined" />
                    <Chip label={feedbackWindow?.isEnabled ? "Submission enabled" : "Submission disabled"} color={statusSeverity} variant="outlined" />
                  </Stack>
                  <Alert severity={feedbackWindow?.isEnabled ? "success" : "warning"}>
                    {feedbackWindow?.isEnabled
                      ? "You can submit feedback for the active session right now."
                      : "Feedback submission is closed. The form is shown for visibility, but saving is disabled until admin opens it."}
                  </Alert>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 800 }}>
                  Feedback
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {isLoading ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography>Loading feedback...</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <RHFTextField
                        name="issues"
                        label="Did you encounter any usability issues?"
                        fullWidth
                        disabled={!isEditable}
                        multiline
                        minRows={4}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <RHFTextField
                        name="features"
                        label="Were there any missing features you expected?"
                        fullWidth
                        disabled={!isEditable}
                        multiline
                        minRows={4}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <RHFTextField
                        name="performance"
                        label="Did you experience any performance issues?"
                        fullWidth
                        disabled={!isEditable}
                        multiline
                        minRows={4}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <RHFTextField
                        name="feedback"
                        label="Additional feedback"
                        fullWidth
                        disabled={!isEditable}
                        multiline
                        minRows={4}
                      />
                    </Grid>
                  </Grid>
                )}
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4 }}>
                <Stack spacing={2} alignItems="flex-end">
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                    disabled={!isEditable || !feedbackWindow?.isEnabled}
                  >
                    {feedbackWindow?.isEnabled ? "Save Feedback" : "Feedback Closed"}
                  </LoadingButton>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </FormProvider>
      </Box>
    </Box>
  );
}

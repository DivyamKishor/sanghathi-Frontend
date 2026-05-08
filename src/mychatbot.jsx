import React from "react";
import ChatBot from "react-chatbotify";
import { askRag } from "./apiCalls.js";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";

const DEPARTMENT_OPTIONS = [
  "Chemistry",
  "Civil Engineering",
  "CSE",
  "ECE",
  "ISE",
  "Mathematics",
  "Mechanical Engineering",
  "Physics",
  "MBA",
  "MCA",
  "AI&DS",
  "AI&ML",
];

const VTU_OPTIONS = [
  "1st Sem",
  "2nd Sem",
  "3rd Sem",
  "4th Sem",
  "5th Sem",
  "6th Sem",
  "7th Sem",
  "8th Sem",
];

const IAT_OPTIONS = ["IAT 1", "IAT 2", "IAT 3"];

const getRagResponse = async (prompt) => {
  try {
    return await askRag(prompt);
  } catch (_error) {
    return "I could not fetch that right now. Please try again in a moment.";
  }
};

const MyChatBot = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const accentColor = isLight ? theme.palette.primary.main : theme.palette.info.main;

  const chatbotStyles = {
    chatWindowStyle: {
      position: "relative",
      width: "100%",
      height: "min(78vh, 760px)",
      maxHeight: "calc(100vh - 120px)",
      borderRadius: 12,
      backgroundColor: theme.palette.background.paper,
      boxShadow: isLight
        ? "0 10px 30px rgba(15, 23, 42, 0.08)"
        : "0 10px 30px rgba(0, 0, 0, 0.25)",
      border: `1px solid ${theme.palette.divider}`,
    },
    bodyStyle: {
      backgroundColor: isLight ? theme.palette.background.default : theme.palette.background.paper,
      color: theme.palette.text.primary,
    },
    chatInputContainerStyle: {
      backgroundColor: theme.palette.background.paper,
      borderTop: `1px solid ${theme.palette.divider}`,
    },
    chatInputAreaStyle: {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
    },
    chatInputAreaFocusedStyle: {
      boxShadow: `0 0 0 2px ${alpha(accentColor, 0.16)}`,
      borderColor: accentColor,
    },
    userBubbleStyle: {
      backgroundColor: accentColor,
      color: theme.palette.common.white,
      boxShadow: `0 2px 8px ${alpha(accentColor, 0.2)}`,
    },
    botBubbleStyle: {
      backgroundColor: isLight ? theme.palette.grey[100] : theme.palette.grey[800],
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: isLight ? "0 1px 3px rgba(15, 23, 42, 0.05)" : "none",
    },
    botOptionStyle: {
      backgroundColor: isLight ? theme.palette.common.white : "rgba(20, 34, 58, 0.45)",
      color: isLight ? theme.palette.text.primary : "#d7ebff",
      borderColor: alpha(accentColor, isLight ? 0.28 : 0.6),
    },
    botOptionHoveredStyle: {
      backgroundColor: alpha(accentColor, isLight ? 0.1 : 0.24),
      color: theme.palette.text.primary,
      borderColor: alpha(accentColor, 0.95),
    },
    chatMessagePromptStyle: {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.secondary,
      border: `0.5px solid ${theme.palette.divider}`,
    },
    chatMessagePromptHoveredStyle: {
      backgroundColor: alpha(accentColor, isLight ? 0.08 : 0.18),
      color: theme.palette.text.primary,
      borderColor: accentColor,
    },
  };

  const themes = [{ id: "omen", version: "0.1.0" }];

  const helpOptions = [
    "Department Location",
    "IAT dates",
    "VTU Examinations",
    "Department HOD",
    "Other question",
  ];

  const flow = {
    ask_department_location: {
      message: "Please choose the department you want to know about:",
      options: DEPARTMENT_OPTIONS,
      path: "get_department_location",
    },
    get_department_location: {
      message: async (params) =>
        getRagResponse(
          `For CMRIT, where is the ${params.userInput} department located on campus? Reply in 2-3 sentences.`
        ),
      path: "repeat",
    },
    ask_vtu_exams: {
      message: "Please choose the VTU exam you want to know about:",
      options: VTU_OPTIONS,
      path: "get_vtu_exams",
    },
    get_vtu_exams: {
      message: async (params) =>
        getRagResponse(
          `For CMRIT students, what is the latest information available for ${params.userInput} VTU examinations?`
        ),
      path: "repeat",
    },
    ask_iat_dates: {
      message: "Please choose the IAT dates you want to know about:",
      options: IAT_OPTIONS,
      path: "get_iat_dates",
    },
    get_iat_dates: {
      message: async (params) =>
        getRagResponse(`For CMRIT, what is the date or schedule information for ${params.userInput}?`),
      path: "repeat",
    },
    ask_hod_department: {
      message: "Please choose the department to get HOD details:",
      options: DEPARTMENT_OPTIONS,
      path: "give_hod_info",
    },
    give_hod_info: {
      message: async (params) =>
        getRagResponse(
          `For CMRIT, who is the HOD of ${params.userInput}? Include name and designation if available.`
        ),
      path: "repeat",
    },
    start: {
      message: "Hi! Welcome to Sanghathi Assistant. How can I help you today?",
      transition: { duration: 1000 },
      path: "show_options",
    },
    show_options: {
      message: "Please choose from the following options:",
      options: helpOptions,
      path: "process_options",
    },
    prompt_again: {
      message: "Would you like help with anything else?",
      options: helpOptions,
      path: "process_options",
    },
    process_options: {
      transition: { duration: 0 },
      chatDisabled: true,
      path: async (params) => {
        switch (params.userInput) {
          case "Department Location":
            return "ask_department_location";
          case "IAT dates":
            return "ask_iat_dates";
          case "VTU Examinations":
            return "ask_vtu_exams";
          case "Other question":
            return "ask_gemini";
          case "Department HOD":
            return "ask_hod_department";
          default:
            return "ask_gemini";
        }
      },
    },
    ask_gemini: {
      message: "Please ask your question and I will try to help you!",
      path: "get_gemini_response",
    },
    get_gemini_response: {
      message: async (params) => getRagResponse(params.userInput),
      path: "repeat",
    },
    repeat: {
      transition: { duration: 3000 },
      path: "prompt_again",
    },
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, pt: { xs: 1, sm: 2 } }}>
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.2, sm: 1.5 },
          borderRadius: 2,
          border: `1px solid ${alpha(accentColor, 0.35)}`,
          background: isLight
            ? `linear-gradient(120deg, ${alpha(accentColor, 0.09)} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`
            : `linear-gradient(120deg, ${alpha(accentColor, 0.16)} 0%, ${alpha(theme.palette.success.main, 0.13)} 100%)`,
        }}
      >
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: alpha(theme.palette.warning.main, 0.18),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                  color: theme.palette.warning.dark,
                }}
              >
                <ConstructionRoundedIcon fontSize="medium" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Typography variant="overline" sx={{ letterSpacing: 1.6, fontWeight: 800, color: theme.palette.warning.dark }}>
                  Under Development
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1, mt: 0.25 }}>
                  Campus Buddy is not production-ready yet.
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.75, color: theme.palette.text.secondary, maxWidth: 900 }}>
                  Use it as a preview assistant for departmental guidance only. Some answers can still be incomplete while we finish the knowledge base.
                </Typography>
              </Box>
              <Chip
                label="Preview only"
                color="warning"
                variant="filled"
                sx={{ fontWeight: 800, px: 1 }}
              />
            </Stack>
            <Alert severity="warning" icon={<RocketLaunchRoundedIcon fontSize="inherit" />} sx={{ fontWeight: 600 }}>
              The chatbot is available for testing, but responses are still being refined.
            </Alert>
          </Stack>
      </Paper>

      <Alert
        severity="info"
        sx={{
          mb: 1.5,
          borderRadius: 2,
          border: `1px solid ${alpha(accentColor, 0.3)}`,
          bgcolor: alpha(accentColor, isLight ? 0.08 : 0.16),
        }}
      >
        Responses may be refined as new data and features are integrated.
      </Alert>

      <ChatBot
        themes={themes}
        styles={chatbotStyles}
        settings={{
          general: { embedded: true, showHeader: false },
          chatHistory: { storageKey: "gemini_college_assistant" },
        }}
        flow={flow}
      />
    </Box>
  );
};

export default MyChatBot;

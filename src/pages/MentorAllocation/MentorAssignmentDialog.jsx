// MentorAssignmentDialog.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Paper,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import api from "../../utils/axios";
import MentorSuggestionMenu from "./MentorSuggestionMenu";
import { AuthContext } from "../../context/AuthContext";

import logger from "../../utils/logger.js";

const getMentorDepartment = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.department;
    }
  } catch (e) {
    logger.warn("Could not get department from localStorage", e);
  }
  return null;
};

const MentorAssignmentDialog = ({ open, studentIds, onClose, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { state: authState } = useContext(AuthContext);
  const currentUser = authState?.user;
  const userDepartment = currentUser?.department || getMentorDepartment();
  
  const [selectedMentor, setSelectedMentor] = useState({ name: "" }); // Initialize with empty name
  const [anchorEl, setAnchorEl] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMentors = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const response = await api.get("/users", {
          params: {
            role: "faculty",
            page: 1,
            limit: 500,
            fields: "_id,name,email,department",
            includeProfiles: false,
          },
        });
        const { data } = response.data;
        setMentors(data.users || []);
        logger.info(`Loaded ${data.users?.length || 0} mentors for department: ${userDepartment}`);
      } catch (error) {
        logger.error("Failed to fetch mentors:", error);
        enqueueSnackbar("Failed to load mentors", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [open, userDepartment, enqueueSnackbar]);

  const handleMentorNameChange = (event) => {
    const value = event.target.value;
    setSelectedMentor({ ...selectedMentor, name: value });
    
    if (value.trim() !== "") {
      // Updated filter to search anywhere in the name
      setSuggestions(
        mentors.filter((mentor) =>
          mentor.name.toLowerCase().includes(value.toLowerCase())
        )
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSave = async () => {
    try {
      const response = await api.post("/mentors/batch", {
        mentorId: selectedMentor._id,
        menteeIds: studentIds,
        startDate: new Date().toISOString(),
      });

      // Call onSuccess with the updated data
      onSuccess && onSuccess({
        mentorId: selectedMentor._id,
        mentorName: selectedMentor.name,
        affectedStudentIds: studentIds
      });

      handleCancel();
    } catch (error) {
      logger.error("Error assigning mentor:", error);
      enqueueSnackbar("Failed to assign mentor", { variant: "error" });
    }
  };

  const handleCancel = () => {
    setSelectedMentor({ name: "" });
    setSuggestions([]);
    setAnchorEl(null);
    onClose();
  };

  const handleMentorSelect = (mentor) => {
    setSelectedMentor(mentor);
    setSuggestions([]);
    setAnchorEl(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="mentor-dialog-title"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'relative',
          minHeight: '400px'
        }
      }}
    >
      <DialogTitle id="mentor-dialog-title">
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Assign Mentor to {studentIds.length} Selected Student(s)
          </Typography>
          {userDepartment && (
            <Chip
              label={`${userDepartment} Mentors`}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative', pt: 2 }}>
          {loading && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Loading mentors for {userDepartment} department...
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Search Mentor"
            type="text"
            fullWidth
            value={selectedMentor.name || ""}
            onChange={handleMentorNameChange}
            disabled={loading}
            placeholder={`Search from ${mentors.length} ${userDepartment} mentors...`}
          />
          {suggestions.length > 0 && (
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                top: 'calc(100% + 50px)',
                left: 0,
                right: 0,
                zIndex: 1000,
                maxHeight: '250px',
                overflow: 'auto',
                borderRadius: 1,
                boxShadow: (theme) => theme.shadows[5]
              }}
            >
              <MentorSuggestionMenu 
                suggestions={suggestions}
                onMentorSelect={handleMentorSelect}
              />
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!selectedMentor._id || loading}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MentorAssignmentDialog;
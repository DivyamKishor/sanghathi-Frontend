import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import useMenteesData from "../../hooks/useMenteesData";
import Page from "../../components/Page";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";

const FacultySwotAnalysis = () => {
  const { user } = useContext(AuthContext);
  const mentorId = user?._id;
  const { mentees, loading, error } = useMenteesData(mentorId, {
    enabled: Boolean(mentorId),
  });

  if (!user) {
    return (
      <Page title="SWOT Analysis">
        <Typography color="error">User not authenticated.</Typography>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page title="SWOT Analysis">
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="SWOT Analysis">
        <Alert severity="error">{error}</Alert>
      </Page>
    );
  }

  if (mentees.length === 0) {
    return (
      <Page title="SWOT Analysis">
        <Alert severity="info">No mentees allotted. Cannot generate SWOT analysis.</Alert>
      </Page>
    );
  }

  // Construct query parameters for the streamlit app
  const token = localStorage.getItem("token");
  const swotAppUrl = `http://localhost:8501/?mentor_id=${mentorId}&token=${token || ""}`;

  return (
    <Page title="SWOT Analysis">
      <Box sx={{ height: "calc(100vh - 80px)", width: "100%", overflow: "hidden" }}>
        <iframe
          src={swotAppUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="SWOT Analysis App"
        />
      </Box>
    </Page>
  );
};

export default FacultySwotAnalysis;

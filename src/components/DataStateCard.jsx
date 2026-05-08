import PropTypes from "prop-types";
import { Alert, Box, Paper, Typography } from "@mui/material";

export default function DataStateCard({
  title,
  message,
  severity = "info",
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: "background.paper",
        borderStyle: "dashed",
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Alert severity={severity} sx={{ justifyContent: "center" }}>
          {message}
        </Alert>
      </Box>
    </Paper>
  );
}

DataStateCard.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  severity: PropTypes.oneOf(["info", "warning", "error", "success"]),
};
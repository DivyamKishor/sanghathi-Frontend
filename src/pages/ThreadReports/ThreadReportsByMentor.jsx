import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Button,
  useTheme,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Stack,
  Chip,
  alpha,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  MessageRounded as MessageRoundedIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import Page from "../../components/Page";
import api from "../../utils/axios";
import { AuthContext } from "../../context/AuthContext";
import { getAvatarSrc, getAvatarFallbackText } from "../../utils/avatarResolver";
import { Link } from "react-router-dom";
import { Grid } from "@mui/material";

const ThreadReportsByMentor = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const navigate = useNavigate();
  const { mentorId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);

  const [mentees, setMentees] = useState([]);
  const [mentorInfo, setMentorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");


  // Fetch mentor info
  useEffect(() => {
    const fetchMentorInfo = async () => {
      try {
        const response = await api.get(`/users/${mentorId}`);
        setMentorInfo(response.data.data.user);
      } catch (error) {
        console.error("Error fetching mentor info:", error);
        enqueueSnackbar("Failed to load mentor information", { variant: "error" });
      }
    };

    fetchMentorInfo();
  }, [mentorId, enqueueSnackbar]);

  // Fetch mentees data
  useEffect(() => {
    const fetchMentees = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/mentors/${mentorId}/mentees-with-profiles`);
        
        const menteesData = response.data.mentees || response.data.data?.mentees || [];
        setMentees(Array.isArray(menteesData) ? menteesData : []);
      } catch (error) {
        console.error("Error fetching mentees:", error);
        enqueueSnackbar("Failed to load mentees", { variant: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    if (mentorId) {
      fetchMentees();
    }
  }, [mentorId, enqueueSnackbar]);

  // Filter mentees
  const filteredMentees = mentees.filter((mentee) => {
    const searchMatch =
      (mentee?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (mentee?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mentee?.profile?.usn || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mentee?.registrationNumber || "").toLowerCase().includes(searchTerm.toLowerCase());

    const semesterMatch =
      !semesterFilter || (mentee?.profile?.sem || "").toString() === semesterFilter;

    return searchMatch && semesterMatch;
  });

  const handleMenteeClick = (menteeId) => {
    navigate(`/hod/thread-reports/${mentorId}/${menteeId}`);
  };

  return (
    <Page title={`Thread Reports - ${mentorInfo?.name || "Mentor"}`}>
      <Box
        sx={{
          pt: 3,
          pb: 5,
          backgroundColor: isLight
            ? alpha(theme.palette.primary.lighter, 0.4)
            : alpha(theme.palette.grey[900], 0.2),
          minHeight: "100vh",
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 0 } }}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              mb: 4,
              borderRadius: 3,
              backgroundColor: isLight
                ? "rgba(255, 255, 255, 0.9)"
                : alpha(theme.palette.background.paper, 0.7),
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(
                isLight ? theme.palette.primary.main : theme.palette.info.main,
                0.1
              )}`,
            }}
          >
            <Stack spacing={2}>
              {/* Breadcrumbs */}
              <Breadcrumbs sx={{ mb: 1 }}>
                <MuiLink
                  component={Link}
                  to="/hod/thread-reports"
                  underline="hover"
                  color="inherit"
                  sx={{ cursor: "pointer" }}
                >
                  Thread Reports
                </MuiLink>
                <Typography color="text.primary">
                  {mentorInfo?.name || "Mentor"}
                </Typography>
              </Breadcrumbs>

              {/* Title */}
              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Avatar
                    src={getAvatarSrc(mentorInfo) || undefined}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: isLight
                        ? theme.palette.primary.main
                        : theme.palette.info.main,
                    }}
                  >
                    {!getAvatarSrc(mentorInfo)
                      ? getAvatarFallbackText(mentorInfo?.name)
                      : null}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {mentorInfo?.name}'s Mentees
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mentorInfo?.email || "N/A"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Filters */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search mentee name, email, or reg number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Semester"
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                  >
                    <MenuItem value="">All Semesters</MenuItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <MenuItem key={sem} value={sem.toString()}>
                        Sem {sem}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/hod/thread-reports")}
            sx={{ mb: 3 }}
            variant="outlined"
          >
            Back to Mentors
          </Button>

          {/* Content */}
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
              }}
            >
              <CircularProgress />
            </Box>
          ) : filteredMentees.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                backgroundColor: isLight
                  ? "rgba(255, 255, 255, 0.8)"
                  : alpha(theme.palette.background.paper, 0.7),
              }}
            >
              <Table>
                <TableHead
                  sx={{
                    backgroundColor: isLight
                      ? alpha(theme.palette.primary.main, 0.08)
                      : alpha(theme.palette.info.main, 0.1),
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Mentee</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>USN</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      Semester
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      Threads
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMentees.map((mentee) => (
                    <TableRow
                      key={mentee._id}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: isLight
                            ? alpha(theme.palette.primary.main, 0.04)
                            : alpha(theme.palette.info.main, 0.08),
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            src={getAvatarSrc(mentee) || undefined}
                            sx={{
                              width: 32,
                              height: 32,
                              mr: 1,
                              bgcolor: isLight
                                ? theme.palette.primary.main
                                : theme.palette.info.main,
                              fontSize: "0.75rem",
                            }}
                          >
                            {!getAvatarSrc(mentee)
                              ? getAvatarFallbackText(mentee?.name)
                              : null}
                          </Avatar>
                          <Typography variant="body2">
                            {mentee?.name || "N/A"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {mentee?.email || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {mentee?.profile?.usn || mentee?.registrationNumber || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`Sem ${mentee?.profile?.sem || "N/A"}`}
                          size="small"
                          sx={{
                            backgroundColor: isLight
                              ? alpha(theme.palette.primary.main, 0.1)
                              : alpha(theme.palette.info.main, 0.15),
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<MessageRoundedIcon />}
                          label={mentee.threadCount || 0}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleMenteeClick(mentee._id)}
                          color={isLight ? "primary" : "info"}
                        >
                          View Threads
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 2,
                backgroundColor: isLight
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.info.main, 0.1),
                border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
              }}
            >
              <SchoolIcon
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No mentees found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || semesterFilter
                  ? "Try adjusting your filters"
                  : "No mentees assigned to this mentor"}
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
    </Page>
  );
};

// No additional imports needed

export default ThreadReportsByMentor;

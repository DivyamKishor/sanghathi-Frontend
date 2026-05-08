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
  AvatarGroup,
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
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  MessageRounded as MessageRoundedIcon,
  CalendarToday as CalendarTodayIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import Page from "../../components/Page";
import api from "../../utils/axios";
import { AuthContext } from "../../context/AuthContext";
import { getAvatarSrc, getAvatarFallbackText } from "../../utils/avatarResolver";
import { Link } from "react-router-dom";
import { MessageList } from "../Thread/Message/Message";

const ThreadReportsByStudent = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const navigate = useNavigate();
  const { mentorId, studentId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);

  const [threads, setThreads] = useState([]);
  const [mentorInfo, setMentorInfo] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [openThreadDialog, setOpenThreadDialog] = useState(false);
  const [selectedThreadMessages, setSelectedThreadMessages] = useState([]);
  const [selectedThreadData, setSelectedThreadData] = useState(null);

  // Fetch mentor and student info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const [mentorRes, studentRes] = await Promise.all([
          api.get(`/users/${mentorId}`),
          api.get(`/users/${studentId}`),
        ]);
        setMentorInfo(mentorRes.data.data.user);
        setStudentInfo(studentRes.data.data.user);
      } catch (error) {
        console.error("Error fetching user info:", error);
        enqueueSnackbar("Failed to load user information", { variant: "error" });
      }
    };

    fetchUserInfo();
  }, [mentorId, studentId, enqueueSnackbar]);

  // Fetch threads
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/threads`, {
          params: {
            participantIds: [mentorId, studentId],
          },
        });

        const threadsData = response.data.data?.threads || [];
        setThreads(Array.isArray(threadsData) ? threadsData : []);
      } catch (error) {
        console.error("Error fetching threads:", error);
        enqueueSnackbar("Failed to load threads", { variant: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    if (mentorId && studentId) {
      fetchThreads();
    }
  }, [mentorId, studentId, enqueueSnackbar]);

  // Filter threads
  const filteredThreads = threads.filter((thread) => {
    const searchMatch =
      (thread?.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (thread?.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const statusMatch = !statusFilter || thread?.status === statusFilter;
    const categoryMatch = !categoryFilter || thread?.topic === categoryFilter;

    const threadDate = new Date(thread?.createdAt);
    const fromDate = dateFromFilter ? new Date(dateFromFilter) : null;
    const toDate = dateToFilter ? new Date(dateToFilter) : null;

    const dateMatch =
      (!fromDate || threadDate >= fromDate) &&
      (!toDate || threadDate <= toDate);

    return searchMatch && statusMatch && categoryMatch && dateMatch;
  });

  // Get unique categories
  const categories = [
    ...new Set(threads.map((t) => t?.topic).filter(Boolean)),
  ];

  const handleViewThread = async (thread) => {
    try {
      const response = await api.get(`/threads/${thread._id}`);
      const threadData = response.data.data.thread;
      setSelectedThreadData(threadData);
      setSelectedThreadMessages(threadData.messages || []);
      setOpenThreadDialog(true);
    } catch (error) {
      console.error("Error fetching thread details:", error);
      enqueueSnackbar("Failed to load thread details", { variant: "error" });
    }
  };

  const handleCloseThreadDialog = () => {
    setOpenThreadDialog(false);
    setSelectedThreadMessages([]);
    setSelectedThreadData(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "#4caf50";
      case "closed":
        return "#f44336";
      case "in progress":
        return "#ff9800";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <Page title={`Threads - ${studentInfo?.name || "Student"}`}>
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
                <MuiLink
                  component={Link}
                  to={`/hod/thread-reports/${mentorId}`}
                  underline="hover"
                  color="inherit"
                  sx={{ cursor: "pointer" }}
                >
                  {mentorInfo?.name || "Mentor"}
                </MuiLink>
                <Typography color="text.primary">
                  {studentInfo?.name || "Student"}
                </Typography>
              </Breadcrumbs>

              {/* Title with avatars */}
              <Box>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AvatarGroup max={2}>
                      <Avatar
                        src={getAvatarSrc(mentorInfo) || undefined}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: isLight
                            ? theme.palette.primary.main
                            : theme.palette.info.main,
                        }}
                      >
                        {!getAvatarSrc(mentorInfo)
                          ? getAvatarFallbackText(mentorInfo?.name)
                          : null}
                      </Avatar>
                      <Avatar
                        src={getAvatarSrc(studentInfo) || undefined}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: isLight
                            ? theme.palette.primary.main
                            : theme.palette.info.main,
                        }}
                      >
                        {!getAvatarSrc(studentInfo)
                          ? getAvatarFallbackText(studentInfo?.name)
                          : null}
                      </Avatar>
                    </AvatarGroup>
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                        }}
                      >
                        Threads Between Mentor & Mentee
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {mentorInfo?.name} & {studentInfo?.name} {studentInfo?.profile?.usn ? `(${studentInfo.profile.usn})` : studentInfo?.registrationNumber ? `(${studentInfo.registrationNumber})` : ""}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>

              {/* Filters */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search threads..."
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

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                    <MenuItem value="in progress">In Progress</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat || "Uncategorized"}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="From Date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="To Date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/hod/thread-reports/${mentorId}`)}
            sx={{ mb: 3 }}
            variant="outlined"
          >
            Back to Mentees
          </Button>

          {/* Threads Table */}
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
          ) : filteredThreads.length > 0 ? (
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
                    <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      Messages
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredThreads.map((thread) => (
                    <TableRow
                      key={thread._id}
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
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, maxWidth: 200 }}
                          noWrap
                        >
                          {thread?.title || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={thread?.topic || "Uncategorized"}
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
                          label={thread?.status || "N/A"}
                          size="small"
                          sx={{
                            backgroundColor: alpha(getStatusColor(thread?.status), 0.2),
                            color: getStatusColor(thread?.status),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(thread?.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<MessageRoundedIcon />}
                          label={thread?.messageCount || 0}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleViewThread(thread)}
                          color={isLight ? "primary" : "info"}
                        >
                          View
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
              <MessageRoundedIcon
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No threads found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ||
                statusFilter ||
                categoryFilter ||
                dateFromFilter ||
                dateToFilter
                  ? "Try adjusting your filters"
                  : "No threads between this mentor and mentee"}
              </Typography>
            </Paper>
          )}

          {/* Thread Details Dialog */}
          <Dialog
            open={openThreadDialog}
            onClose={handleCloseThreadDialog}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                height: "80vh",
                display: "flex",
                flexDirection: "column"
              }
            }}
          >
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              }}
            >
              <Box>
                <Typography variant="h6">
                  {selectedThreadData?.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedThreadData?.topic}
                </Typography>
              </Box>
              <Button
                startIcon={<CloseIcon />}
                onClick={handleCloseThreadDialog}
                variant="text"
              >
                Close
              </Button>
            </DialogTitle>
            <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {selectedThreadData && (
                <MessageList 
                  conversation={selectedThreadData} 
                  messages={selectedThreadMessages} 
                />
              )}
            </DialogContent>
          </Dialog>
        </Container>
      </Box>
    </Page>
  );
};

export default ThreadReportsByStudent;

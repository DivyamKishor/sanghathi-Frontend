import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  AvatarGroup,
  useTheme,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Stack,
  Chip,
  alpha,
} from "@mui/material";
import {
  Search as SearchIcon,
  People as PeopleIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import Page from "../../components/Page";
import api from "../../utils/axios";
import { AuthContext } from "../../context/AuthContext";
import { getAvatarSrc, getAvatarFallbackText } from "../../utils/avatarResolver";

const ThreadReports = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);

  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentScope, setDepartmentScope] = useState(
    user?.department || user?.facultyProfile?.department || ""
  );

  const getDepartmentValue = (item) =>
    item?.department?.name ||
    item?.department ||
    item?.profile?.department ||
    item?.studentProfile?.department ||
    item?.facultyProfile?.department ||
    item?.departmentName ||
    "";

  useEffect(() => {
    const resolveDepartmentScope = async () => {
      if (!user?._id) {
        setDepartmentScope("");
        return;
      }

      const existingDepartment =
        user?.department || user?.facultyProfile?.department || "";
      if (existingDepartment) {
        setDepartmentScope(existingDepartment);
        return;
      }

      try {
        const response = await api.get(`/users/${user._id}`, {
          params: { includeProfiles: true },
        });
        const resolvedUser = response.data?.data?.user || {};
        setDepartmentScope(
          resolvedUser.department ||
            resolvedUser.facultyProfile?.department ||
            resolvedUser.studentProfile?.department ||
            ""
        );
      } catch (error) {
        logger.error("Unable to resolve department scope for thread reports:", error);
        setDepartmentScope("");
      }
    };

    resolveDepartmentScope();
  }, [user?._id, user?.department, user?.facultyProfile?.department]);

  // Fetch mentors data
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setIsLoading(true);

        if (user?.roleName === "faculty") {
          const facultyMentor = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar || user.photo || null,
            department: user.department || null,
          };

          setMentors([facultyMentor]);
          setDepartments(user.department ? [user.department] : []);
          return;
        }

        const endpoint = "/users?role=faculty";

        const response = await api.get(endpoint);
        const mentorsData = response.data.data.mentors || response.data.data.users || response.data.data;

        const normalizedMentors = Array.isArray(mentorsData) ? mentorsData : [];
        const scopedMentors =
          user?.roleName === "hod" || user?.roleName === "director"
            ? normalizedMentors.filter((mentor) => {
                if (!departmentScope) {
                  return true;
                }
                return getDepartmentValue(mentor) === departmentScope;
              })
            : normalizedMentors;

        setMentors(scopedMentors);

        const uniqueDepartments = [
          ...new Set(
            scopedMentors
              .map((m) => getDepartmentValue(m))
              .filter(Boolean)
          ),
        ];
        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error("Error fetching mentors:", error);
        enqueueSnackbar("Failed to load mentors", { variant: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, [user, enqueueSnackbar, departmentScope]);

  // Filter mentors
  const filteredMentors = mentors.filter((mentor) => {
    const searchMatch =
      (mentor?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (mentor?.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const departmentMatch =
      !departmentFilter ||
      (mentor?.department?.name || mentor?.department) === departmentFilter;

    return searchMatch && departmentMatch;
  });

  const handleMentorClick = (mentorId) => {
    navigate(`/hod/thread-reports/${mentorId}`);
  };

  const MentorCard = ({ mentor }) => {
    const avatarSrc = getAvatarSrc(mentor);

    return (
      <Card
        sx={{
          transition: "all 0.3s ease",
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: isLight
              ? "0 12px 24px rgba(0,0,0,0.1)"
              : "0 12px 24px rgba(0,0,0,0.3)",
          },
          height: "100%",
          backgroundColor: isLight
            ? alpha(theme.palette.primary.main, 0.02)
            : alpha(theme.palette.info.main, 0.05),
        }}
      >
        <CardActionArea onClick={() => handleMentorClick(mentor._id)}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar
                src={avatarSrc || undefined}
                sx={{
                  width: 56,
                  height: 56,
                  mr: 2,
                  bgcolor: isLight
                    ? theme.palette.primary.main
                    : theme.palette.info.main,
                  fontSize: "1.5rem",
                }}
              >
                {!avatarSrc ? getAvatarFallbackText(mentor?.name) : null}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {mentor?.name || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mentor?.email || "N/A"}
                </Typography>
              </Box>
            </Box>

            {mentor?.department && (
              <Box sx={{ mb: 1 }}>
                <Chip
                  label={mentor?.department?.name || mentor?.department}
                  size="small"
                  sx={{
                    backgroundColor: isLight
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.info.main, 0.15),
                    color: isLight
                      ? theme.palette.primary.main
                      : theme.palette.info.main,
                  }}
                />
              </Box>
            )}

            <Typography variant="caption" color="text.secondary">
              Click to view mentees and threads
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  return (
    <Page title="Thread Reports">
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
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    color: theme.palette.text.primary,
                  }}
                >
                  Thread Reports
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Select a mentor to view their mentees and threads
                </Typography>
              </Box>

              {/* Filters */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search mentor, email, or mentee..."
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

                {departments.length > 0 && (
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Department"
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                    >
                      <MenuItem value="">All Departments</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
              </Grid>
            </Stack>
          </Paper>

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
          ) : filteredMentors.length > 0 ? (
            <Grid container spacing={3}>
              {filteredMentors.map((mentor) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={mentor._id}>
                  <MentorCard mentor={mentor} />
                </Grid>
              ))}
            </Grid>
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
              <PeopleIcon
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No mentors found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || departmentFilter
                  ? "Try adjusting your filters"
                  : "No mentors available"}
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
    </Page>
  );
};

export default ThreadReports;

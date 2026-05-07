import { useCallback, useEffect, useMemo, useState } from "react";
// Admin Upload History Component
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Autorenew as RestoreIcon,
  InfoOutlined as DetailsIcon,
  Refresh as RefreshIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import Page from "../../components/Page";
import {
  listAdminUploadSessions,
  previewAdminUploadRestore,
  restoreAdminUploadSession,
} from "../../utils/uploadHistory";

const TAB_LABELS = {
  "add-users": "Add Users",
  "add-attendance": "Add Attendance",
  "add-iat-marks": "Add IAT Marks",
  "add-external-marks": "Add External Marks",
  "add-tyl-marks": "Add TYL Marks",
  "add-mooc-details": "Add MOOC Details",
  "add-mini-project-details": "Add Mini Project Details",
};

const STATUS_COLORS = {
  success: "success",
  partial: "warning",
  failed: "error",
  restored: "info",
  "restore-failed": "error",
};

const SOURCE_LABELS = {
  "dashboard-ui": "Admin Dashboard",
  "local-script": "Local Script",
  api: "API",
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return format(date, "dd MMM yyyy, hh:mm a");
};

const renderPreviewRows = (preview) => {
  if (!preview) {
    return [];
  }

  const entries = Object.entries(preview).filter(([key]) => key !== "tabType");
  return entries.map(([key, value]) => ({ key, value }));
};

const toUserLabel = (user) => {
  if (!user || typeof user !== "object") {
    return "System";
  }

  if (user.name && user.email) {
    return `${user.name} (${user.email})`;
  }

  return user.name || user.email || "System";
};

const prettySource = (source) => SOURCE_LABELS[source] || source || "Unknown";

const formatJson = (value) => {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return "{}";
  }
};

export default function UploadHistory() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsSession, setDetailsSession] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tabFilter, setTabFilter] = useState("all");
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [sessionToRestore, setSessionToRestore] = useState(null);
  const [restoreConfirmationText, setRestoreConfirmationText] = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { limit: 100 };
      if (sourceFilter !== "all") {
        params.source = sourceFilter;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (tabFilter !== "all") {
        params.tabType = tabFilter;
      }

      const { sessions: nextSessions } = await listAdminUploadSessions(params);
      setSessions(nextSessions);
    } catch (loadError) {
      setError(loadError?.message || "Failed to load upload history.");
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, statusFilter, tabFilter]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const summary = useMemo(
    () =>
      sessions.reduce(
        (accumulator, session) => {
          accumulator.total += 1;
          accumulator.success += session.status === "success" ? 1 : 0;
          accumulator.partial += session.status === "partial" ? 1 : 0;
          accumulator.failed += session.status === "failed" ? 1 : 0;
          accumulator.restored += session.status === "restored" ? 1 : 0;
          return accumulator;
        },
        { total: 0, success: 0, partial: 0, failed: 0, restored: 0 }
      ),
    [sessions]
  );

  const selectedSessionLabel = useMemo(
    () => TAB_LABELS[selectedSession?.tabType] || selectedSession?.tabType || "Upload",
    [selectedSession]
  );

  const openDetails = (session) => {
    setDetailsSession(session);
    setDetailsDialogOpen(true);
  };

  const closeDetails = () => {
    setDetailsSession(null);
    setDetailsDialogOpen(false);
  };

  const openPreview = async (session) => {
    setSelectedSession(session);
    setPreviewDialogOpen(true);
    setPreviewData(null);
    setPreviewLoading(true);

    try {
      const preview = await previewAdminUploadRestore(session._id);
      setPreviewData(preview);
    } catch (previewError) {
      setPreviewData({
        tabType: session?.tabType,
        error: previewError?.message || "Unable to generate restore preview.",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewDialogOpen(false);
    setSelectedSession(null);
    setPreviewData(null);
  };

  const handleRestore = async (session) => {
    setSessionToRestore(session);
    setRestoreConfirmationText("");
    setConfirmRestoreOpen(true);
  };

  const confirmRestore = async () => {
    if (restoreConfirmationText !== "RESTORE") {
      return;
    }

    const sessionId = sessionToRestore._id;
    setConfirmRestoreOpen(false);
    setRestoringId(sessionId);
    
    try {
      await restoreAdminUploadSession(sessionId);
      await loadSessions();
    } catch (restoreError) {
      setError(restoreError?.message || "Restore failed. Please try again.");
    } finally {
      setRestoringId(null);
      setSessionToRestore(null);
    }
  };

  return (
    <Page title="Admin: Upload History">
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            backgroundColor: isLight
              ? "rgba(255, 255, 255, 0.85)"
              : alpha(theme.palette.background.paper, 0.88),
            backdropFilter: "blur(8px)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Upload History
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track bulk uploads and restore a bad upload session safely.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadSessions}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Total Sessions", value: summary.total, color: theme.palette.primary.main, icon: <DetailsIcon /> },
              { label: "Success", value: summary.success, color: theme.palette.success.main, icon: <PreviewIcon /> },
              { label: "Partial", value: summary.partial, color: theme.palette.warning.main, icon: <RefreshIcon /> },
              { label: "Failed", value: summary.failed, color: theme.palette.error.main, icon: <PreviewIcon /> },
              { label: "Restored", value: summary.restored, color: theme.palette.info.main, icon: <RestoreIcon /> },
            ].map((item) => (
              <Grid key={item.label} item xs={12} sm={6} md={2.4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: alpha(item.color, 0.2),
                    backgroundColor: alpha(item.color, 0.04),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    backgroundColor: alpha(item.color, 0.1),
                    color: item.color,
                    display: 'flex'
                  }}>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Stack 
            direction={{ xs: "column", md: "row" }} 
            spacing={1.25} 
            sx={{ 
              mb: 3, 
              p: 1.5, 
              backgroundColor: alpha(theme.palette.text.primary, 0.02),
              borderRadius: 1.5,
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, ml: 0.5, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Filter By Source
              </Typography>
              <Select
                size="small"
                fullWidth
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <MenuItem value="all">All Sources</MenuItem>
                <MenuItem value="dashboard-ui">Admin Dashboard</MenuItem>
                <MenuItem value="local-script">Local Script</MenuItem>
                <MenuItem value="api">API</MenuItem>
              </Select>
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, ml: 0.5, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Filter By Status
              </Typography>
              <Select
                size="small"
                fullWidth
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="restored">Restored</MenuItem>
              </Select>
            </Box>

            <Box sx={{ flexGrow: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, ml: 0.5, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Filter By Category
              </Typography>
              <Select
                size="small"
                fullWidth
                value={tabFilter}
                onChange={(event) => setTabFilter(event.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {Object.entries(TAB_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : sessions.length === 0 ? (
            <Alert severity="info">No uploads recorded yet.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Uploaded By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rows</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Results</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => {
                    const label = TAB_LABELS[session.tabType] || session.tabType;
                    const statusColor = STATUS_COLORS[session.status] || "default";

                    return (
                      <TableRow key={session._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDateTime(session.createdAt)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={prettySource(session.source)} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                        </TableCell>
                        <TableCell>{label}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{session.adminUserId?.name || "System"}</Typography>
                          <Typography variant="caption" color="text.secondary">{session.adminUserId?.email || ""}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{session.totalRows || 0} rows</Typography>
                          <Typography variant="caption" color="text.secondary">{session.fileName || "No file"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Success">
                              <Chip label={session.successCount || 0} size="small" color="success" variant="outlined" />
                            </Tooltip>
                            <Tooltip title="Errors">
                              <Chip label={session.errorCount || 0} size="small" color="error" variant="outlined" />
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={session.status?.toUpperCase() || "UNKNOWN"}
                            color={statusColor}
                            sx={{ fontWeight: 700, borderRadius: 1 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton color="info" size="small" onClick={() => openDetails(session)}>
                              <DetailsIcon fontSize="small" />
                            </IconButton>
                            <IconButton color="primary" size="small" onClick={() => openPreview(session)}>
                              <PreviewIcon fontSize="small" />
                            </IconButton>
                            <Button
                              size="small"
                              color="warning"
                              variant={session.restored ? "outlined" : "contained"}
                              startIcon={<RestoreIcon />}
                              disabled={session.restored || restoringId === session._id}
                              onClick={() => handleRestore(session)}
                              sx={{ minWidth: 100 }}
                            >
                              {session.restored ? "Restored" : restoringId === session._id ? "..." : "Restore"}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      <Dialog open={previewDialogOpen} onClose={closePreview} fullWidth maxWidth="sm">
        <DialogTitle>Restore Preview: {selectedSessionLabel}</DialogTitle>
        <DialogContent dividers>
          {previewLoading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : previewData?.error ? (
            <Alert severity="error">{previewData.error}</Alert>
          ) : (
            <Stack spacing={1.25}>
              {renderPreviewRows(previewData).map(({ key, value }) => (
                <Stack key={key} direction="row" justifyContent="space-between" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                    {key.replace(/([A-Z])/g, " $1")}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {Array.isArray(value) ? value.length : String(value)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
          <Button
            color="warning"
            variant="contained"
            startIcon={<RestoreIcon />}
            disabled={!selectedSession || selectedSession?.restored || previewLoading}
            onClick={() => selectedSession && handleRestore(selectedSession)}
          >
            Restore Session
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailsDialogOpen} onClose={closeDetails} fullWidth maxWidth="md">
        <DialogTitle>Ingest Details</DialogTitle>
        <DialogContent dividers>
          {!detailsSession ? (
            <Typography variant="body2" color="text.secondary">
              No session selected.
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Grid container spacing={1.25}>
                {[
                  ["Tab", TAB_LABELS[detailsSession.tabType] || detailsSession.tabType || "-"],
                  ["Source", prettySource(detailsSession.source)],
                  ["Uploaded By", toUserLabel(detailsSession.adminUserId)],
                  ["Uploaded On", formatDateTime(detailsSession.createdAt)],
                  ["File", detailsSession.fileName || "-"],
                  ["Status", detailsSession.status || "unknown"],
                  ["Total Rows", detailsSession.totalRows || 0],
                  ["Success Count", detailsSession.successCount || 0],
                  ["Error Count", detailsSession.errorCount || 0],
                  ["Affected Users", detailsSession.affectedUserIds?.length || 0],
                  ["Created Users", detailsSession.createdUserIds?.length || 0],
                  [
                    "Restored By",
                    detailsSession.restoredBy ? toUserLabel(detailsSession.restoredBy) : "-",
                  ],
                ].map(([label, value]) => (
                  <Grid key={label} item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {String(value)}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Errors ({detailsSession.errors?.length || 0})
                </Typography>
                {detailsSession.errors?.length ? (
                  <Stack spacing={0.75}>
                    {detailsSession.errors.slice(0, 30).map((entry, index) => (
                      <Typography key={`${index}-${entry}`} variant="body2" color="error.main">
                        {`• ${entry}`}
                      </Typography>
                    ))}
                    {detailsSession.errors.length > 30 ? (
                      <Typography variant="caption" color="text.secondary">
                        {`Showing first 30 of ${detailsSession.errors.length} errors.`}
                      </Typography>
                    ) : null}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No errors recorded.
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Metadata
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.background.default, 0.65),
                    overflowX: "auto",
                    fontSize: 12,
                  }}
                >
                  {formatJson(detailsSession.metadata)}
                </Box>
              </Box>

              {detailsSession.restoreSummary ? (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Restore Summary
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1.5,
                        borderRadius: 1.5,
                        backgroundColor: alpha(theme.palette.background.default, 0.65),
                        overflowX: "auto",
                        fontSize: 12,
                      }}
                    >
                      {formatJson(detailsSession.restoreSummary)}
                    </Box>
                  </Box>
                </>
              ) : null}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmRestoreOpen} onClose={() => setConfirmRestoreOpen(false)}>
        <DialogTitle>Confirm Restoration</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            You are about to restore the upload session from <strong>{sessionToRestore && formatDateTime(sessionToRestore.createdAt)}</strong>.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: 600 }}>
            This will delete all records created or updated during this session. This action cannot be undone.
          </Typography>
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 1, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2) }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              To confirm, please type <strong>RESTORE</strong> below:
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Type RESTORE here"
              value={restoreConfirmationText}
              onChange={(e) => setRestoreConfirmationText(e.target.value)}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRestoreOpen(false)}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained" 
            disabled={restoreConfirmationText !== "RESTORE"}
            onClick={confirmRestore}
          >
            Confirm Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}

import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  TablePagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Page from "../../components/Page";
import api from "../../utils/axios";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import logger from "../../utils/logger.js";

export default function ViewMentors() {
  const { state: authState } = useContext(AuthContext);
  const currentUser = authState?.user;
  
  // Fallback to localStorage if context not available
  const userDepartment = currentUser?.department || (() => {
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
  })();
  
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchMentors();
  }, [page, rowsPerPage, searchQuery]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const params = {
        role: "faculty",
        page: page + 1,
        limit: rowsPerPage,
        fields: "_id,name,email,department,phone,avatar",
        includeProfiles: true,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery;
      }

      const response = await api.get("/users", { params });
      const { data } = response.data;

      setMentors(data.users || []);
      setTotal(data.totalRecords || 0);
    } catch (error) {
      logger.error("Failed to fetch mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  return (
    <Page title="View Mentors">
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          {/* Header */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Mentors Directory
                  </Typography>
                  <Chip
                    label={`${userDepartment || "All"}`}
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
                <TextField
                  fullWidth
                  placeholder="Search by name, email, or department..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="body2" color="textSecondary">
                  Total Mentors: <strong>{total}</strong>
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Mentors Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography>Loading mentors...</Typography>
                    </TableCell>
                  </TableRow>
                ) : mentors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">No mentors found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  mentors.map((mentor) => (
                    <TableRow key={mentor._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {mentor.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{mentor.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={mentor.department || "N/A"}
                          size="small"
                          variant="outlined"
                          color={mentor.department === userDepartment ? "primary" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{mentor.phone || "N/A"}</Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {mentors.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )}
          </TableContainer>
        </Stack>
      </Container>
    </Page>
  );
}

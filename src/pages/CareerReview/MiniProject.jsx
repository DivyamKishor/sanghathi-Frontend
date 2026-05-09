import React, { useEffect, useState, useCallback, useContext, useMemo } from "react";
import { useSnackbar } from "notistack";
import api from "../../utils/axios";
import { useForm, useFieldArray } from "react-hook-form";
import { AuthContext } from "../../context/AuthContext";
import { Box, Grid, Card, CardContent, Stack, Button, IconButton, Typography, TextField, Chip, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { FormProvider, RHFTextField } from "../../components/hook-form";
import { useSearchParams } from "react-router-dom";

import logger from "../../utils/logger.js";
const parseSemesterValue = (value, fallback = null) => {
  const candidate = value !== undefined && value !== null && `${value}`.trim() !== ""
    ? Number(value)
    : Number(fallback);

  return Number.isInteger(candidate) && candidate >= 1 && candidate <= 8 ? candidate : null;
};

const normalizeDateForInput = (value) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.getTime() > Date.now()) {
    return "";
  }

  return parsedDate.toISOString().split("T")[0];
};

const todayIso = new Date().toISOString().split("T")[0];

export default function MiniProject({ resolvedSemester = null }) {
  const { enqueueSnackbar } = useSnackbar();
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const menteeId = searchParams.get('menteeId');
    logger.info("User : ",user);
    logger.info("id: ",menteeId);
    const [semesterFilter, setSemesterFilter] = useState("all");
    const normalizedResolvedSemester = useMemo(
      () => parseSemesterValue(resolvedSemester),
      [resolvedSemester]
    );
    
    const methods = useForm({
      defaultValues: {
        miniproject: [],
      },
    });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;
    const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: "miniproject",
    });

    const fetchMiniProjects = useCallback(async () => {
      try {
        let response;
        if(menteeId)
          response = await api.get(`/project/miniproject/${menteeId}`);
        else
          response = await api.get(`/project/miniproject/${user._id}`);
        logger.info("Raw API Response:", response.data);
        const { data } = response.data;
    
        if (data && Array.isArray(data.miniproject)) {
          const formattedMiniProject = data.miniproject.map((miniproject) => ({
            ...miniproject,
            semester: parseSemesterValue(miniproject.semester, normalizedResolvedSemester)?.toString() || "",
            startDate: normalizeDateForInput(miniproject.startDate),
            completedDate: normalizeDateForInput(miniproject.completedDate),
          }));
          logger.info("Formatted miniproject:", formattedMiniProject);
          reset({ miniproject: formattedMiniProject });
        } else {
          logger.warn("No miniproject data found for this user");
          reset({ miniproject: [] });
        }
      } catch (error) {
        logger.info("Error fetching miniproject data:", error);
      }
    }, [user._id, reset, enqueueSnackbar, menteeId, normalizedResolvedSemester]);
    
    useEffect(() => {
      fetchMiniProjects();
    }, [fetchMiniProjects]);
  
    const handleReset = () => {
      reset();
    };

    const semesterOptions = useMemo(() => {
      const options = new Set();

      (methods.watch("miniproject") || []).forEach((entry) => {
        const semester = parseSemesterValue(entry?.semester, normalizedResolvedSemester);
        if (semester) {
          options.add(String(semester));
        }
      });

      if (normalizedResolvedSemester) {
        options.add(String(normalizedResolvedSemester));
      }

      return Array.from(options).sort((left, right) => Number(left) - Number(right));
    }, [methods, normalizedResolvedSemester]);

    const visibleIndices = useMemo(() => {
      const currentValues = methods.watch("miniproject") || [];

      return fields.reduce((indices, field, index) => {
        const semester = parseSemesterValue(currentValues?.[index]?.semester, normalizedResolvedSemester);
        const matches = semesterFilter === "all"
          || (semesterFilter === "unspecified" && semester === null)
          || (semester !== null && String(semester) === semesterFilter);

        if (matches) {
          indices.push(index);
        }

        return indices;
      }, []);
    }, [fields, methods, semesterFilter, normalizedResolvedSemester]);

    const onSubmit = useCallback(
      async (formData) => {
        try {
          const payload = {
            miniproject: (formData.miniproject || []).map((item) => ({
              ...item,
              semester: parseSemesterValue(item.semester, normalizedResolvedSemester),
              startDate: item.startDate && new Date(item.startDate).getTime() <= Date.now() ? item.startDate : null,
              completedDate: item.completedDate && new Date(item.completedDate).getTime() <= Date.now() ? item.completedDate : null,
            })),
            userId: user._id,
          };

          await api.post("/project/miniproject", payload);
          enqueueSnackbar("miniproject data updated successfully!", {
            variant: "success",
          });
          await fetchMiniProjects();
        } catch (error) {
          logger.error(error);
          enqueueSnackbar("An error occurred while processing the request", {
            variant: "error",
          });
        }
      },
      [enqueueSnackbar, fetchMiniProjects, user._id]
    );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Card sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 3, alignItems: { md: "center" }, justifyContent: "space-between" }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Mini Project
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Semester-filtered cards with date safety checks.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" variant="outlined" label={`Records: ${fields.length}`} />
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="mini-semester-filter-label">Semester</InputLabel>
              <Select
                labelId="mini-semester-filter-label"
                value={semesterFilter}
                label="Semester"
                onChange={(event) => setSemesterFilter(event.target.value)}
              >
                <MenuItem value="all">All semesters</MenuItem>
                <MenuItem value="unspecified">Unspecified</MenuItem>
                {semesterOptions.map((semester) => (
                  <MenuItem key={semester} value={semester}>
                    Semester {semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          {visibleIndices.length > 0 ? visibleIndices.map((idx) => {
            const semesterValue = parseSemesterValue(methods.watch(`miniproject.${idx}.semester`), normalizedResolvedSemester);
            const semesterLabel = semesterValue ? `Semester ${semesterValue}` : "Unspecified Semester";

            return (
              <Grid item xs={12} key={fields[idx].id}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {semesterLabel}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mini project record #{idx + 1}
                        </Typography>
                      </Box>
                      <IconButton color="error" onClick={() => remove(idx)} sx={{ alignSelf: { sm: "flex-start" } }}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={2}>
                        <TextField disabled value={idx + 1} label="Sl. No." variant="outlined" fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <RHFTextField name={`miniproject[${idx}].semester`} label="Semester" fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <RHFTextField name={`miniproject[${idx}].title`} label="Miniproject Title" fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <RHFTextField name={`miniproject[${idx}].manHours`} label="Man Hours" fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <RHFTextField name={`miniproject[${idx}].startDate`} label="Start Date" type="date" InputLabelProps={{ shrink: true }} inputProps={{ max: todayIso }} fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <RHFTextField name={`miniproject[${idx}].completedDate`} label="Completed Date" type="date" InputLabelProps={{ shrink: true }} inputProps={{ max: todayIso }} fullWidth />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          }) : (
            <Grid item xs={12}>
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {fields.length === 0 ? "No mini project records added yet." : "No mini project records match the selected semester."}
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={() => append({ title: "", semester: normalizedResolvedSemester ? String(normalizedResolvedSemester) : "", manHours: "", startDate: null, completedDate: null })} 
              sx={{ mt: 2, display: "block", mx: "auto" }}>
              Add Row
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Box display="flex" gap={1}>
                {import.meta.env.MODE === "development" && (
                  <LoadingButton 
                  variant="outlined" 
                  onClick={handleReset}>
                    Reset
                  </LoadingButton>
                )}
                <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                  Save
                </LoadingButton>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Card>
    </FormProvider>
  );
}

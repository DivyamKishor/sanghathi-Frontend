import React, { useEffect, useState, useCallback, useContext, useMemo } from "react";
import { useSnackbar } from "notistack";
import api from "../../utils/axios";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { AuthContext } from "../../context/AuthContext";
import { Box, Grid, Card, CardContent, Stack, Button, IconButton, Typography, TextField, Chip, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { FormProvider, RHFTextField } from "../../components/hook-form";
import { useSearchParams } from "react-router-dom";
import useDraftPersistence from "../../hooks/useDraftPersistence";


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

export default function Mooc({ resolvedSemester = null }) {
  const { enqueueSnackbar } = useSnackbar();
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const menteeId = searchParams.get('menteeId');
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [semesterFilter, setSemesterFilter] = useState("all");
    logger.info("User : ",user);
    logger.info("id: ",menteeId);

    const normalizedResolvedSemester = useMemo(
      () => parseSemesterValue(resolvedSemester),
      [resolvedSemester]
    );

    const draftScopeId = useMemo(
      () => menteeId || user?._id || "default",
      [menteeId, user?._id]
    );

    const methods = useForm({
      defaultValues: {
        mooc: [],
      },
    });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;
    const watchedValues = useWatch({ control: methods.control });

    const { syncState, lastSavedAt } = useDraftPersistence({
      formType: "career-mooc",
      scopeId: draftScopeId,
      values: watchedValues,
      reset,
      enableServerSync: Boolean(user?._id),
      enablePersistence: isDataFetched,
    });

    const formatDateTime = (value) => {
      if (!value) return "Not saved yet";
      const asDate = new Date(value);
      if (Number.isNaN(asDate.getTime())) return "Not saved yet";
      return asDate.toLocaleString();
    };

    const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: "mooc",
    });

    const fetchMooc = useCallback(async () => {
      try {
        const existingLocalDraft = localStorage.getItem(
          `sanghathi:draft:career-mooc:${draftScopeId}`
        );
        if (existingLocalDraft && existingLocalDraft !== "{}" && !menteeId) {
          // If we have a local draft and are not viewing another mentee's profile, skip fetching to allow draft resume
          // We can let the user discard drafts if they want to. But fetching right now blocks DB data if cache exists.
          // setIsDataFetched(true);
          // return;
        }

        let response;
        if(menteeId)
          response = await api.get(`/mooc-data/mooc/${menteeId}`);
        else
          response = await api.get(`/mooc-data/mooc/${user._id}`);
        const { data } = response.data;
    
        if (data && Array.isArray(data.mooc)) {
          const formattedMooc = data.mooc.map((mooc) => {
            const semester = parseSemesterValue(mooc.semester, normalizedResolvedSemester);

            return {
              ...mooc,
              semester: semester ? String(semester) : "",
              startDate: normalizeDateForInput(mooc.startDate),
              completedDate: normalizeDateForInput(mooc.completedDate),
            };
          });
          reset({ mooc: formattedMooc });
        } else {
          logger.warn("No mooc data found for this user");
          reset({ mooc: [] });
        }
      } catch (error) {
        logger.info("Error fetching mooc data:", error);
      } finally {
        setIsDataFetched(true);
      }
    }, [draftScopeId, user._id, reset, enqueueSnackbar, menteeId, normalizedResolvedSemester]);

    useEffect(() => {
      fetchMooc();
    }, [fetchMooc]);
  
    const handleReset = () => {
      reset();
    };

    const semesterOptions = useMemo(() => {
      const options = new Set();

      (watchedValues?.mooc || []).forEach((entry) => {
        const semester = parseSemesterValue(entry?.semester, normalizedResolvedSemester);
        if (semester) {
          options.add(String(semester));
        }
      });

      if (normalizedResolvedSemester) {
        options.add(String(normalizedResolvedSemester));
      }

      return Array.from(options)
        .sort((left, right) => Number(left) - Number(right));
    }, [watchedValues?.mooc, normalizedResolvedSemester]);

    const visibleIndices = useMemo(() => {
      return fields.reduce((indices, field, index) => {
        const semester = parseSemesterValue(watchedValues?.mooc?.[index]?.semester, normalizedResolvedSemester);
        const filterMatches = semesterFilter === "all"
          || (semesterFilter === "unspecified" && semester === null)
          || (semester !== null && String(semester) === semesterFilter);

        if (filterMatches) {
          indices.push(index);
        }

        return indices;
      }, []);
    }, [fields, watchedValues?.mooc, semesterFilter, normalizedResolvedSemester]);

    const onSubmit = useCallback(
      async (formData) => {
        try {
          const payload = {
            mooc: (formData.mooc || []).map((item) => ({
              ...item,
              semester: parseSemesterValue(item.semester, normalizedResolvedSemester),
              startDate: item.startDate && new Date(item.startDate).getTime() <= Date.now() ? item.startDate : null,
              completedDate: item.completedDate && new Date(item.completedDate).getTime() <= Date.now() ? item.completedDate : null,
            })),
            userId: user._id,
          };

          await api.post("/mooc-data/mooc", payload);
          enqueueSnackbar("Mooc data updated successfully!", {
            variant: "success",
          });
          await fetchMooc();
        } catch (error) {
          logger.error(error);
          enqueueSnackbar("An error occurred while processing the request", {
            variant: "error",
          });
        }
      },
      [enqueueSnackbar, fetchMooc, user._id]
    );

  return (
      <FormProvider
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      disableAutoDraft
    >
          <Card sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
              <Chip size="small" variant="outlined" label={`Draft: ${syncState}`} />
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                Last saved: {formatDateTime(lastSavedAt)}
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ mb: 3, alignItems: { md: "center" }, justifyContent: "space-between" }}
            >
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="mooc-semester-filter-label">Semester</InputLabel>
                <Select
                  labelId="mooc-semester-filter-label"
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

              <Typography variant="body2" color="text.secondary">
                Showing {visibleIndices.length} of {fields.length} records
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              {visibleIndices.length > 0 ? visibleIndices.map((idx) => {
                const semesterValue = parseSemesterValue(watchedValues?.mooc?.[idx]?.semester, normalizedResolvedSemester);
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
                              MOOC record #{idx + 1}
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
                            <RHFTextField name={`mooc[${idx}].semester`} label="Semester" fullWidth />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <RHFTextField name={`mooc[${idx}].portal`} label="Course Portal" fullWidth />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <RHFTextField name={`mooc[${idx}].title`} label="Mooc Title" fullWidth />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <RHFTextField name={`mooc[${idx}].startDate`} label="Start Date" type="date" InputLabelProps={{ shrink: true }} inputProps={{ max: todayIso }} fullWidth />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <RHFTextField name={`mooc[${idx}].completedDate`} label="Completed Date" type="date" InputLabelProps={{ shrink: true }} inputProps={{ max: todayIso }} fullWidth />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <RHFTextField name={`mooc[${idx}].score`} label="Score" fullWidth />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <RHFTextField name={`mooc[${idx}].certificateLink`} label="Certificate Link" fullWidth />
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
                      {fields.length === 0 ? "No MOOC records added yet." : "No MOOC records match the selected semester."}
                    </Typography>
                  </Box>
                </Grid>
              )}
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                          onClick={() => append({ portal: "", title: "", semester: normalizedResolvedSemester ? String(normalizedResolvedSemester) : "", startDate: null, completedDate: null, score: null, certificateLink: "" })} 
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

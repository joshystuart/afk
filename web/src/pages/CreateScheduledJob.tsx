import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Autocomplete,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  MenuItem,
  Switch,
  FormControlLabel,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  GitHub as GitHubIcon,
  Link as LinkIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useScheduledJob, useScheduledJobs } from '../hooks/useScheduledJobs';
import { useGitHub } from '../hooks/useGitHub';
import {
  type CreateScheduledJobRequest,
  type GitHubRepo,
  ScheduleType,
} from '../api/types';
import { ROUTES } from '../utils/constants';
import { CLAUDE_MODELS, DEFAULT_CLAUDE_MODEL } from '../utils/claude-models';
import { useSettingsStore } from '../stores/settings.store';
import { useDockerImagesStore } from '../stores/docker-images.store';
import { afkColors } from '../themes/afk';
import { CronScheduleBuilder } from '../components/scheduled-jobs/CronScheduleBuilder';

type RepoSource = 'github' | 'manual';

interface IntervalUnit {
  label: string;
  ms: number;
}

const INTERVAL_UNITS: IntervalUnit[] = [
  { label: 'Minutes', ms: 60_000 },
  { label: 'Hours', ms: 3_600_000 },
  { label: 'Days', ms: 86_400_000 },
];

interface CreateJobForm {
  name: string;
  imageId: string;
  repoUrl: string;
  branch: string;
  prompt: string;
  model: string;
  scheduleType: ScheduleType;
  cronExpression: string;
  intervalValue: number;
  intervalUnit: number;
  createNewBranch: boolean;
  newBranchPrefix: string;
  commitAndPush: boolean;
}

const SECTION_SX = {
  borderLeft: `2px solid ${afkColors.accent}`,
  pl: 2,
  mb: 2.5,
};

function getIntervalDefaults(intervalMs?: number) {
  if (!intervalMs || intervalMs <= 0) {
    return { intervalValue: 1, intervalUnit: 3_600_000 };
  }

  const bestUnit =
    [...INTERVAL_UNITS].reverse().find((unit) => intervalMs % unit.ms === 0) ??
    INTERVAL_UNITS[0];

  return {
    intervalValue: Math.max(1, intervalMs / bestUnit.ms),
    intervalUnit: bestUnit.ms,
  };
}

const CreateScheduledJob: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const {
    createJob,
    isCreating,
    createError,
    updateJob,
    isUpdating,
    updateError,
  } = useScheduledJobs();
  const { data: existingJob, isLoading: isJobLoading } = useScheduledJob(
    id || '',
  );
  const { settings, fetchSettings } = useSettingsStore();
  const { isConnected, useRepos } = useGitHub();
  const { images, fetchImages } = useDockerImagesStore();

  const [repoSource, setRepoSource] = useState<RepoSource>(
    isConnected ? 'github' : 'manual',
  );
  const [searchInput, setSearchInput] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  const { data: repos, isLoading: reposLoading } = useRepos(
    undefined,
    repoSource === 'github',
  );

  useEffect(() => {
    fetchSettings();
    fetchImages();
  }, [fetchSettings, fetchImages]);

  const availableImages = useMemo(
    () =>
      images
        .filter((img) => img.status === 'AVAILABLE')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [images],
  );

  const defaultImage = useMemo(
    () => availableImages.find((img) => img.isDefault),
    [availableImages],
  );

  useEffect(() => {
    if (!isConnected && repoSource === 'github') {
      setRepoSource('manual');
    }
  }, [isConnected]);

  const filteredRepos = useMemo(() => {
    if (!repos) return [];
    if (!searchInput.trim()) return repos;
    const lower = searchInput.toLowerCase();
    return repos.filter(
      (repo) =>
        repo.full_name.toLowerCase().includes(lower) ||
        repo.name.toLowerCase().includes(lower) ||
        (repo.description && repo.description.toLowerCase().includes(lower)),
    );
  }, [repos, searchInput]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateJobForm>({
    defaultValues: {
      name: '',
      imageId: '',
      repoUrl: '',
      branch: 'main',
      prompt: '',
      model: DEFAULT_CLAUDE_MODEL,
      scheduleType: ScheduleType.CRON,
      cronExpression: '0 9 * * *',
      intervalValue: 1,
      intervalUnit: 3_600_000,
      createNewBranch: false,
      newBranchPrefix: '',
      commitAndPush: false,
    },
  });

  const scheduleType = watch('scheduleType');
  const createNewBranch = watch('createNewBranch');
  const imageId = watch('imageId');

  useEffect(() => {
    if (!existingJob) {
      return;
    }

    const intervalDefaults = getIntervalDefaults(existingJob.intervalMs);
    reset({
      name: existingJob.name,
      imageId: existingJob.imageId,
      repoUrl: existingJob.repoUrl,
      branch: existingJob.branch,
      prompt: existingJob.prompt,
      model: existingJob.model || DEFAULT_CLAUDE_MODEL,
      scheduleType: existingJob.scheduleType,
      cronExpression: existingJob.cronExpression || '0 9 * * *',
      intervalValue: intervalDefaults.intervalValue,
      intervalUnit: intervalDefaults.intervalUnit,
      createNewBranch: existingJob.createNewBranch,
      newBranchPrefix: existingJob.newBranchPrefix || '',
      commitAndPush: existingJob.commitAndPush,
    });
    setRepoSource(
      isConnected && existingJob.repoUrl.startsWith('https://github.com/')
        ? 'github'
        : 'manual',
    );
    setSelectedRepo(null);
    setSearchInput('');
  }, [existingJob, isConnected, reset]);

  useEffect(() => {
    if (defaultImage && !imageId) {
      setValue('imageId', defaultImage.id);
    }
  }, [defaultImage, imageId, setValue]);

  useEffect(() => {
    if (!existingJob || repoSource !== 'github' || !repos?.length) {
      return;
    }

    const matchingRepo =
      repos.find((repo) => repo.clone_url === existingJob.repoUrl) ||
      repos.find((repo) => repo.ssh_url === existingJob.repoUrl) ||
      null;

    setSelectedRepo(matchingRepo);
  }, [existingJob, repoSource, repos]);

  const handleRepoSourceChange = (
    _: React.MouseEvent<HTMLElement>,
    newSource: RepoSource | null,
  ) => {
    if (newSource) {
      setRepoSource(newSource);
      setSelectedRepo(null);
      setValue('repoUrl', '');
      setValue('branch', 'main');
    }
  };

  const handleRepoSelect = (_: unknown, repo: GitHubRepo | null) => {
    setSelectedRepo(repo);
    if (repo) {
      setValue('repoUrl', repo.clone_url);
      setValue('branch', repo.default_branch);
    } else {
      setValue('repoUrl', '');
      setValue('branch', 'main');
    }
  };

  const onSubmit = async (data: CreateJobForm) => {
    const request: CreateScheduledJobRequest = {
      name: data.name.trim(),
      imageId: data.imageId,
      repoUrl: data.repoUrl.trim(),
      branch: data.branch.trim(),
      prompt: data.prompt,
      model: data.model,
      scheduleType: data.scheduleType,
      cronExpression:
        data.scheduleType === ScheduleType.CRON
          ? data.cronExpression.trim()
          : undefined,
      intervalMs:
        data.scheduleType === ScheduleType.INTERVAL
          ? data.intervalValue * data.intervalUnit
          : undefined,
      createNewBranch: data.createNewBranch || undefined,
      newBranchPrefix:
        data.createNewBranch && data.newBranchPrefix
          ? data.newBranchPrefix
          : undefined,
      commitAndPush: data.commitAndPush || undefined,
    };

    if (isEditMode && id) {
      await updateJob({ id, request });
      navigate(ROUTES.getScheduledJobDetails(id));
      return;
    }

    await createJob(request);
    navigate(ROUTES.SCHEDULED_JOBS);
  };

  const missingSettings =
    !settings?.hasClaudeToken || availableImages.length === 0;
  const isSubmitting = isEditMode ? isUpdating : isCreating;
  const submitError = isEditMode ? updateError : createError;

  if (isEditMode && isJobLoading) {
    return (
      <Box sx={{ p: 3, width: '100%', maxWidth: 640 }}>
        <Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={280} height={40} sx={{ mb: 3 }} />
        <Skeleton
          variant="rectangular"
          height={560}
          sx={{ borderRadius: '8px' }}
        />
      </Box>
    );
  }

  if (isEditMode && !existingJob) {
    return (
      <Box sx={{ p: 3, width: '100%', maxWidth: 640 }}>
        <Button
          component={Link}
          to={ROUTES.SCHEDULED_JOBS}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 2, color: afkColors.textSecondary }}
        >
          Back
        </Button>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Job Not Found
        </Typography>
        <Typography sx={{ color: afkColors.textTertiary }}>
          The scheduled job you are trying to edit no longer exists.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: 640 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to={ROUTES.SCHEDULED_JOBS}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 2, color: afkColors.textSecondary }}
        >
          Back
        </Button>
        <Typography variant="h3">
          {isEditMode ? 'Edit Scheduled Job' : 'Create Scheduled Job'}
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError.message ||
            `Failed to ${isEditMode ? 'update' : 'create'} job. Please try again.`}
        </Alert>
      )}

      {!settings?.hasClaudeToken && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Configure your Claude Token in{' '}
            <Link to={ROUTES.SETTINGS}>Settings</Link> before creating a job.
          </Typography>
        </Alert>
      )}

      {availableImages.length === 0 && !!settings?.hasClaudeToken && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            No Docker images installed. Go to{' '}
            <Link
              to={`${ROUTES.SETTINGS}?tab=images`}
              style={{ fontWeight: 600 }}
            >
              Settings &gt; Docker Images
            </Link>{' '}
            to install one.
          </Typography>
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Job Details */}
        <Box sx={{ mb: 4 }}>
          <Box sx={SECTION_SX}>
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Job Details
            </Typography>
          </Box>

          <Controller
            name="name"
            control={control}
            rules={{
              required: 'Job name is required',
              minLength: { value: 1, message: 'Name is required' },
              maxLength: {
                value: 255,
                message: 'Name must be at most 255 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Job Name"
                helperText={
                  errors.name?.message ||
                  'A descriptive name for this scheduled job'
                }
                error={!!errors.name}
              />
            )}
          />
        </Box>

        {/* Environment */}
        <Box sx={{ mb: 4 }}>
          <Box sx={SECTION_SX}>
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Environment
            </Typography>
          </Box>

          <Controller
            name="imageId"
            control={control}
            rules={{ required: 'Please select a Docker image' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Docker Image"
                helperText={
                  errors.imageId?.message ||
                  'The container environment for running the job'
                }
                error={!!errors.imageId}
                disabled={availableImages.length === 0}
              >
                {availableImages.map((img) => (
                  <MenuItem key={img.id} value={img.id}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: afkColors.textPrimary,
                        }}
                      >
                        {img.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: afkColors.textTertiary,
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        {img.image}
                      </Typography>
                      {img.isDefault && (
                        <Chip
                          label="default"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            ml: 'auto',
                            bgcolor: afkColors.accentMuted,
                            color: afkColors.accent,
                          }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Box sx={{ mt: 2 }}>
            <Controller
              name="model"
              control={control}
              rules={{ required: 'Please select a Claude model' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Claude Model"
                  helperText={
                    errors.model?.message ||
                    'Choose which Claude model each scheduled run should use'
                  }
                  error={!!errors.model}
                >
                  {CLAUDE_MODELS.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: afkColors.textPrimary,
                          }}
                        >
                          {model.label}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Box>
        </Box>

        {/* Repository */}
        <Box sx={{ mb: 4 }}>
          <Box sx={SECTION_SX}>
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Repository
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={repoSource}
            exclusive
            onChange={handleRepoSourceChange}
            size="small"
            sx={{
              mb: 2.5,
              '& .MuiToggleButton-root': {
                border: `1px solid ${afkColors.border}`,
                color: afkColors.textSecondary,
                textTransform: 'none',
                fontSize: '0.8125rem',
                px: 2,
                py: 0.75,
                '&.Mui-selected': {
                  bgcolor: afkColors.accentMuted,
                  color: afkColors.accent,
                  borderColor: afkColors.accent,
                  '&:hover': { bgcolor: afkColors.accentMuted },
                },
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
              },
            }}
          >
            <ToggleButton value="github" disabled={!isConnected}>
              <GitHubIcon sx={{ fontSize: 16, mr: 0.75 }} />
              GitHub
            </ToggleButton>
            <ToggleButton value="manual">
              <LinkIcon sx={{ fontSize: 16, mr: 0.75 }} />
              Manual URL
            </ToggleButton>
          </ToggleButtonGroup>

          {!isConnected && repoSource === 'manual' && (
            <Typography
              variant="caption"
              sx={{ color: afkColors.textTertiary, display: 'block', mb: 2 }}
            >
              <Link to={ROUTES.SETTINGS} style={{ color: afkColors.accent }}>
                Connect GitHub
              </Link>{' '}
              in Settings to browse and select repositories
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {repoSource === 'github' ? (
              <>
                <Autocomplete
                  options={filteredRepos}
                  value={selectedRepo}
                  onChange={handleRepoSelect}
                  inputValue={searchInput}
                  onInputChange={(_, value) => setSearchInput(value)}
                  getOptionLabel={(option) => option.full_name}
                  loading={reposLoading}
                  filterOptions={(x) => x}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search repositories"
                      placeholder="Type to search..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {reposLoading ? (
                              <CircularProgress size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...restProps } = props;
                    return (
                      <Box
                        component="li"
                        key={key}
                        {...restProps}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start !important',
                          gap: 0.25,
                          py: 1,
                          px: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            width: '100%',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: afkColors.textPrimary,
                            }}
                          >
                            {option.full_name}
                          </Typography>
                          {option.private ? (
                            <LockIcon
                              sx={{
                                fontSize: 12,
                                color: afkColors.textTertiary,
                              }}
                            />
                          ) : (
                            <LockOpenIcon
                              sx={{
                                fontSize: 12,
                                color: afkColors.textTertiary,
                              }}
                            />
                          )}
                          {option.language && (
                            <Chip
                              label={option.language}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.625rem',
                                ml: 'auto',
                                bgcolor: afkColors.surfaceElevated,
                                color: afkColors.textSecondary,
                              }}
                            />
                          )}
                        </Box>
                        {option.description && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: afkColors.textTertiary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              width: '100%',
                            }}
                          >
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    );
                  }}
                  sx={{
                    '& .MuiAutocomplete-paper': {
                      bgcolor: afkColors.surface,
                      border: `1px solid ${afkColors.border}`,
                    },
                  }}
                />

                <Controller
                  name="repoUrl"
                  control={control}
                  rules={{ required: 'Repository is required' }}
                  render={() => <input type="hidden" />}
                />

                <Controller
                  name="branch"
                  control={control}
                  rules={{ required: 'Branch is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Branch"
                      helperText={
                        selectedRepo
                          ? `Default: ${selectedRepo.default_branch}`
                          : 'Defaults to main'
                      }
                      error={!!errors.branch}
                    />
                  )}
                />
              </>
            ) : (
              <>
                <Controller
                  name="repoUrl"
                  control={control}
                  rules={{ required: 'Repository URL is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Git Repository URL"
                      helperText={
                        errors.repoUrl?.message ||
                        'SSH or HTTPS URL of the git repository to clone'
                      }
                      error={!!errors.repoUrl}
                    />
                  )}
                />

                <Controller
                  name="branch"
                  control={control}
                  rules={{ required: 'Branch is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Branch"
                      helperText={
                        errors.branch?.message || 'Branch to check out'
                      }
                      error={!!errors.branch}
                    />
                  )}
                />
              </>
            )}

            {/* New branch toggle */}
            <FormControlLabel
              control={
                <Controller
                  name="createNewBranch"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      size="small"
                    />
                  )}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{ color: afkColors.textPrimary }}
                >
                  Create a new branch for each run
                </Typography>
              }
            />

            {createNewBranch && (
              <Controller
                name="newBranchPrefix"
                control={control}
                rules={{
                  required:
                    'Branch prefix is required when creating new branches',
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Branch Prefix"
                    placeholder="e.g. scheduled-update"
                    helperText={
                      errors.newBranchPrefix?.message ||
                      'Branches will be named {prefix}-YYYY-MM-DD-HHmmss'
                    }
                    error={!!errors.newBranchPrefix}
                    size="small"
                    sx={{
                      '& input': {
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.8125rem',
                      },
                    }}
                  />
                )}
              />
            )}
          </Box>
        </Box>

        {/* Schedule */}
        <Box sx={{ mb: 4 }}>
          <Box sx={SECTION_SX}>
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Schedule
            </Typography>
          </Box>

          <Controller
            name="scheduleType"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                value={field.value}
                exclusive
                onChange={(_, v) => {
                  if (v) field.onChange(v);
                }}
                size="small"
                sx={{
                  mb: 2.5,
                  '& .MuiToggleButton-root': {
                    border: `1px solid ${afkColors.border}`,
                    color: afkColors.textSecondary,
                    textTransform: 'none',
                    fontSize: '0.8125rem',
                    px: 2,
                    py: 0.75,
                    '&.Mui-selected': {
                      bgcolor: afkColors.accentMuted,
                      color: afkColors.accent,
                      borderColor: afkColors.accent,
                      '&:hover': { bgcolor: afkColors.accentMuted },
                    },
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                  },
                }}
              >
                <ToggleButton value={ScheduleType.CRON}>
                  Specific Time
                </ToggleButton>
                <ToggleButton value={ScheduleType.INTERVAL}>
                  Recurring Interval
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          />

          {scheduleType === ScheduleType.CRON ? (
            <Controller
              name="cronExpression"
              control={control}
              rules={{ required: 'Schedule is required' }}
              render={({ field, fieldState }) => (
                <CronScheduleBuilder
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          ) : (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Controller
                name="intervalValue"
                control={control}
                rules={{
                  required: 'Interval value is required',
                  min: { value: 1, message: 'Must be at least 1' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    type="number"
                    label="Every"
                    helperText={errors.intervalValue?.message}
                    error={!!errors.intervalValue}
                    sx={{ width: 120 }}
                    inputProps={{ min: 1 }}
                  />
                )}
              />
              <Controller
                name="intervalUnit"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    select
                    label="Unit"
                    sx={{ width: 160 }}
                  >
                    {INTERVAL_UNITS.map((unit) => (
                      <MenuItem key={unit.ms} value={unit.ms}>
                        {unit.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          )}
        </Box>

        {/* Prompt */}
        <Box sx={{ mb: 4 }}>
          <Box sx={SECTION_SX}>
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Prompt
            </Typography>
          </Box>

          <Controller
            name="prompt"
            control={control}
            rules={{ required: 'Prompt is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                minRows={4}
                maxRows={12}
                label="Claude Prompt"
                placeholder="Describe the task Claude should perform against this repository..."
                helperText={
                  errors.prompt?.message ||
                  'The prompt sent to Claude when this job runs'
                }
                error={!!errors.prompt}
                sx={{
                  '& textarea': {
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.8125rem',
                    lineHeight: 1.6,
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Options */}
        <Box sx={{ mb: 4 }}>
          <Box sx={SECTION_SX}>
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Options
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Controller
                name="commitAndPush"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    size="small"
                  />
                )}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: afkColors.textPrimary }}
                >
                  Commit and push changes
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: afkColors.textTertiary }}
                >
                  Automatically commit and push any changes made by Claude
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || missingSettings}
          >
            {isSubmitting
              ? isEditMode
                ? 'Saving...'
                : 'Creating...'
              : isEditMode
                ? 'Save Changes'
                : 'Create Job'}
          </Button>
          <Button
            variant="outlined"
            component={Link}
            to={
              isEditMode && id
                ? ROUTES.getScheduledJobDetails(id)
                : ROUTES.SCHEDULED_JOBS
            }
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export { CreateScheduledJob };

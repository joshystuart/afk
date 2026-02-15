import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Autocomplete,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  GitHub as GitHubIcon,
  Link as LinkIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useGitHub } from '../hooks/useGitHub';
import {
  TerminalMode,
  type CreateSessionRequest,
  type GitHubRepo,
} from '../api/types';
import { ROUTES, TERMINAL_MODE_LABELS } from '../utils/constants';
import { useSettingsStore } from '../stores/settings.store';
import { afkColors } from '../themes/afk';

type RepoSource = 'github' | 'manual';

interface CreateSessionForm {
  name: string;
  repoUrl?: string;
  branch?: string;
  terminalMode: TerminalMode;
}

const CreateSession: React.FC = () => {
  const navigate = useNavigate();
  const { createSession, isCreating, createError, clearError } = useSession();
  const { settings, fetchSettings } = useSettingsStore();
  const { isConnected, useRepos } = useGitHub();
  const { sessions } = useSession();

  const [repoSource, setRepoSource] = useState<RepoSource>(
    isConnected ? 'github' : 'manual',
  );
  const [searchInput, setSearchInput] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  // Fetch repos when connected
  const { data: repos, isLoading: reposLoading } = useRepos(
    undefined,
    repoSource === 'github',
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update repo source when connection status changes
  useEffect(() => {
    if (isConnected && repoSource === 'manual') {
      setRepoSource('github');
    } else if (!isConnected && repoSource === 'github') {
      setRepoSource('manual');
    }
  }, [isConnected]);

  // Derive recent repo URLs from session history
  const recentRepoUrls = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return new Set<string>();
    const urls = sessions.filter((s) => s.repoUrl).map((s) => s.repoUrl!);
    return new Set(urls);
  }, [sessions]);

  // Group repos: recent first, then the rest
  const groupedRepos = useMemo(() => {
    if (!repos) return [];
    return [...repos].sort((a, b) => {
      const aRecent =
        recentRepoUrls.has(a.clone_url) || recentRepoUrls.has(a.ssh_url);
      const bRecent =
        recentRepoUrls.has(b.clone_url) || recentRepoUrls.has(b.ssh_url);
      if (aRecent && !bRecent) return -1;
      if (!aRecent && bRecent) return 1;
      return 0;
    });
  }, [repos, recentRepoUrls]);

  // Filter repos based on search input
  const filteredRepos = useMemo(() => {
    if (!searchInput.trim()) return groupedRepos;
    const lower = searchInput.toLowerCase();
    return groupedRepos.filter(
      (repo) =>
        repo.full_name.toLowerCase().includes(lower) ||
        repo.name.toLowerCase().includes(lower) ||
        (repo.description && repo.description.toLowerCase().includes(lower)),
    );
  }, [groupedRepos, searchInput]);

  // Determine if SSH key or GitHub is needed
  const missingSettings = useMemo(() => {
    if (!settings) return true;
    if (!settings.hasClaudeToken) return true;
    // If using GitHub mode, no SSH key needed
    if (repoSource === 'github' && isConnected) return false;
    // If manual mode, SSH key needed for SSH URLs only
    // But we still allow creation without SSH key for HTTPS URLs
    return false;
  }, [settings, repoSource, isConnected]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateSessionForm>({
    defaultValues: {
      name: '',
      repoUrl: '',
      branch: 'main',
      terminalMode: TerminalMode.DUAL,
    },
  });

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

  const handleRepoSelect = (_: any, repo: GitHubRepo | null) => {
    setSelectedRepo(repo);
    if (repo) {
      setValue('repoUrl', repo.clone_url);
      setValue('branch', repo.default_branch);
    } else {
      setValue('repoUrl', '');
      setValue('branch', 'main');
    }
  };

  const getRepoGroup = (repo: GitHubRepo): string => {
    const isRecent =
      recentRepoUrls.has(repo.clone_url) || recentRepoUrls.has(repo.ssh_url);
    return isRecent ? 'Recent' : 'All Repositories';
  };

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  const onSubmit = async (data: CreateSessionForm) => {
    try {
      clearError();
      const request: CreateSessionRequest = {
        name: data.name,
        repoUrl: data.repoUrl || undefined,
        branch: data.branch || undefined,
        terminalMode: data.terminalMode,
      };

      await createSession(request);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: 640 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to={ROUTES.DASHBOARD}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 2, color: afkColors.textSecondary }}
        >
          Back
        </Button>
        <Typography variant="h3">New Session</Typography>
      </Box>

      {createError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {createError.message || 'Failed to create session. Please try again.'}
        </Alert>
      )}

      {!settings?.hasClaudeToken && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Configure your Claude Token in{' '}
            <Link to={ROUTES.SETTINGS}>Settings</Link> before creating a
            session.
          </Typography>
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Session Details */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              borderLeft: `2px solid ${afkColors.accent}`,
              pl: 2,
              mb: 2.5,
            }}
          >
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Session Details
            </Typography>
          </Box>

          <Controller
            name="name"
            control={control}
            rules={{
              required: 'Session name is required',
              minLength: {
                value: 3,
                message: 'Name must be at least 3 characters',
              },
              maxLength: {
                value: 50,
                message: 'Name must be at most 50 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Session Name"
                helperText={
                  errors.name?.message || 'A descriptive name for your session'
                }
                error={!!errors.name}
              />
            )}
          />
        </Box>

        {/* Repository section */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              borderLeft: `2px solid ${afkColors.accent}`,
              pl: 2,
              mb: 2.5,
            }}
          >
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Repository
            </Typography>
          </Box>

          {/* Repo source toggle */}
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
                  '&:hover': {
                    bgcolor: afkColors.accentMuted,
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                },
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
              sx={{
                color: afkColors.textTertiary,
                display: 'block',
                mb: 2,
              }}
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
                {/* GitHub Autocomplete */}
                <Autocomplete
                  options={filteredRepos}
                  value={selectedRepo}
                  onChange={handleRepoSelect}
                  inputValue={searchInput}
                  onInputChange={(_, value) => setSearchInput(value)}
                  getOptionLabel={(option) => option.full_name}
                  groupBy={getRepoGroup}
                  loading={reposLoading}
                  filterOptions={(x) => x} // We handle filtering ourselves
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
                        <Typography
                          variant="caption"
                          sx={{
                            color: afkColors.textTertiary,
                            fontSize: '0.6875rem',
                          }}
                        >
                          Updated{' '}
                          {formatRelativeTime(
                            option.pushed_at || option.updated_at,
                          )}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderGroup={(params) => (
                    <Box key={params.key}>
                      <Typography
                        variant="overline"
                        sx={{
                          px: 2,
                          py: 0.75,
                          display: 'block',
                          color: afkColors.textTertiary,
                          bgcolor: afkColors.surface,
                          borderBottom: `1px solid ${afkColors.border}`,
                        }}
                      >
                        {params.group}
                      </Typography>
                      {params.children}
                    </Box>
                  )}
                  sx={{
                    '& .MuiAutocomplete-groupLabel': {
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: afkColors.textTertiary,
                      bgcolor: afkColors.surface,
                      borderBottom: `1px solid ${afkColors.border}`,
                    },
                    '& .MuiAutocomplete-paper': {
                      bgcolor: afkColors.surface,
                      border: `1px solid ${afkColors.border}`,
                    },
                  }}
                />

                {/* Hidden repoUrl field synced via setValue */}
                <Controller
                  name="repoUrl"
                  control={control}
                  render={() => <input type="hidden" />}
                />

                {/* Branch field - editable even after selection */}
                <Controller
                  name="branch"
                  control={control}
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
                {/* Manual URL mode */}
                <Controller
                  name="repoUrl"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Git Repository URL"
                      helperText="Optional. SSH or HTTPS URL of the git repository to clone"
                      error={!!errors.repoUrl}
                    />
                  )}
                />

                <Controller
                  name="branch"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Branch"
                      helperText="Defaults to main"
                      error={!!errors.branch}
                    />
                  )}
                />
              </>
            )}
          </Box>
        </Box>

        {/* Terminal section */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              borderLeft: `2px solid ${afkColors.accent}`,
              pl: 2,
              mb: 2.5,
            }}
          >
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Terminal Configuration
            </Typography>
          </Box>

          <Controller
            name="terminalMode"
            control={control}
            rules={{ required: 'Terminal mode is required' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.terminalMode}>
                <InputLabel>Terminal Mode</InputLabel>
                <Select {...field} label="Terminal Mode">
                  {Object.entries(TERMINAL_MODE_LABELS).map(
                    ([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            )}
          />

          {/* Inline help instead of sidebar card */}
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="body2"
              sx={{ color: afkColors.textTertiary, fontSize: '0.75rem' }}
            >
              <strong>Simple</strong> &mdash; Claude Code terminal only.{' '}
              <strong>Dual</strong> &mdash; Claude Code + manual web terminal.
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isCreating || missingSettings}
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </Button>
          <Button
            variant="outlined"
            component={Link}
            to={ROUTES.DASHBOARD}
            disabled={isCreating}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateSession;

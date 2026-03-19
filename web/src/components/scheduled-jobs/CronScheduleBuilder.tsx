import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  buildCronExpression,
  parseCronExpression,
  describeCronExpression,
  type SimpleCronConfig,
} from '../../utils/cron-helpers';
import { afkColors } from '../../themes/afk';

interface CronScheduleBuilderProps {
  value: string;
  onChange: (cron: string) => void;
  error?: string;
}

type ScheduleMode = 'simple' | 'advanced';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Specific days of week' },
  { value: 'monthly', label: 'Specific days of month' },
] as const;

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const CRON_PRESETS = [
  { label: 'Daily 9am', value: '0 9 * * *' },
  { label: 'Weekdays 9am', value: '0 9 * * 1-5' },
  { label: 'Weekly Mon 9am', value: '0 9 * * 1' },
  { label: 'Every 6h', value: '0 */6 * * *' },
  { label: 'Monthly 1st', value: '0 9 1 * *' },
];

export const CronScheduleBuilder: React.FC<CronScheduleBuilderProps> = ({
  value,
  onChange,
  error,
}) => {
  const [mode, setMode] = useState<ScheduleMode>('simple');
  const [simpleConfig, setSimpleConfig] = useState<SimpleCronConfig>({
    frequency: 'daily',
    time: { hour: 9, minute: 0 },
    days: [],
  });
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Initialize from prop value
  useEffect(() => {
    const parsed = parseCronExpression(value);
    if (parsed) {
      setMode('simple');
      setSimpleConfig(parsed);
    } else {
      setMode('advanced');
    }
  }, [value]);

  // Update cron expression when simple config changes
  useEffect(() => {
    if (mode === 'simple') {
      const cronExpr = buildCronExpression(simpleConfig);
      if (cronExpr !== value) {
        onChange(cronExpr);
      }
    }
  }, [mode, simpleConfig, onChange, value]);

  const handleFrequencyChange = (frequency: SimpleCronConfig['frequency']) => {
    setSimpleConfig((prev) => ({
      ...prev,
      frequency,
      days: frequency === 'daily' ? [] : prev.days,
    }));
  };

  const handleTimeChange = (field: 'hour' | 'minute', val: number) => {
    setSimpleConfig((prev) => ({
      ...prev,
      time: { ...prev.time, [field]: val },
    }));
  };

  const handleDayToggle = (day: number) => {
    setSimpleConfig((prev) => {
      const days = prev.days || [];
      const newDays = days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day];
      return { ...prev, days: newDays };
    });
  };

  const handleWeekdayPreset = () => {
    setSimpleConfig((prev) => ({ ...prev, days: [1, 2, 3, 4, 5] }));
  };

  const handleWeekendPreset = () => {
    setSimpleConfig((prev) => ({ ...prev, days: [0, 6] }));
  };

  const handleSwitchToAdvanced = () => {
    setMode('advanced');
  };

  const handleSwitchToSimple = () => {
    const parsed = parseCronExpression(value);
    if (parsed) {
      setMode('simple');
      setSimpleConfig(parsed);
    } else {
      setShowResetDialog(true);
    }
  };

  const handleResetAndSwitch = () => {
    const defaultConfig: SimpleCronConfig = {
      frequency: 'daily',
      time: { hour: 9, minute: 0 },
      days: [],
    };
    setSimpleConfig(defaultConfig);
    onChange(buildCronExpression(defaultConfig));
    setMode('simple');
    setShowResetDialog(false);
  };

  const handleAdvancedChange = (newValue: string) => {
    onChange(newValue);
  };

  const renderSimpleMode = () => {
    const selectedDays = simpleConfig.days || [];
    const description = describeCronExpression(simpleConfig);
    const cronExpr = buildCronExpression(simpleConfig);

    return (
      <Box>
        {/* Header with mode switch */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            onClick={handleSwitchToAdvanced}
            variant="text"
            size="small"
            sx={{
              fontSize: '0.75rem',
              color: afkColors.textTertiary,
              textTransform: 'none',
              '&:hover': {
                color: afkColors.accent,
              },
            }}
          >
            Switch to Advanced
          </Button>
        </Box>

        {/* Frequency selector */}
        <TextField
          select
          fullWidth
          label="Frequency"
          value={simpleConfig.frequency}
          onChange={(e) =>
            handleFrequencyChange(
              e.target.value as SimpleCronConfig['frequency'],
            )
          }
          sx={{ mb: 2 }}
        >
          {FREQUENCY_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Day selectors */}
        {simpleConfig.frequency === 'weekly' && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{ mb: 1, color: afkColors.textSecondary }}
            >
              Days of week
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
              {WEEKDAYS.map((day) => (
                <Chip
                  key={day.value}
                  label={day.label}
                  size="small"
                  onClick={() => handleDayToggle(day.value)}
                  variant={
                    selectedDays.includes(day.value) ? 'filled' : 'outlined'
                  }
                  sx={{
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    minWidth: 48,
                    ...(selectedDays.includes(day.value)
                      ? {
                          bgcolor: afkColors.accentMuted,
                          color: afkColors.accent,
                          borderColor: afkColors.accent,
                        }
                      : {
                          borderColor: afkColors.border,
                          color: afkColors.textSecondary,
                        }),
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="Weekdays"
                size="small"
                onClick={handleWeekdayPreset}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  borderColor: afkColors.border,
                  color: afkColors.textTertiary,
                }}
              />
              <Chip
                label="Weekend"
                size="small"
                onClick={handleWeekendPreset}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  borderColor: afkColors.border,
                  color: afkColors.textTertiary,
                }}
              />
            </Box>
          </Box>
        )}

        {simpleConfig.frequency === 'monthly' && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{ mb: 1, color: afkColors.textSecondary }}
            >
              Days of month
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <Chip
                  key={day}
                  label={String(day)}
                  size="small"
                  onClick={() => handleDayToggle(day)}
                  variant={
                    selectedDays.includes(day) ? 'filled' : 'outlined'
                  }
                  sx={{
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    minWidth: 32,
                    height: 28,
                    ...(selectedDays.includes(day)
                      ? {
                          bgcolor: afkColors.accentMuted,
                          color: afkColors.accent,
                          borderColor: afkColors.accent,
                        }
                      : {
                          borderColor: afkColors.border,
                          color: afkColors.textSecondary,
                        }),
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Time picker */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{ mb: 1, color: afkColors.textSecondary }}
          >
            Time
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              select
              label="Hour"
              value={simpleConfig.time.hour}
              onChange={(e) =>
                handleTimeChange('hour', parseInt(e.target.value, 10))
              }
              sx={{ width: 100 }}
            >
              {HOURS.map((h) => (
                <MenuItem key={h} value={h}>
                  {String(h).padStart(2, '0')}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Minute"
              value={simpleConfig.time.minute}
              onChange={(e) =>
                handleTimeChange('minute', parseInt(e.target.value, 10))
              }
              sx={{ width: 100 }}
            >
              {MINUTES.map((m) => (
                <MenuItem key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {/* Preview */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: afkColors.surfaceElevated,
            borderRadius: 1,
            border: `1px solid ${afkColors.border}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: afkColors.textPrimary, mb: 0.5 }}
          >
            {description}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: afkColors.textTertiary,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
            }}
          >
            Cron: {cronExpr}
          </Typography>
        </Box>

        {error && (
          <Typography
            variant="caption"
            sx={{ color: afkColors.danger, mt: 1, display: 'block' }}
          >
            {error}
          </Typography>
        )}
      </Box>
    );
  };

  const renderAdvancedMode = () => {
    return (
      <Box>
        {/* Header with mode switch */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            onClick={handleSwitchToSimple}
            variant="text"
            size="small"
            sx={{
              fontSize: '0.75rem',
              color: afkColors.textTertiary,
              textTransform: 'none',
              '&:hover': {
                color: afkColors.accent,
              },
            }}
          >
            Switch to Simple
          </Button>
        </Box>

        {/* Raw cron input */}
        <TextField
          fullWidth
          label="Cron Expression"
          placeholder="0 9 * * *"
          value={value}
          onChange={(e) => handleAdvancedChange(e.target.value)}
          helperText={
            error || 'Standard 5-field cron (min hour dom month dow)'
          }
          error={!!error}
          sx={{
            mb: 2,
            '& input': {
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.875rem',
            },
          }}
        />

        {/* Preset chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {CRON_PRESETS.map((preset) => (
            <Chip
              key={preset.value}
              label={preset.label}
              size="small"
              onClick={() => handleAdvancedChange(preset.value)}
              variant={value === preset.value ? 'filled' : 'outlined'}
              sx={{
                cursor: 'pointer',
                fontSize: '0.75rem',
                ...(value === preset.value
                  ? {
                      bgcolor: afkColors.accentMuted,
                      color: afkColors.accent,
                      borderColor: afkColors.accent,
                    }
                  : {
                      borderColor: afkColors.border,
                      color: afkColors.textSecondary,
                    }),
              }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <>
      {mode === 'simple' ? renderSimpleMode() : renderAdvancedMode()}

      {/* Reset confirmation dialog */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>Switch to Simple Mode?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
            This cron expression can't be represented in simple mode. Switching
            will reset the schedule to "Every day at 9:00 AM".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)} variant="outlined">
            Stay in Advanced
          </Button>
          <Button onClick={handleResetAndSwitch} variant="contained">
            Reset & Switch
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { afkColors } from '../../themes/afk';
import type { SkillInfo } from '../../api/types';

interface SkillAutocompleteProps {
  skills: SkillInfo[];
  filter: string;
  onSelect: (skillName: string) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export const SkillAutocomplete: React.FC<SkillAutocompleteProps> = ({
  skills,
  filter,
  onSelect,
  onClose,
  anchorEl,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const filtered = React.useMemo(() => {
    const lowerFilter = filter.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerFilter) ||
        s.description.toLowerCase().includes(lowerFilter),
    );
  }, [skills, filter]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  React.useEffect(() => {
    if (!anchorEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        onSelect(filtered[selectedIndex].name);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        if (filtered.length > 0) {
          e.preventDefault();
          onSelect(filtered[selectedIndex].name);
        } else {
          onClose();
        }
      }
    };

    anchorEl.addEventListener('keydown', handleKeyDown, true);
    return () => anchorEl.removeEventListener('keydown', handleKeyDown, true);
  }, [anchorEl, filtered, selectedIndex, onSelect, onClose]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (anchorEl && !anchorEl.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anchorEl, onClose]);

  const listRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const selected = container.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!anchorEl) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        mb: 0.5,
        bgcolor: afkColors.surface,
        border: `1px solid ${afkColors.border}`,
        borderRadius: '8px',
        maxHeight: 240,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderBottom: `1px solid ${afkColors.border}`,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: afkColors.textTertiary,
            fontSize: '0.625rem',
            letterSpacing: '0.08em',
          }}
        >
          Skills
        </Typography>
      </Box>

      <Box ref={listRef} sx={{ overflowY: 'auto', py: 0.5 }}>
        {filtered.length === 0 ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: afkColors.textTertiary }}
            >
              {skills.length === 0
                ? 'No skills available'
                : 'No matching skills'}
            </Typography>
          </Box>
        ) : (
          filtered.map((skill, index) => (
            <Box
              key={skill.name}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(skill.name);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              sx={{
                px: 1.5,
                py: 0.75,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'baseline',
                gap: 1.5,
                bgcolor:
                  index === selectedIndex
                    ? afkColors.accentMuted
                    : 'transparent',
                '&:hover': {
                  bgcolor: afkColors.accentMuted,
                },
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.8rem',
                  color: afkColors.accent,
                  flexShrink: 0,
                }}
              >
                /{skill.name}
              </Typography>
              <Typography
                component="span"
                noWrap
                sx={{
                  fontSize: '0.75rem',
                  color: afkColors.textSecondary,
                }}
              >
                {skill.description}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
};

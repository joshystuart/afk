import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { afkColors } from '../themes/afk';

type AnimationPhase = 'blink' | 'spin';

const PHASES: { phase: AnimationPhase; duration: number }[] = [
  { phase: 'blink', duration: 3000 },
  { phase: 'spin', duration: 1500 },
];

const ANIMATION_MAP: Record<AnimationPhase, string> = {
  blink: 'blink 1s step-end infinite',
  spin: 'cursor-spin 0.75s ease-in-out infinite',
};

const SIZE_MAP = {
  sm: { width: 6, height: 12 },
  md: { width: 8, height: 16 },
  lg: { width: 10, height: 20 },
};

interface TerminalCursorProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const TerminalCursor: React.FC<TerminalCursorProps> = ({
  size = 'md',
  color = afkColors.accent,
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const currentPhase = PHASES[phaseIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % PHASES.length);
    }, currentPhase.duration);
    return () => clearTimeout(timer);
  }, [phaseIndex, currentPhase.duration]);

  const { width, height } = SIZE_MAP[size];

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width,
        height,
        bgcolor: color,
        borderRadius: '1px',
        verticalAlign: 'middle',
        animation: ANIMATION_MAP[currentPhase.phase],
      }}
    />
  );
};

export { TerminalCursor };

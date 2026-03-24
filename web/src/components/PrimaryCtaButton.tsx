import { forwardRef } from 'react';
import Button, { type ButtonProps } from '@mui/material/Button';

/**
 * Primary call-to-action: contained accent button. Label and icons stay light on
 * hover; only the background shifts (see `themes/afk.ts`). Use for main actions,
 * including navigation via `component={Link}` and `to`.
 */
const PrimaryCtaButton = forwardRef(function PrimaryCtaButton(
  { variant = 'contained', color = 'primary', ...props }: ButtonProps,
  ref,
) {
  return <Button ref={ref} variant={variant} color={color} {...props} />;
}) as typeof Button;

export { PrimaryCtaButton };

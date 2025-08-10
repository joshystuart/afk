import React, { forwardRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  useTheme,
} from '@mui/material';

interface MainCardProps {
  border?: boolean;
  boxShadow?: boolean;
  children: React.ReactNode;
  content?: boolean;
  contentSX?: object;
  darkTitle?: boolean;
  divider?: boolean;
  elevation?: number;
  secondary?: React.ReactNode;
  shadow?: string;
  sx?: object;
  title?: React.ReactNode | string;
  modal?: boolean;
  [key: string]: any;
}

const headerSX = {
  p: 2.5,
  '& .MuiCardHeader-action': { m: '0px auto', alignSelf: 'center' },
};

const MainCard = forwardRef<HTMLDivElement, MainCardProps>(
  (
    {
      border = true,
      boxShadow,
      children,
      content = true,
      contentSX = {},
      darkTitle,
      divider = true,
      elevation,
      secondary,
      shadow,
      sx = {},
      title,
      modal = false,
      ...others
    },
    ref,
  ) => {
    const theme = useTheme();
    boxShadow = theme.palette.mode === 'dark' ? boxShadow || true : boxShadow;

    return (
      <Card
        elevation={elevation || 0}
        ref={ref}
        {...others}
        sx={{
          border: border ? '1px solid' : 'none',
          borderRadius: 2,
          borderColor:
            theme.palette.mode === 'dark'
              ? theme.palette.divider
              : theme.palette.grey[800],
          boxShadow:
            boxShadow && (!border || theme.palette.mode === 'dark')
              ? shadow || theme.shadows[1]
              : 'inherit',
          ':hover': {
            boxShadow: boxShadow ? shadow || theme.shadows[1] : 'inherit',
          },
          '& pre': {
            m: 0,
            p: '16px !important',
            fontFamily: theme.typography.fontFamily,
            fontSize: '0.75rem',
          },
          ...(modal && {
            position: 'absolute' as const,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: `calc(100vw - 48px)`, sm: 'auto' },
            '& .MuiCardContent-root': {
              overflowY: 'auto',
              minHeight: 'auto',
              maxHeight: `calc(100vh - 200px)`,
            },
          }),
          ...sx,
        }}
      >
        {/* card header and action */}
        {!darkTitle && title && (
          <CardHeader
            sx={headerSX}
            titleTypographyProps={{ variant: 'subtitle1' }}
            title={title}
            action={secondary}
          />
        )}
        {darkTitle && title && (
          <CardHeader
            sx={{
              ...headerSX,
              '& .MuiCardHeader-title': { color: theme.palette.primary.main },
            }}
            titleTypographyProps={{ variant: 'subtitle1' }}
            title={title}
            action={secondary}
          />
        )}

        {/* content & header divider */}
        {title && divider && <Divider />}

        {/* card content */}
        {content && <CardContent sx={contentSX}>{children}</CardContent>}
        {!content && children}
      </Card>
    );
  },
);

MainCard.displayName = 'MainCard';

export default MainCard;

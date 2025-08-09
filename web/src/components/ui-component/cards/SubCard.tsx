import React, { forwardRef } from 'react';
import { Card, CardContent, CardHeader, Divider, useTheme } from '@mui/material';

interface SubCardProps {
  children: React.ReactNode;
  content?: boolean;
  contentSX?: object;
  darkTitle?: boolean;
  divider?: boolean;
  secondary?: React.ReactNode;
  sx?: object;
  title?: React.ReactNode | string;
  [key: string]: any;
}

const headerSX = {
  p: 2,
  '& .MuiCardHeader-action': { m: '0px auto', alignSelf: 'center' }
};

const SubCard = forwardRef<HTMLDivElement, SubCardProps>(
  (
    {
      children,
      content = true,
      contentSX = {},
      darkTitle,
      divider = true,
      secondary,
      sx = {},
      title,
      ...others
    },
    ref
  ) => {
    const theme = useTheme();

    return (
      <Card
        elevation={0}
        ref={ref}
        {...others}
        sx={{
          border: '1px solid',
          borderRadius: 1,
          borderColor: theme.palette.divider,
          ':hover': {
            boxShadow: theme.shadows[1]
          },
          ...sx
        }}
      >
        {/* card header and action */}
        {!darkTitle && title && (
          <CardHeader
            sx={headerSX}
            titleTypographyProps={{ variant: 'h5' }}
            title={title}
            action={secondary}
          />
        )}
        {darkTitle && title && (
          <CardHeader
            sx={{ ...headerSX, '& .MuiCardHeader-title': { color: theme.palette.primary.main } }}
            titleTypographyProps={{ variant: 'h5' }}
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
  }
);

SubCard.displayName = 'SubCard';

export default SubCard;
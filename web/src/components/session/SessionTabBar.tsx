import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { afkColors } from '../../themes/afk';
import type { SessionTab } from '../../hooks/useSessionTabs';

interface SessionTabBarProps {
  tabs: SessionTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const SessionTabBar: React.FC<SessionTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    const tab = tabs[newValue];
    if (tab && !tab.disabled) {
      onTabChange(tab.id);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: afkColors.surface,
        borderBottom: `1px solid ${afkColors.border}`,
      }}
    >
      <Tabs
        value={activeIndex === -1 ? 0 : activeIndex}
        onChange={handleChange}
        sx={{ minHeight: 40 }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            icon={tab.icon as React.ReactElement}
            iconPosition="start"
            label={
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                {tab.label}
                {tab.badge && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -4,
                      right: -10,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: afkColors.accent,
                      animation: 'pulse-dot 2s ease-in-out 1',
                    }}
                  />
                )}
              </Box>
            }
            disabled={tab.disabled}
            sx={{ minHeight: 40 }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

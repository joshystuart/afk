import React from 'react';
import {
  Folder,
  FolderOpen,
  Code,
  DataObject,
  Description,
  Palette,
  Language,
  InsertDriveFileOutlined,
  Image as ImageIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import { afkColors } from '../../../themes/afk';

interface FileIconProps {
  name: string;
  type: 'file' | 'directory';
  expanded?: boolean;
}

const ICON_SIZE = 16;

const getExtension = (name: string): string => {
  const idx = name.lastIndexOf('.');
  if (idx < 0 || idx === name.length - 1) return '';
  return name.slice(idx + 1).toLowerCase();
};

const fileIconFor = (ext: string): React.ReactElement => {
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return (
        <Code sx={{ fontSize: ICON_SIZE, color: afkColors.textTertiary }} />
      );
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
      return (
        <DataObject
          sx={{ fontSize: ICON_SIZE, color: afkColors.textTertiary }}
        />
      );
    case 'md':
    case 'mdx':
    case 'txt':
    case 'rst':
      return (
        <Description
          sx={{ fontSize: ICON_SIZE, color: afkColors.textTertiary }}
        />
      );
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return (
        <Palette sx={{ fontSize: ICON_SIZE, color: afkColors.textTertiary }} />
      );
    case 'html':
    case 'htm':
    case 'xml':
      return (
        <Language sx={{ fontSize: ICON_SIZE, color: afkColors.textTertiary }} />
      );
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return (
        <ImageIcon
          sx={{ fontSize: ICON_SIZE, color: afkColors.textTertiary }}
        />
      );
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'fish':
      return (
        <TerminalIcon
          sx={{ fontSize: ICON_SIZE, color: afkColors.textTertiary }}
        />
      );
    default:
      return (
        <InsertDriveFileOutlined
          sx={{ fontSize: ICON_SIZE, color: afkColors.textTertiary }}
        />
      );
  }
};

export const FileIcon: React.FC<FileIconProps> = ({ name, type, expanded }) => {
  if (type === 'directory') {
    const Icon = expanded ? FolderOpen : Folder;
    return <Icon sx={{ fontSize: ICON_SIZE, color: afkColors.accent }} />;
  }
  return fileIconFor(getExtension(name));
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CREATE_SESSION: '/sessions/create',
  SESSION_DETAILS: '/sessions/:id',
  getSessionDetails: (id: string) => `/sessions/${id}`,
} as const;

export const SESSION_STATUS_COLORS = {
  pending: '#FFA726',
  creating_container: '#42A5F5',
  starting_container: '#66BB6A',
  running: '#4CAF50',
  stopping: '#FF7043',
  stopped: '#9E9E9E',
  failed: '#F44336',
  deleting: '#FF5722',
} as const;

export const SESSION_STATUS_LABELS = {
  pending: 'Pending',
  creating_container: 'Creating Container',
  starting_container: 'Starting Container',
  running: 'Running',
  stopping: 'Stopping',
  stopped: 'Stopped',
  failed: 'Failed',
  deleting: 'Deleting',
} as const;

export const TERMINAL_MODE_LABELS = {
  claude: 'Claude Only',
  manual: 'Manual Only',
  dual: 'Dual Terminal',
} as const;

export const DEFAULT_DOCKER_IMAGES = [
  {
    value: 'afk/dev:latest',
    label: 'AFK Development (Latest)',
    description: 'Pre-configured development environment with common tools',
  },
  {
    value: 'afk/node:18',
    label: 'Node.js 18',
    description: 'Node.js 18 with npm and common development tools',
  },
  {
    value: 'afk/python:3.11',
    label: 'Python 3.11',
    description: 'Python 3.11 with pip and common data science libraries',
  },
  {
    value: 'ubuntu:22.04',
    label: 'Ubuntu 22.04',
    description: 'Clean Ubuntu 22.04 base image',
  },
] as const;

export const API_ENDPOINTS = {
  SESSIONS: '/sessions',
  HEALTH: '/health',
} as const;

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  SUBSCRIBE_SESSION: 'subscribe.session',
  SUBSCRIBE_LOGS: 'subscribe.logs',
  UNSUBSCRIBE_SESSION: 'unsubscribe.session',
  SESSION_STATUS: 'session.status',
  SESSION_LOGS: 'session.logs',
} as const;
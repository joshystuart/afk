# AFK - Away From Keyboard

AFK is a remote terminal access service that enables running Claude Code in Docker containers with web-based terminal access. The project provides containerized development environments with dual terminal sessions (Claude + manual access), automatic git integration, and a modern web interface for session management.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (for container management)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/joshystuart/afk.git
cd afk
```

2. Install dependencies:

```bash
npm run install:all
```

3. Configure environment variables:

```bash
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

4. Start the application:

```bash
# Development mode (both server and web client with hot reload)
npm run dev

# Production mode
npm run start
```

The web interface will be available at `http://localhost:5173` (development) or `http://localhost:4173` (production).
The server API will be available at `http://localhost:3001`.

## 📁 Project Structure

```
afk/
├── server/         # NestJS backend API
├── web/            # React frontend application
├── docker/         # Docker image
├── docs/           # Project documentation
└── package.json    # Root package with scripts
```

## 🛠 Development

### Available Scripts

From the root directory:

- `npm run dev` - Start both server and web client in development mode
- `npm run start` - Start both applications in production mode
- `npm run install:all` - Install dependencies for all packages
- `npm run lint` - Run linting on both server and web
- `npm run test` - Run server tests
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted correctly

### Server Scripts

```bash
cd server
npm run start:dev    # Development with hot reload
npm run start        # Production mode
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Web Client Scripts

```bash
cd web
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Formatting

This project uses Prettier for consistent code formatting. Configuration is defined in `.prettierrc`.

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

Prettier is configured with:

- Single quotes for strings
- Trailing commas
- 2-space indentation
- 80-character line width
- Semicolons required

## ⚙️ Configuration

### Server Configuration

Configure the server by editing `server/.env`:

```bash
# Application Configuration
PORT=3001
NODE_ENV=development

# Docker Configuration (optional - defaults provided)
# DOCKER_IMAGE_NAME=afk:latest
# DOCKER_START_PORT=7681
# DOCKER_END_PORT=7780
```

All other settings use sensible defaults. See `server/src/libs/config/` for available configuration options.

## 🏗 Architecture

- **Backend**: NestJS with TypeScript, SQLite database, WebSocket support
- **Frontend**: React with TypeScript, Material-UI, React Query
- **Container Management**: Docker integration for session containers
- **Real-time Updates**: WebSocket connections for session status

## 📋 Features

### Session Management

- Create and manage containerized development sessions
- Real-time session status updates via WebSocket
- Start, stop, restart, and delete sessions
- Session lifecycle management with automatic cleanup

### Terminal Access

- Embedded terminal access in the browser
- Support for multiple terminal modes (debug, dual, normal)
- External terminal access in new windows
- Responsive design for desktop and mobile

### Web Interface

- Modern React-based dashboard
- Real-time session monitoring
- Session creation and configuration
- Settings management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and test them
4. Run linting: `npm run lint`
5. Run tests: `npm run test`
6. Commit your changes: `git commit -am 'Add my feature'`
7. Push to the branch: `git push origin feature/my-feature`
8. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Issues

If you encounter any issues or have feature requests, please create an issue on GitHub.

# AFK

AFK is a local web app for running Claude Code in isolated Docker sessions. Each session gives you a chat UI plus a shell, with state preserved across restarts.

![AFK dashboard](docs/afk-dashboard.png)

## Local Setup

### Requirements

- Node.js 24+
- npm
- Docker
- Claude CLI

### 1. Clone and install

```bash
git clone https://github.com/joshystuart/afk.git
cd afk
npm run install:all
```

### 2. Copy the env files

```bash
# macOS
cp server/src/config/.env.mac.yaml server/.env.yaml

# Windows
# cp server/src/config/.env.windows.yaml server/.env.yaml

cp web/.env.example web/.env
```

For most local setups, the defaults are fine. If you want different admin credentials, edit `server/.env.yaml`.

### 3. Start the app

```bash
npm run start:web:dev
```

Open:

- Web app: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:4919](http://localhost:4919)
- Swagger: [http://localhost:4919/api/docs](http://localhost:4919/api/docs)

Log in with the admin credentials from `server/.env.yaml`. By default that is:

- Username: `admin`
- Password: `password123`

![AFK login](docs/afk-login.png)

## First Use

### Claude token

AFK needs a Claude Code token before you can use sessions.

```bash
claude setup-token
```

Then open **Settings** in AFK and paste in your token.

![AFK settings](docs/afk-settings.png)

### Repo access

Pick one:

- Connect GitHub in **Settings** if you want the easiest repo flow.
- Add an SSH key in **Settings** if you use SSH-based git access.

## Sessions

Create a session, pick a repo, choose an image, and start coding.

![Create session](docs/afk-create-session.png)

Once a session is running, you get the main chat view plus a shell for manual commands.

![Session details](docs/afk-session-details.png)

## Notes

- You do not need to build AFK Docker images for normal local development. AFK will pull the default images when needed.
- The default built-in images include Node.js, Python, Go, Rust, .NET, and Java.
- `npm run start` runs the built app instead of the dev servers.

## Useful Commands

```bash
npm run start:web:dev  # run server + web in dev mode
npm run start          # run the built app
npm run build          # build server, web, and electron
npm run test           # run server tests
npm run lint           # run linting
npm run format         # format the repo
```

## License

MIT

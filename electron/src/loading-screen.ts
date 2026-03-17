import type { BrowserWindow } from 'electron';

const LOADING_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    -webkit-app-region: drag;
    user-select: none;
  }
  .container { text-align: center; }
  .logo {
    font-size: 48px;
    font-weight: 700;
    letter-spacing: 8px;
    margin-bottom: 40px;
    color: #fff;
  }
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #333;
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  #status { font-size: 13px; color: #555; }
</style></head>
<body><div class="container">
  <div class="logo">AFK</div>
  <div class="spinner"></div>
  <p id="status">Starting up\u2026</p>
</div></body></html>`;

export function getLoadingURL(): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(LOADING_HTML)}`;
}

export function setLoadingStatus(
  window: BrowserWindow | null,
  message: string,
): void {
  window?.webContents
    .executeJavaScript(
      `document.getElementById('status').textContent = ${JSON.stringify(message)}`,
    )
    .catch(() => {});
}

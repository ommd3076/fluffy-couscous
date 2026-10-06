import { spawn } from 'node:child_process';
import fs from 'node:fs';

const browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'C:\\Users\\ommd3\\.gemini\\antigravity\\test_browser_profile_cam';
const port = 9225;

const args = [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  'http://127.0.0.1:3000',
];

console.log('Launching browser with fake camera device...');
const proc = spawn(browserPath, args, { stdio: 'ignore' });

async function waitForPort() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Timeout waiting for browser');
}

async function run() {
  try {
    await waitForPort();
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    const page = pages.find(p => p.url.includes('3000') || p.type === 'page');
    if (!page?.webSocketDebuggerUrl) return;

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, ...msg.params.args.map(a => a.value || a.description));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
      } else if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);
    await send('Runtime.enable');
    await send('Page.enable');

    await new Promise(r => setTimeout(r, 2000));

    console.log('Clicking "Enable Camera & Start AR"...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Camera'));
        if (btn) btn.click();
      })()`
    });

    // Wait for camera initialization and model loading
    console.log('Waiting 6 seconds for camera & models...');
    await new Promise(r => setTimeout(r, 6000));

    const checkState = await send('Runtime.evaluate', {
      expression: `(() => {
        const video = document.querySelector('video');
        const threeCanvas = document.querySelector('.three-canvas-container canvas');
        const portalCanvas = document.querySelector('.portal-canvas');
        const header = document.querySelector('.header-hud');
        const footer = document.querySelector('.bottom-guidance');
        const permission = document.querySelector('.permission-screen');

        let videoPixelColor = null;
        let canvasPixelColor = null;

        if (video && video.videoWidth > 0) {
          try {
            const off = document.createElement('canvas');
            off.width = video.videoWidth;
            off.height = video.videoHeight;
            const ctx = off.getContext('2d');
            ctx.drawImage(video, 0, 0);
            const p = ctx.getImageData(video.videoWidth / 2, video.videoHeight / 2, 1, 1).data;
            videoPixelColor = [p[0], p[1], p[2], p[3]];
          } catch (e) {
            videoPixelColor = e.message;
          }
        }

        return {
          permissionVisible: !!permission,
          video: video ? {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            paused: video.paused,
            readyState: video.readyState,
            currentTime: video.currentTime,
            srcObjectPresent: !!video.srcObject,
            styleOpacity: video.style.opacity,
            pixelSample: videoPixelColor
          } : null,
          threeCanvas: threeCanvas ? {
            width: threeCanvas.width,
            height: threeCanvas.height,
            stylePointerEvents: threeCanvas.style.pointerEvents,
            stylePosition: threeCanvas.style.position
          } : null,
          portalCanvasPresent: !!portalCanvas,
          headerButtons: header ? Array.from(header.querySelectorAll('button')).map(b => b.getAttribute('title') || b.getAttribute('aria-label') || b.innerText) : [],
          footerText: footer ? footer.innerText.replace(/\\n/g, ' ') : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Live Camera State Result:\n', JSON.stringify(checkState.result?.value, null, 2));

    // Capture screenshot
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('browser_real_camera.png', Buffer.from(screenshot.data, 'base64'));
    console.log('Screenshot saved to browser_real_camera.png');

    ws.close();
  } catch (err) {
    console.error('Error running test:', err);
  } finally {
    proc.kill();
  }
}

run();

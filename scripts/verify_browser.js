import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  console.log('Launching headless browser...');
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1280,720',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      const list = await res.json();
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error('Failed to get WebSocket debugger URL');
    edgeProc.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://localhost:3000/?sim=1' });
  await new Promise(r => setTimeout(r, 3000));

  // Click on the first Assign Role button
  console.log('Clicking Assign Role button...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const assignBtn = btns.find(b => b.innerText.includes('Assign Role'));
      if (assignBtn) {
        assignBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });

  await new Promise(r => setTimeout(r, 500));

  // Click Nick Wilde in the popover
  console.log('Selecting Nick Wilde...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nickBtn = btns.find(b => b.innerText.includes('Nick Wilde'));
      if (nickBtn) {
        nickBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });

  // Wait for face to pass into portal center and trigger 3D transformation
  console.log('Waiting for face to transform through portal...');
  await new Promise(r => setTimeout(r, 4000));

  const transformedState = await send('Runtime.evaluate', {
    expression: `(() => {
      const footer = document.querySelector('footer');
      const footerText = footer ? footer.innerText.replace(/\\n/g, ' ') : '';
      const faceButtons = Array.from(document.querySelectorAll('.face-overlay button')).map(b => b.innerText);
      return {
        footerText,
        faceButtons,
      };
    })()`,
    returnByValue: true
  });

  console.log('Transformed State:', JSON.stringify(transformedState.result.value, null, 2));

  // Capture transformed screenshot
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const imgBuffer = Buffer.from(screenshot.data, 'base64');
  fs.writeFileSync(path.resolve('browser_transformed.png'), imgBuffer);
  console.log('Transformed screenshot saved to browser_transformed.png');

  ws.close();
  edgeProc.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

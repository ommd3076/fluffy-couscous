import { spawn } from 'node:child_process';
import fs from 'node:fs';

const browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'C:\\Users\\ommd3\\.gemini\\antigravity\\test_browser_profile_sim_fresh';
const port = 9228;
const proc = spawn(browserPath, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'http://127.0.0.1:3000/?sim=1'
], { stdio: 'ignore' });

async function run() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('3000') || p.type === 'page') || pages[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const cbs = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && cbs.has(msg.id)) {
      cbs.get(msg.id)(msg.result);
      cbs.delete(msg.id);
    }
  };
  function send(method, params = {}) {
    return new Promise(r => {
      const reqId = id++;
      cbs.set(reqId, r);
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  console.log('Navigating to http://127.0.0.1:3000/?sim=1...');
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/?sim=1' });
  await new Promise(r => setTimeout(r, 3000));

  const initialButtons = await send('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('button')).map(b => b.innerText)`,
    returnByValue: true
  });
  console.log('Initial buttons:', initialButtons.result?.value);

  console.log('Clicking Assign Role on Face 1...');
  const clickResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Assign Role'));
      if (btns.length > 1) {
        btns[1].click();
        return 'Clicked Assign Role on moving Face 1. Count was: ' + btns.length;
      } else if (btns.length > 0) {
        btns[0].click();
        return 'Clicked Assign Role. Count was: ' + btns.length;
      }
      return 'No Assign Role button found';
    })()`,
    returnByValue: true
  });
  console.log('Assign button click:', clickResult.result?.value);
  await new Promise(r => setTimeout(r, 800));

  console.log('Selecting Nick Wilde...');
  const selectResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const nickBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Nick Wilde'));
      if (nickBtn) {
        nickBtn.click();
        return 'Clicked Nick Wilde';
      }
      return 'Nick Wilde button not found. Available buttons: ' + Array.from(document.querySelectorAll('button')).map(b => b.innerText).join(', ');
    })()`,
    returnByValue: true
  });
  console.log('Select result:', selectResult.result?.value);

  // Wait for face to move into portal and transform
  console.log('Waiting for face to move into portal...');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const check = await send('Runtime.evaluate', {
      expression: `document.querySelector('.bottom-guidance')?.innerText.includes('Transformation active')`,
      returnByValue: true
    });
    if (check.result?.value) {
      console.log(`Transformed at +${((i + 1) * 0.5).toFixed(1)}s!`);
      break;
    }
  }

  const state = await send('Runtime.evaluate', {
    expression: `(() => {
      const footer = document.querySelector('.bottom-guidance');
      const nickPill = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Nick'));
      const threeCanvas = document.querySelector('.three-canvas-container canvas');
      return {
        footerText: footer ? footer.innerText : null,
        nickPillText: nickPill ? nickPill.innerText : null,
        hasThreeCanvas: !!threeCanvas,
      };
    })()`,
    returnByValue: true
  });
  console.log('Post-transform State:', JSON.stringify(state.result?.value, null, 2));

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('current_sim_transformed.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved current_sim_transformed.png');

  ws.close();
  proc.kill();
}
run();

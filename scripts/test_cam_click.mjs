import { spawn } from 'node:child_process';

const browserPath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const userDataDir = 'C:\\Users\\ommd3\\.gemini\\antigravity\\test_browser_profile_3';
const port = 9224;

const args = [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'http://localhost:3000',
];

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
    const page = pages.find(p => p.url.includes('localhost:3000'));
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

    console.log('--- Clicking "Enable Camera & Start AR" ---');
    const clickCamRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Camera'));
        if (!btn) return 'Button not found';
        btn.click();
        return 'Clicked';
      })()`,
      returnByValue: true
    });
    console.log('Click result:', clickCamRes.result?.value);

    await new Promise(r => setTimeout(r, 2000));

    const stateAfterClick = await send('Runtime.evaluate', {
      expression: `({
        bodyText: document.body.innerText,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()),
        promptVisible: !!document.querySelector('.permission-screen')
      })`,
      returnByValue: true
    });
    console.log('State after camera click:\n', JSON.stringify(stateAfterClick, null, 2));

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    proc.kill();
  }
}

run();

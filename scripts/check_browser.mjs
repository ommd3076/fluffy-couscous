import { spawn } from 'node:child_process';
import http from 'node:http';

const browserPath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const userDataDir = 'C:\\Users\\ommd3\\.gemini\\antigravity\\test_browser_profile';
const port = 9222;

const args = [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'http://localhost:3000',
];

console.log('Launching browser...');
const proc = spawn(browserPath, args, { stdio: 'ignore' });

// Wait for browser debug port to be ready
async function waitForPort() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        console.log('Browser debug port ready!');
        return;
      }
    } catch (e) {
      // wait
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Timeout waiting for browser');
}

async function run() {
  try {
    await waitForPort();
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    console.log('Open pages:', pages.map(p => ({ title: p.title, url: p.url })));

    const page = pages.find(p => p.url.includes('localhost:3000'));
    if (!page || !page.webSocketDebuggerUrl) {
      console.log('No page found with webSocketDebuggerUrl');
      return;
    }

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, ...msg.params.args.map(a => a.value || a.description));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
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

    console.log('Waiting 3 seconds for page to mount and run...');
    await new Promise(r => setTimeout(r, 3000));

    // Evaluate DOM state
    const evalRes = await send('Runtime.evaluate', {
      expression: `({
        title: document.title,
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        rootHtml: document.getElementById('root')?.innerHTML?.slice(0, 500),
        buttons: Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.innerText,
          rect: b.getBoundingClientRect(),
          display: window.getComputedStyle(b).display,
          visibility: window.getComputedStyle(b).visibility,
          opacity: window.getComputedStyle(b).opacity
        })),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText),
        hasCanvas: !!document.querySelector('canvas'),
        hasVideo: !!document.querySelector('video')
      })`,
      returnByValue: true
    });

    console.log('DOM Evaluation Result:\n', JSON.stringify(evalRes.result?.value, null, 2));

    ws.close();
  } catch (err) {
    console.error('Error running browser test:', err);
  } finally {
    proc.kill();
  }
}

run();

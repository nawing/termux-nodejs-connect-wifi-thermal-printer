const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const escpos = require('escpos');
escpos.Network = require('escpos-network');

const WebSocket = require('ws');
const net = require('net');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const PRINTER_PORT = 9100;

const app = express();
const port = 3000;

let config = {
  printerIp: '192.168.100.50',
  wsUrl: 'ws://api.myanmarhoneyfood.com:6680',
};


async function detectPrinterIP() {
  console.log('🔍 Scanning for printer on network...');
  try {
    const { stdout } = await execAsync(`nmap -p ${PRINTER_PORT} --open ${NETWORK_SUBNET} -oG -`);
    const match = stdout.match(/Host: ([\d.]+).*Ports: 9100\/open/);
    if (!match) throw new Error('No printer found on the network.');
    console.log(`✅ Printer detected at IP: ${match[1]}`);
    return match[1];
  } catch (err) {
    console.error('❌ Printer detection failed:', err.message);
    // throw err;
  }
}

let wsClient = null;
let wsConnected = false;
let printerConnected = false;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve HTML UI
app.get('/', (req, res) => {
  const wsStatus = wsConnected ? '🟢 Connected' : '🔴 Disconnected';
  const printerStatus = printerConnected ? '🟢 Connected' : '🔴 Unknown / Not Connected Yet';

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Printer Config</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="container py-5">
    <div class="row">
      <div class="col-md-12">
        <h3>Printer Configuration</h3>
      </div>
      <div class="col-lg-6">
        <div class="card mb-3">
          <div class="card-body">
            <form method="POST" action="/update" class="mb-3">
              <div class="mb-3">
                <label class="form-label">Printer IP</label>
                <input type="text" class="form-control" name="printerIp" value="${config.printerIp}">
              </div>
              <div class="mb-3">
                <label class="form-label">WebSocket URL</label>
                <input type="text" class="form-control" name="wsUrl" value="${config.wsUrl}">
              </div>
              <button type="submit" class="btn btn-primary">Update & Connect</button>
            </form>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card mb-3">
          <div class="card-body">
            <table class="table">
              <tbody>
                <tr>
                  <th colspan="2"> Status </th>
                </tr>
                <tr>
                  <th scope="col"> WebSocket </th>
                  <td class="text-right"> ${wsStatus} </td>
                </tr>
                <tr>
                  <th scope="col"> Printer </th>
                  <td class="text-right"> ${printerStatus} </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    </body>
    </html>
  `);
});

// Update settings
app.post('/update', (req, res) => {
  const { printerIp, wsUrl } = req.body;
  config.printerIp = printerIp || config.printerIp;
  config.wsUrl = wsUrl || config.wsUrl;
  wsConnected = false;
  restartWebSocket();
  res.redirect('/');
});


// Print function
async function printTextAndQR(qrString, text) {
  const device = new escpos.Network(config.printerIp);
  const printer = new escpos.Printer(device);

  return new Promise((resolve, reject) => {
    device.open((err) => {
      if (err) {
        printerConnected = false;
        return reject(err);
      }
      printerConnected = true;
      printer
        .encode('GB18030')
        .text(text)
        .qrimage(qrString || '', { type: 'png', size: 10 }, () => {
          printer.cut().close();
          resolve();
        });
    });
  });
}

// WebSocket logic
function restartWebSocket() {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.close();
  }
  wsClient = new WebSocket(config.wsUrl);
  wsClient.on('open', () => {
    console.log('✅ WebSocket connected.');
    wsConnected = true;
  });
  wsClient.on('message', async (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      await printTextAndQR(parsed.qrString, parsed.text);
    } catch (e) {
      console.error('Failed to print:', e.message);
    }
  });
  wsClient.on('close', () => {
    console.log('❌ WebSocket disconnected.');
    wsConnected = false;
    setTimeout(restartWebSocket, 5000);
  });
  wsClient.on('error', err => {
    console.log('⚠️ WebSocket error:', err.message);
    wsConnected = false;
  });
}

// Start everything
app.listen(port, async () => {
  console.log(`🖨️ Server running on http://localhost:${port}`);
  restartWebSocket();
  config.printerIp = await detectPrinterIP();
});

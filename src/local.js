const WebSocket = require('ws');
const net = require('net');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const WS_SERVER = 'wss://your-public-server:8080'; // Your WebSocket server URL
const PRINTER_PORT = 9100;
const NETWORK_SUBNET = '192.168.1.0/24'; // Your local network range for nmap



let ws;
let reconnectInterval = 1000; // start 1 sec
const maxReconnectInterval = 30000;

let detectedPrinterIP = null;

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
    throw err;
  }
}
/**
 * generateQRCodeCommand
 * @param {*} qrString
 * @returns
 */
function generateQRCodeCommand(qrString) {
  if (!qrString || typeof qrString !== 'string') return '';
  const GS = '\x1D';
  const storeLen = qrString.length + 3;
  const pL = storeLen % 256;
  const pH = Math.floor(storeLen / 256);
  return (
    GS + '(k' + String.fromCharCode(pL, pH) + '\x31\x50\x30' + qrString +
    GS + '(k\x03\x00\x31\x51\x30'
  );
}
/**
 * sendToPrinter
 * @param {*} ip
 * @param {*} body
 * @returns
 */
function sendToPrinter(ip, body) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.connect(PRINTER_PORT, ip, () => {
      const ESC = '\x1B';
      const qr = generateQRCodeCommand(body.qrString);
      const cut = ESC + 'd' + '\x05' + '\x1D' + 'V' + '\x00';
      client.write(ESC + '@'); // Init
      client.write(body.text);
      if (qr) client.write(qr);
      client.write(cut);
      client.end();
      resolve();
    });
    client.on('error', err => {
      reject(new Error(`Printer connection failed: ${err.message}`));
    });
  });
}

function connect() {
  ws = new WebSocket(WS_SERVER);
  ws.on('open', async () => {
    console.log('🌐 Connected to print job server');
    try {
      detectedPrinterIP = await detectPrinterIP();
    } catch (err) {
      console.error('⚠️ Cannot detect printer IP now. Will retry on reconnect.');
      detectedPrinterIP = null;
    }
    reconnectInterval = 1000; // reset backoff after successful connect
  });

  ws.on('message', async data => {
    if (!detectedPrinterIP) {
      console.error('❌ No printer IP detected. Cannot print.');
      return;
    }

    try {
      const body = JSON.parse(data);
      console.log('🖨 Received print job:', body);
      await sendToPrinter(detectedPrinterIP, body);
      console.log('✅ Print successful');
    } catch (err) {
      console.error('❌ Print failed:', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`❌ Disconnected. Reconnecting in ${reconnectInterval / 1000}s...`);
    attemptReconnect();
  });

  ws.on('error', (err) => {
    console.error('⚠️ WebSocket error:', err.message);
  });
}

function attemptReconnect() {
  setTimeout(() => {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    reconnectInterval = Math.min(reconnectInterval * 2, maxReconnectInterval);
    console.log('🔄 Attempting to reconnect...');
    connect();
  }, reconnectInterval);
}

// Start connection loop
connect();

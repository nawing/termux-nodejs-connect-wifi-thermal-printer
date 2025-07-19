const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const net = require('net');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);
const app = express();

app.use(cors());
app.use(bodyParser.json());

// 🔧 Set your local subnet (e.g., 192.168.1.0/24 or 192.168.0.0/24)
const NETWORK_SUBNET = '192.168.1.0/24';
const PRINTER_PORT = 9100;

// 🔍 Detect printer IP using nmap
async function detectPrinterIP() {
  const { stdout } = await execAsync(`nmap -p ${PRINTER_PORT} --open ${NETWORK_SUBNET} -oG -`);
  const match = stdout.match(/Host: ([\d.]+).*Ports: 9100\/open/);
  if (!match) throw new Error('No printer found on the network.');
  return match[1];
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
 * sendToPrinterRaw
 * @param {*} ip
 * @param {*} body
 * @returns
 */
async function sendToPrinter(ip, body) {
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
// 🚀 Main print endpoint
app.post('/print', async (req, res) => {
  const body = req.body;
  try {
    const ip = await detectPrinterIP();
    await sendToPrinter(ip, body);
    console.log(`✅ Printed to ${ip}`);
    res.send({ success: true, message: `Printed to ${ip}` });
  } catch (err) {
    console.error('❌', err.message);
    res.status(500).send({ success: false, error: err.message });
  }
});

app.listen(9000, () => {
  console.log('🖨️ Print server running on http://localhost:9000');
});

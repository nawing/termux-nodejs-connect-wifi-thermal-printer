const net = require('net');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

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

// 🧾 Generate order text (no prices)
function generatePrintText(order) {
  let output = '';
  output += `📦 ORDER ID: ${order.orderId}\n`;
  output += '-----------------------------\n';
  order.items.forEach(item => {
    output += `• ${item.name} x${item.qty}\n`;
  });
  output += '-----------------------------\n\n';
  return output;
}

// 📷 ESC/POS QR Code command (optional)
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

// 🖨 Send data to printer over socket
async function sendToPrinter(ip, order) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    client.connect(PRINTER_PORT, ip, () => {
      const ESC = '\x1B';
      const text = generatePrintText(order);
      const qr = generateQRCodeCommand(order.qrString);
      const cut = ESC + 'd' + '\x05' + '\x1D' + 'V' + '\x00';

      client.write(ESC + '@'); // Init
      client.write(text);
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

start = async () => {
  try {
    const ip = await detectPrinterIP();
    await sendToPrinter(ip, {
      orderId: 'INV-999',
      items: [
        { name: 'Dry Food', qty: 3 },
        { name: 'Collar', qty: 1 }
      ],
      qrString: 'https://track.example.com/INV-999'
    });
    console.log(`✅ Printed to ${ip}`);
  } catch (err) {
    console.error('❌', err.message);
  }
}

start()

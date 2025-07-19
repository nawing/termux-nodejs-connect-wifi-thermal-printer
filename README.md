# Make Your Android Device a socket listener or a local server to connect to thermal printer

Created this repo for testing so that I can clone without getting blocked.
LOL

It attemps auto detect thermal printer ip with nmap - termux & wifi thermal printer connect


```bash
# Install nmap on your termux first
# Works well with nodejs version 22
pkg install nmap
```




### 1. Run Node.js daemon to listen input from socket to print to wifi thermal printer

```bash
# Install nmap on your termux first
# Works well with nodejs version 22
pm2 start ./src/process.js
```





### 2. Run Node.js as an HTTP Server to listen input from your other applications to trigger local connection to print to wifi thermal printer
```bash
# Install nmap on your termux first
# Works well with nodejs version 22
pm2 start ./src/server.js
```
```javascript
// Call From Your Application
await axios.post('http://192.168.1.222:9000/print', {
  text: 'Long Text Here',
  qrString: 'https://track.example.com/INV-999' // Or null
});
```


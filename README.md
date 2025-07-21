# Make Your Android Device a daemon or a local server that connects to thermal printer which listens input from your cloud applications realtime.

It attemps auto detect thermal printer ip with nmap - termux & wifi thermal printer connect.
It connects to cloud servers with web sockets listens input events and prints on your local printer.
Please note that since this is just a template, security logics is not properly implemented.
This is a way to connect your thermal printer from your web applications.
This allows you to print your thermal printer to be printed from anywhere with internet connection.

So nmap needs to be installed
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
#
termux-wake-lock
# Make Termux not sleep becasue your android might try to kill the process
termux-wake-unlock
# Make Termux not sleep becasue your android might try to kill the process to save battery or other performance optimization
```



### 2. Run Node.js as an HTTP Server to listen input from your other applications to trigger local connection to print to wifi thermal printer

View your connection status and control connections from http://localhost:3000
or just run 'npm start'
You can edit the web socket url and printer IP address

```bash
# Install nmap on your termux first
# Works well with nodejs version 22
pm2 start ./src/server.js
termux-wake-lock
# Make Termux not sleep becasue your android might try to kill the process
termux-wake-unlock
# Make Termux not sleep becasue your android might try to kill the process to save battery or other performance optimization
```


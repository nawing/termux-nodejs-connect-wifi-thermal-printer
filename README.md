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
#
termux-wake-lock
# Make Termux not sleep becasue your android might try to kill the process
termux-wake-unlock
# Make Termux not sleep becasue your android might try to kill the process to save battery or other performance optimization
```





### 2. Run Node.js as an HTTP Server to listen input from your other applications to trigger local connection to print to wifi thermal printer

View your connection status and control connections from http://localhost:3000

```bash
# Install nmap on your termux first
# Works well with nodejs version 22
pm2 start ./src/server.js
termux-wake-lock
# Make Termux not sleep becasue your android might try to kill the process
termux-wake-unlock
# Make Termux not sleep becasue your android might try to kill the process to save battery or other performance optimization
```


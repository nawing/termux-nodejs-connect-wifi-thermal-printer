# Make Android Device a bridge platform that allows you to print your thermal printer from anywhere with internet

It connects to cloud servers with web sockets and listens input events to prints the local printer.
<br>
Please note that since this is just a template, security logics is not implemented.
<br>
This is a way to connect your thermal printer from your web applications.
<br>
This allows you to print your thermal printer from anywhere with internet connection.
<br>


### Setting Up Environment
1. Install termux on your andriod device
2. Install nodejs
3. Install nmap
3. Install pm2

```bash
# In your termux
# Works well with nodejs version 22
pkg install nodejs-lts
pkg install nmap
npm install -g pm2

termux-wake-lock
# Make Termux not sleep becasue your android might try to kill the process
termux-wake-unlock0
# Make Termux not sleep becasue your android might try to kill the process to save battery or other performance optimization
```


## 2 Methods available
### 1. Run as a daemon process
```bash
# install depenencies
npm install
# Run with pm2
pm2 start ./src/process.js
```



### 2. Run Node.js as an HTTP Server
View your connection status and control connections from http://localhost:3000
or just run 'npm start'
You can edit the web socket url and printer IP address

```bash
# install depenencies
npm install
# Run with pm2
pm2 start ./src/server.js
```


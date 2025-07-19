### To Make A HTTP Call
##### attempting auto detect thermal printer ip with nmap - termux & wifi thermal printer connect


Created this testing repo so that I can clone without getting blocked.
Please Ignore this repository.


```javascript

await axios.post('http://192.168.1.222:9000/print-order', {
  orderId: 'INV-999',
  items: [
    { name: 'Dry Food', qty: 3 },
    { name: 'Collar', qty: 1 }
  ],
  qrString: 'https://track.example.com/INV-999' // Or null
});

```

const net = require('net');

// Common port → service mapping
const services = {
    21: "FTP",
    22: "SSH",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    465: "SMTPS",
    587: "SMTP Submission",
    3306: "MySQL",
    8080: "HTTP-Alt"
};

const TIMEOUT = 1000;
const MAX_CONCURRENT = 100; // controls speed

let activeConnections = 0;
let portQueue = [];

// Banner grabbing
function grabBanner(socket, port) {
    try {
        socket.write("HEAD / HTTP/1.1\r\nHost: test\r\n\r\n");

        socket.on('data', (data) => {
            const banner = data.toString().slice(0, 100);
            console.log(`   ↳ Banner: ${banner.replace(/\n/g, '')}`);
            socket.destroy();
        });
    } catch (e) {}
}

// Scan single port
function scanPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(TIMEOUT);

        socket.on('connect', () => {
            const service = services[port] || "Unknown";
            console.log(`[OPEN] Port ${port} (${service})`);

            grabBanner(socket, port);
            resolve();
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve();
        });

        socket.on('error', () => {
            resolve();
        });

        socket.connect(port, host);
    });
}

// Worker queue (controls concurrency)
async function worker(host) {
    while (portQueue.length > 0) {
        const port = portQueue.shift();
        await scanPort(host, port);
    }
}

// Main
async function main() {
    const target = process.argv[2];

    if (!target) {
        console.log("Usage: node scanner.js <target>");
        process.exit();
    }

    console.log(`\nScanning ${target}...\n`);

    // Fill queue
    for (let port = 1; port <= 1024; port++) {
        portQueue.push(port);
    }

    // Launch workers
    const workers = [];
    for (let i = 0; i < MAX_CONCURRENT; i++) {
        workers.push(worker(target));
    }

    await Promise.all(workers);

    console.log("\nScan complete.");
}

main();
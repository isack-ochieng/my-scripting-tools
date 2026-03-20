const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolveTxt = promisify(dns.resolveTxt);

// Basic DNS records
async function getBasicRecords(domain) {
    console.log(`\n[+] Enumerating ${domain}\n`);

    try {
        const a = await resolve4(domain);
        console.log("A Records:", a);
    } catch {}

    try {
        const mx = await resolveMx(domain);
        console.log("MX Records:", mx);
    } catch {}

    try {
        const ns = await resolveNs(domain);
        console.log("NS Records:", ns);
    } catch {}

    try {
        const txt = await resolveTxt(domain);
        console.log("TXT Records:", txt);
    } catch {}
}

// Subdomain brute force
const wordlist = [
    "www", "mail", "ftp", "dev", "test", "api", "blog", "admin"
];

async function bruteSubdomains(domain) {
    console.log("\n[+] Subdomain Discovery\n");

    for (let sub of wordlist) {
        const subdomain = `${sub}.${domain}`;

        try {
            const result = await resolve4(subdomain);
            console.log(`[FOUND] ${subdomain} → ${result}`);
        } catch {}
    }
}

// Main
async function main() {
    const domain = process.argv[2];

    if (!domain) {
        console.log("Usage: node dnsenum.js <domain>");
        process.exit();
    }

    await getBasicRecords(domain);
    await bruteSubdomains(domain);

    console.log("\nDone.");
}

main();
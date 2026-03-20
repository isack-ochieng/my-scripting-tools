const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const visited = new Set();
const foundEmails = new Set();
const foundEndpoints = new Set();

const MAX_PAGES = 30;
const DELAY = 200; // ms between requests

// Improved patterns
function extractEmails(text) {
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
    return text.match(regex) || [];
}

function extractEndpoints(text) {
    const regex = /(\/api\/|\/v1\/|\/v2\/|\/graphql|\/ajax\/|\/auth\/|\/admin\/)[a-zA-Z0-9\/_-]*/g;
    return text.match(regex) || [];
}

// Normalize URLs
function normalizeUrl(base, link) {
    try {
        return new URL(link, base).href;
    } catch {
        return null;
    }
}

// Scan JavaScript files
async function scanJS(url) {
    try {
        const res = await axios.get(url, { timeout: 3000 });
        const js = res.data;

        extractEmails(js).forEach(e => foundEmails.add(e));
        extractEndpoints(js).forEach(e => foundEndpoints.add(e));

    } catch {}
}

// Main scraping function
async function scrape(url, domain) {
    if (visited.has(url) || visited.size >= MAX_PAGES) return;
    visited.add(url);

    try {
        console.log(`[+] Visiting: ${url}`);

        const res = await axios.get(url, { timeout: 3000 });
        const html = res.data;

        // Extract from HTML
        extractEmails(html).forEach(e => foundEmails.add(e));
        extractEndpoints(html).forEach(e => foundEndpoints.add(e));

        const $ = cheerio.load(html);

        const links = [];

        // Extract links
        $('a').each((_, el) => {
            const href = $(el).attr('href');
            const fullUrl = normalizeUrl(url, href);

            if (fullUrl && fullUrl.includes(domain)) {
                links.push(fullUrl);
            }
        });

        // Extract JS files
        $('script').each((_, el) => {
            const src = $(el).attr('src');
            const jsUrl = normalizeUrl(url, src);

            if (jsUrl) {
                scanJS(jsUrl); // 🔥 key upgrade
            }
        });

        // Delay (politeness)
        await new Promise(r => setTimeout(r, DELAY));

        // Crawl next pages
        await Promise.all(links.map(link => scrape(link, domain)));

    } catch {}
}

// Main
async function main() {
    const target = process.argv[2];

    if (!target) {
        console.log("Usage: node scraper.js <url>");
        process.exit();
    }

    const domain = new URL(target).hostname;

    await scrape(target, domain);

    console.log("\n=== RESULTS ===");

    console.log("\nEmails Found:");
    foundEmails.forEach(e => console.log(e));

    console.log("\nEndpoints Found:");
    foundEndpoints.forEach(e => console.log(e));

    // Save results
    fs.writeFileSync('results.json', JSON.stringify({
        emails: [...foundEmails],
        endpoints: [...foundEndpoints]
    }, null, 2));
}

main();
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = 8080;

// Load links
let links = JSON.parse(fs.readFileSync('./links.json'));

// Serve static assets (CSS, JS, images)
app.use('/assets', express.static(path.join(__dirname, 'sites')));

// ----------------------
// 🔹 ROUTER MODE (your system)
// ----------------------
app.get('/', (req, res) => {
    const file = path.join(__dirname, 'sites', links["home"]);
    res.sendFile(file);
});

app.get('/:page', (req, res) => {
    const page = req.params.page;

    if (links[page]) {
        const file = path.join(__dirname, 'sites', links[page]);
        res.sendFile(file);
    } else {
        res.status(404).send("Page not found");
    }
});

// ----------------------
// 🌐 REAL PROXY MODE
// ----------------------
app.get('/proxy', async (req, res) => {
    let target = req.query.url;

    if (!target) {
        return res.send("Usage: /proxy?url=https://example.com");
    }

    try {
        const response = await fetch(target, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        let body = await response.text();

        // 🔧 Fix relative links (basic rewrite)
        body = body.replace(/(href|src)="\//g, `$1="${target}/`);

        res.send(body);
    } catch (err) {
        res.status(500).send("Proxy error: " + err.message);
    }
});

// ----------------------
// 🔒 OPTIONAL BLOCK SYSTEM
// ----------------------
const bannedWords = ["piracy", "torrent"];

app.get('/search', (req, res) => {
    const q = req.query.q || "";

    for (let word of bannedWords) {
        if (q.toLowerCase().includes(word)) {
            return res.sendFile(path.join(__dirname, 'sites', 'blocked.html'));
        }
    }

    res.redirect(`/proxy?url=https://www.google.com/search?q=${encodeURIComponent(q)}`);
});

// ----------------------
// 🔄 HOT RELOAD links.json
// ----------------------
fs.watchFile('./links.json', () => {
    console.log("Reloading links.json...");
    links = JSON.parse(fs.readFileSync('./links.json'));
});

// ----------------------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

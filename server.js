const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Load links.json
let links = JSON.parse(fs.readFileSync('./links.json', 'utf-8'));

// Serve static assets (optional)
app.use('/assets', express.static(path.join(__dirname, 'sites')));

// ----------------------
// 🔥 MAIN .tango HANDLER
// ----------------------
app.use((req, res, next) => {
    let host = req.headers.host || "";

    // Remove port (e.g. :8080)
    host = host.split(":")[0].toLowerCase();

    console.log("Incoming host:", host);

    // Check if host exists in links.json
    if (links[host]) {
        const filePath = path.join(__dirname, links[host]);

        // Security: prevent path escape
        if (!filePath.startsWith(__dirname)) {
            return res.status(403).send("Forbidden");
        }

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(404).send("File not found");
            }

            return res.sendFile(filePath);
        });

        return; // stop further routing
    }

    next();
});

// ----------------------
// 🔹 FALLBACK ROUTES
// ----------------------
app.get('/', (req, res) => {
    res.send("Proxy running. No mapping found.");
});

app.use((req, res) => {
    res.status(404).send("Unknown .tango domain");
});

// ----------------------
// 🔄 AUTO RELOAD JSON
// ----------------------
fs.watchFile('./links.json', () => {
    console.log("Reloading links.json...");
    try {
        links = JSON.parse(fs.readFileSync('./links.json', 'utf-8'));
    } catch (e) {
        console.error("Invalid JSON!");
    }
});

// ----------------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

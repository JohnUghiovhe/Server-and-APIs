const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

function sendFile(res, filepath, statusCode = 200) {
  fs.readFile(filepath, (err, data) => {
    if (err) {
      return send404(res);
    }
    const ext = path.extname(filepath).toLowerCase();
    const type =
      ext === ".html"
        ? "text/html; charset=utf-8"
        : ext === ".css"
        ? "text/css; charset=utf-8"
        : ext === ".js"
        ? "text/javascript; charset=utf-8"
        : ext === ".json"
        ? "application/json; charset=utf-8"
        : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : "application/octet-stream";

    res.writeHead(statusCode, { "Content-Type": type });
    res.end(data);
  });
}

function send404(res) {
  const notFoundPath = path.join(PUBLIC_DIR, "404.html");
  if (fs.existsSync(notFoundPath)) {
    sendFile(res, notFoundPath, 404);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
}

const server = http.createServer((req, res) => {
  try {
    // Only allow GET for this simple server
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Method Not Allowed");
    }

    // Normalize URL and prevent directory traversal
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let cleanPath = path.posix.normalize(urlPath);

    // Map root to /index.html for convenience (optional)
    if (cleanPath === "/" || cleanPath === "") {
      cleanPath = "/index.html";
    }

    // Only serve files from /public and only .html (as required)
    const requestedExt = path.extname(cleanPath).toLowerCase();
    if (requestedExt !== ".html") {
      return send404(res);
    }

    const fsPath = path.join(PUBLIC_DIR, cleanPath);

    // Ensure the file is inside PUBLIC_DIR (protect against traversal)
    if (!fsPath.startsWith(PUBLIC_DIR)) {
      return send404(res);
    }

    // Serve index.html specifically, and 404 for any other *.html
    if (path.basename(fsPath) === "index.html" && fs.existsSync(fsPath)) {
      return sendFile(res, fsPath, 200);
    }

    // Any other {random}.html -> 404 page
    return send404(res);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

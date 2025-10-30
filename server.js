const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Target Base44 app
const TARGET = 'https://biggrade0.base44.app';

console.log('Starting BigGrade Proxy Server...');
console.log('Target:', TARGET);
console.log('Port:', PORT);

// Proxy configuration
const proxyOptions = {
  target: TARGET,
  changeOrigin: true,
  ws: true,
  followRedirects: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying:', req.method, req.url);
    // Forward original headers
    proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
    proxyReq.setHeader('X-Forwarded-Proto', 'https');
    proxyReq.setHeader('X-Real-IP', req.ip);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Response:', proxyRes.statusCode, req.url);
    
    // Remove headers that might cause issues
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['content-security-policy-report-only'];
    
    // Only modify HTML responses
    const contentType = proxyRes.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      let body = '';
      
      proxyRes.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      proxyRes.on('end', () => {
        // Inject CSS to hide Base44 branding
        const hideBase44CSS = `
          <style id="biggrade-custom-styles">
            /* Hide Base44 branding elements */
            [class*="base44"]:not([class*="biggrade"]),
            [id*="base44"]:not([id*="biggrade"]),
            [class*="remix"],
            [id*="remix"],
            a[href*="base44.com"]:not([href*="biggrade"]),
            /* Hide fixed positioned elements in bottom right */
            body > div[style*="position: fixed"][style*="bottom"][style*="right"],
            body > div[style*="position:fixed"][style*="bottom"][style*="right"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
            }
          </style>
        `;
        
        // Inject JavaScript to hide Base44 elements
        const hideBase44JS = `
          <script id="biggrade-custom-script">
            (function() {
              function hideBase44() {
                // Hide buttons/links with Base44 text
                document.querySelectorAll('button, a, div').forEach(el => {
                  const text = el.textContent.toLowerCase();
                  if (text.includes('edit with base44') || text.includes('remix')) {
                    el.style.display = 'none';
                  }
                });
                
                // Hide fixed elements in bottom right
                document.querySelectorAll('div').forEach(div => {
                  const style = window.getComputedStyle(div);
                  if (style.position === 'fixed') {
                    const bottom = parseInt(style.bottom);
                    const right = parseInt(style.right);
                    if (!isNaN(bottom) && !isNaN(right) && bottom < 100 && right < 300) {
                      const text = div.textContent.toLowerCase();
                      if (text.includes('base44') || text.includes('edit') || text.includes('remix')) {
                        div.style.display = 'none';
                      }
                    }
                  }
                });
              }
              
              // Run multiple times to catch dynamic content
              hideBase44();
              setTimeout(hideBase44, 500);
              setTimeout(hideBase44, 1000);
              setTimeout(hideBase44, 2000);
              setInterval(hideBase44, 3000);
              
              // Watch for new elements
              if (typeof MutationObserver !== 'undefined') {
                new MutationObserver(hideBase44).observe(document.body, {
                  childList: true,
                  subtree: true
                });
              }
            })();
          </script>
        `;
        
        // Inject the code
        let modifiedBody = body;
        if (body.includes('</head>')) {
          modifiedBody = body.replace('</head>', hideBase44CSS + '</head>');
        }
        if (modifiedBody.includes('</body>')) {
          modifiedBody = modifiedBody.replace('</body>', hideBase44JS + '</body>');
        }
        
        // Send the modified response
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Length', Buffer.byteLength(modifiedBody));
        res.end(modifiedBody);
      });
      
      // Don't send the original response
      proxyRes.on('data', () => {});
      return;
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).send(`
      <html>
        <body>
          <h1>Proxy Error</h1>
          <p>${err.message}</p>
          <p>Target: ${TARGET}</p>
        </body>
      </html>
    `);
  }
};

// Create proxy middleware
const proxy = createProxyMiddleware(proxyOptions);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', target: TARGET, timestamp: new Date().toISOString() });
});

// Use proxy for all other routes
app.use('/', proxy);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Reverse proxy server running on port ${PORT}`);
  console.log(`✅ Proxying: ${TARGET}`);
  console.log(`✅ Access at: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

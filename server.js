const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Target Base44 app
const TARGET = 'https://biggrade0.base44.app';

// Custom middleware to inject CSS/JS to hide Base44 branding
const injectBrandingRemoval = (proxyRes, req, res) => {
  // Only process HTML responses
  const contentType = proxyRes.headers['content-type'] || '';
  if (!contentType.includes('text/html')) {
    return;
  }

  // Remove content-security-policy headers that might block our injections
  delete proxyRes.headers['content-security-policy'];
  delete proxyRes.headers['content-security-policy-report-only'];
  delete proxyRes.headers['x-frame-options'];
  
  // Collect response data
  let body = '';
  const originalWrite = res.write;
  const originalEnd = res.end;
  const chunks = [];

  res.write = function(chunk) {
    chunks.push(Buffer.from(chunk));
  };

  res.end = function(chunk) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }
    
    body = Buffer.concat(chunks).toString('utf8');
    
    // Parse HTML with cheerio
    const $ = cheerio.load(body);
    
    // Inject CSS to hide Base44 branding
    const hideBase44CSS = `
      <style id="biggrade-custom-styles">
        /* Hide Base44 branding elements */
        [class*="base44"],
        [id*="base44"],
        [class*="remix"],
        [id*="remix"],
        a[href*="base44.com"]:not([href*="biggrade"]),
        button:contains("Edit with Base44"),
        div[class*="floating"],
        div[class*="fixed-bottom"],
        /* Hide any fixed positioned elements in bottom right */
        body > div[style*="position: fixed"][style*="bottom"][style*="right"],
        body > div[style*="position:fixed"][style*="bottom"][style*="right"],
        /* Common patterns for floating action buttons */
        [class*="fab"],
        [class*="float"],
        [id*="editor-button"],
        [id*="remix-button"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* Additional cleanup for Base44 specific elements */
        iframe[src*="base44.com"]:not([src*="biggrade"]) {
          display: none !important;
        }
      </style>
    `;
    
    // Inject JavaScript to continuously remove Base44 elements
    const hideBase44JS = `
      <script id="biggrade-custom-script">
        (function() {
          // Function to hide Base44 branding
          function hideBase44Branding() {
            // Hide elements by text content
            const buttons = document.querySelectorAll('button, a');
            buttons.forEach(btn => {
              const text = btn.textContent.toLowerCase();
              if (text.includes('base44') || text.includes('edit with') || text.includes('remix')) {
                btn.style.display = 'none';
                btn.style.visibility = 'hidden';
                btn.style.opacity = '0';
                btn.style.pointerEvents = 'none';
              }
            });
            
            // Hide fixed positioned elements in bottom right corner
            const allDivs = document.querySelectorAll('div');
            allDivs.forEach(div => {
              const style = window.getComputedStyle(div);
              if (style.position === 'fixed') {
                const bottom = parseInt(style.bottom);
                const right = parseInt(style.right);
                if (!isNaN(bottom) && !isNaN(right) && bottom < 100 && right < 200) {
                  // Check if it's likely a branding element
                  const text = div.textContent.toLowerCase();
                  if (text.includes('base44') || text.includes('edit') || text.includes('remix') || div.querySelector('img, button, a')) {
                    div.style.display = 'none';
                  }
                }
              }
            });
          }
          
          // Run immediately
          hideBase44Branding();
          
          // Run after DOM is fully loaded
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideBase44Branding);
          }
          
          // Run periodically to catch dynamically added elements
          setInterval(hideBase44Branding, 500);
          
          // Use MutationObserver to catch new elements
          const observer = new MutationObserver(hideBase44Branding);
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        })();
      </script>
    `;
    
    // Inject before closing head tag
    if ($('head').length) {
      $('head').append(hideBase44CSS);
    } else {
      $('html').prepend('<head>' + hideBase44CSS + '</head>');
    }
    
    // Inject before closing body tag
    if ($('body').length) {
      $('body').append(hideBase44JS);
    } else {
      $('html').append('<body>' + hideBase44JS + '</body>');
    }
    
    // Get modified HTML
    const modifiedBody = $.html();
    
    // Update content-length header
    res.setHeader('content-length', Buffer.byteLength(modifiedBody));
    
    // Restore original functions and send modified response
    res.write = originalWrite;
    res.end = originalEnd;
    res.write(modifiedBody);
    res.end();
  };
};

// Proxy configuration
const proxyOptions = {
  target: TARGET,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  followRedirects: true,
  selfHandleResponse: true, // We'll handle the response ourselves
  onProxyRes: injectBrandingRemoval,
  onProxyReq: (proxyReq, req, res) => {
    // Forward original headers
    proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
    proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + err.message);
  }
};

// Create proxy middleware
const proxy = createProxyMiddleware(proxyOptions);

// Use proxy for all routes
app.use('/', proxy);

// Start server
app.listen(PORT, () => {
  console.log(`Reverse proxy server running on port ${PORT}`);
  console.log(`Proxying: ${TARGET}`);
  console.log(`Access at: http://localhost:${PORT}`);
});

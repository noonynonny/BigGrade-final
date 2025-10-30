const https = require('https');
const http = require('http');
const { URL } = require('url');

const TARGET = 'https://biggrade0.base44.app';

exports.handler = async (event, context) => {
  const path = event.path.replace('/.netlify/functions/proxy', '') || '/';
  const targetUrl = new URL(path, TARGET);
  
  // Add query parameters
  if (event.queryStringParameters) {
    Object.keys(event.queryStringParameters).forEach(key => {
      targetUrl.searchParams.append(key, event.queryStringParameters[key]);
    });
  }

  return new Promise((resolve, reject) => {
    const options = {
      method: event.httpMethod,
      headers: {
        ...event.headers,
        'host': targetUrl.host,
        'x-forwarded-host': event.headers.host,
        'x-forwarded-proto': 'https'
      }
    };

    // Remove headers that shouldn't be forwarded
    delete options.headers['content-length'];
    delete options.headers['host'];

    const protocol = targetUrl.protocol === 'https:' ? https : http;
    
    const proxyReq = protocol.request(targetUrl, options, (proxyRes) => {
      let body = '';
      
      proxyRes.on('data', (chunk) => {
        body += chunk.toString();
      });

      proxyRes.on('end', () => {
        const contentType = proxyRes.headers['content-type'] || '';
        
        // Inject CSS/JS to hide Base44 branding if HTML
        if (contentType.includes('text/html')) {
          const hideBase44CSS = `
            <style id="biggrade-custom">
              [class*="base44"], [id*="base44"], [class*="remix"], [id*="remix"],
              a[href*="base44.com"]:not([href*="biggrade"]),
              body > div[style*="position: fixed"][style*="bottom"][style*="right"],
              body > div[style*="position:fixed"][style*="bottom"][style*="right"] {
                display: none !important;
              }
            </style>
          `;
          
          const hideBase44JS = `
            <script>
              (function() {
                function hide() {
                  document.querySelectorAll('button, a, div').forEach(el => {
                    const text = el.textContent.toLowerCase();
                    const style = window.getComputedStyle(el);
                    if (text.includes('base44') || text.includes('edit with') || text.includes('remix') ||
                        (style.position === 'fixed' && parseInt(style.bottom) < 100 && parseInt(style.right) < 200)) {
                      el.style.display = 'none';
                    }
                  });
                }
                setInterval(hide, 500);
                new MutationObserver(hide).observe(document.body, {childList: true, subtree: true});
              })();
            </script>
          `;
          
          body = body.replace('</head>', hideBase44CSS + '</head>');
          body = body.replace('</body>', hideBase44JS + '</body>');
        }

        // Prepare response headers
        const responseHeaders = {};
        Object.keys(proxyRes.headers).forEach(key => {
          if (key !== 'content-length' && key !== 'content-security-policy' && key !== 'x-frame-options') {
            responseHeaders[key] = proxyRes.headers[key];
          }
        });

        resolve({
          statusCode: proxyRes.statusCode,
          headers: responseHeaders,
          body: body,
          isBase64Encoded: false
        });
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy error:', error);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: 'Proxy error: ' + error.message })
      });
    });

    // Send request body if present
    if (event.body) {
      proxyReq.write(event.body);
    }

    proxyReq.end();
  });
};

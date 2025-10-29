const fetch = require('node-fetch');

const TARGET_URL = 'https://biggrade0.base44.app';

exports.handler = async (event, context) => {
  try {
    // Extract the actual path - handle both direct access and through redirects
    let path = event.path || '/';
    
    // Remove the function path prefix if present
    path = path.replace('/.netlify/functions/proxy', '');
    
    // If path is empty, default to root
    if (!path || path === '') {
      path = '/';
    }
    
    const queryString = event.rawQuery ? `?${event.rawQuery}` : '';
    const targetUrl = `${TARGET_URL}${path}${queryString}`;
    
    console.log(`[Proxy] ${event.httpMethod} ${targetUrl}`);

    // Prepare headers - forward most headers from the original request
    const headers = {
      'user-agent': event.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'accept': event.headers['accept'] || '*/*',
      'accept-language': event.headers['accept-language'] || 'en-US,en;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
    };

    // Add referer and origin to make requests look legitimate
    if (event.headers['referer']) {
      headers['referer'] = event.headers['referer'].replace(event.headers.host, 'biggrade0.base44.app');
    }

    // Forward cookies
    if (event.headers['cookie']) {
      headers['cookie'] = event.headers['cookie'];
    }

    // Fetch from target with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000); // 10 second timeout

    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: headers,
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' ? event.body : undefined,
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeout);

    console.log(`[Proxy] Response: ${response.status} ${response.statusText}`);

    // Get response body
    const contentType = response.headers.get('content-type') || '';
    const buffer = await response.buffer();
    
    // Process text content (HTML, CSS, JS, JSON)
    if (contentType.includes('text/') || 
        contentType.includes('application/javascript') ||
        contentType.includes('application/json') ||
        contentType.includes('application/x-javascript')) {
      
      let content = buffer.toString('utf-8');
      
      // Replace Base44 URLs with our domain
      content = content.replace(/https:\/\/biggrade0\.base44\.app/g, `https://${event.headers.host}`);
      content = content.replace(/biggrade0\.base44\.app/g, event.headers.host || '');
      
      // For HTML, inject Base44 removal code
      if (contentType.includes('text/html')) {
        const antiBase44Script = `
          <style>
            /* Hide Base44 branding */
            *[class*="base44"],
            *[id*="base44"],
            *[class*="Base44"],
            *[id*="Base44"] {
              display: none !important;
            }
            a[href*="base44"] {
              display: none !important;
            }
          </style>
          <script>
            (function() {
              'use strict';
              const removeBase44 = () => {
                try {
                  document.querySelectorAll('*').forEach(el => {
                    const text = (el.textContent || '').toLowerCase();
                    if (text.includes('base44') && el.children.length === 0) {
                      const parent = el.parentElement;
                      if (parent && parent.children.length === 1) {
                        parent.remove();
                      } else {
                        el.remove();
                      }
                    }
                    
                    if (el.attributes) {
                      for (let attr of el.attributes) {
                        if ((attr.value || '').toLowerCase().includes('base44')) {
                          el.remove();
                          return;
                        }
                      }
                    }
                  });
                  
                  document.querySelectorAll('iframe').forEach(iframe => {
                    if (iframe.src && iframe.src.includes('base44')) {
                      iframe.remove();
                    }
                  });
                } catch (e) {
                  console.error('Cleanup error:', e);
                }
              };
              
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', removeBase44);
              } else {
                removeBase44();
              }
              
              window.addEventListener('load', removeBase44);
              setInterval(removeBase44, 200);
              
              const observer = new MutationObserver(removeBase44);
              observer.observe(document.documentElement, {
                childList: true,
                subtree: true
              });
            })();
          </script>
        `;
        
        if (content.includes('</head>')) {
          content = content.replace('</head>', antiBase44Script + '</head>');
        } else if (content.includes('<body>')) {
          content = content.replace('<body>', '<body>' + antiBase44Script);
        }
      }
      
      // Build response headers
      const responseHeaders = {
        'Content-Type': contentType,
        'Cache-Control': response.headers.get('cache-control') || 'no-cache',
      };

      // Forward set-cookie headers if present
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        responseHeaders['set-cookie'] = setCookie;
      }

      return {
        statusCode: response.status,
        headers: responseHeaders,
        body: content
      };
    } else {
      // Binary content (images, fonts, etc.)
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': response.headers.get('cache-control') || 'public, max-age=3600',
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

  } catch (error) {
    console.error('[Proxy] Error:', error.message);
    
    // Return a user-friendly error page
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>BigGrade - Connection Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .error-container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 500px;
              margin: 20px;
            }
            h1 { color: #e74c3c; margin-bottom: 10px; }
            p { color: #666; line-height: 1.6; margin: 15px 0; }
            .error-code { 
              font-family: monospace; 
              background: #f8f9fa; 
              padding: 10px; 
              border-radius: 4px;
              font-size: 14px;
              color: #e74c3c;
              margin: 20px 0;
            }
            .retry-btn {
              margin-top: 20px;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 500;
              transition: background 0.3s;
            }
            .retry-btn:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>⚠️ Connection Error</h1>
            <p>Unable to connect to BigGrade. The proxy service encountered an error while trying to reach the application.</p>
            <div class="error-code">${error.message}</div>
            <p>This could be due to:</p>
            <ul style="text-align: left; color: #666;">
              <li>Network connectivity issues</li>
              <li>The source application being temporarily unavailable</li>
              <li>Request timeout</li>
            </ul>
            <button class="retry-btn" onclick="location.reload()">🔄 Retry</button>
          </div>
        </body>
        </html>
      `
    };
  }
};

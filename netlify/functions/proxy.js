const fetch = require('node-fetch');

const TARGET_URL = 'https://biggrade0.base44.app';

exports.handler = async (event, context) => {
  try {
    // Get the path from the event
    const path = event.path.replace('/.netlify/functions/proxy', '') || '/';
    const queryString = event.rawQuery ? `?${event.rawQuery}` : '';
    const targetUrl = `${TARGET_URL}${path}${queryString}`;
    
    console.log(`Proxying: ${event.httpMethod} ${targetUrl}`);

    // Prepare headers
    const headers = {
      'user-agent': event.headers['user-agent'] || 'Mozilla/5.0',
      'accept': event.headers['accept'] || '*/*',
      'accept-language': event.headers['accept-language'] || 'en-US,en;q=0.9',
    };

    // Add cookies if present
    if (event.headers['cookie']) {
      headers['cookie'] = event.headers['cookie'];
    }

    // Fetch from target with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000); // 8 second timeout

    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: headers,
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' ? event.body : undefined,
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeout);

    // Get response body
    const contentType = response.headers.get('content-type') || '';
    const buffer = await response.buffer();
    
    // Process text content (HTML, CSS, JS)
    if (contentType.includes('text/html') || 
        contentType.includes('text/css') || 
        contentType.includes('application/javascript') ||
        contentType.includes('text/javascript')) {
      
      let content = buffer.toString('utf-8');
      
      // Replace Base44 URLs with relative URLs
      content = content.replace(/https:\/\/biggrade0\.base44\.app/g, '');
      content = content.replace(/biggrade0\.base44\.app/g, event.headers.host || '');
      
      // Remove Base44 branding for HTML
      if (contentType.includes('text/html')) {
        const hideBase44CSS = `
          <style>
            /* Hide Base44 branding */
            *[class*="base44"],
            *[id*="base44"],
            *[data-base44],
            *[class*="Base44"],
            *[id*="Base44"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
            
            a[href*="base44"],
            a[href*="Base44"] {
              display: none !important;
              pointer-events: none !important;
            }
          </style>
          <script>
            (function() {
              'use strict';
              
              const KILL_INTERVAL = 100;
              const SEARCH_TERMS = ['base44', 'Base44', 'BASE44'];
              
              function removeBase44Elements() {
                try {
                  document.querySelectorAll('*').forEach(el => {
                    const text = (el.textContent || '').toLowerCase();
                    
                    for (const term of SEARCH_TERMS) {
                      if (text.includes(term.toLowerCase())) {
                        const parent = el.parentElement;
                        if (parent) {
                          el.remove();
                          return;
                        }
                      }
                    }
                    
                    if (el.attributes) {
                      for (let attr of el.attributes) {
                        const attrValue = (attr.value || '').toLowerCase();
                        if (attrValue.includes('base44')) {
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
                  console.error('Base44 removal error:', e);
                }
              }
              
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', removeBase44Elements);
              } else {
                removeBase44Elements();
              }
              
              window.addEventListener('load', removeBase44Elements);
              setInterval(removeBase44Elements, KILL_INTERVAL);
              
              const observer = new MutationObserver(removeBase44Elements);
              observer.observe(document.documentElement, {
                childList: true,
                subtree: true
              });
              
            })();
          </script>
        `;
        
        if (content.includes('</head>')) {
          content = content.replace('</head>', hideBase44CSS + '</head>');
        } else if (content.includes('<body>')) {
          content = content.replace('<body>', '<body>' + hideBase44CSS);
        } else {
          content = hideBase44CSS + content;
        }
      }
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        },
        body: content
      };
    } else {
      // Binary content (images, etc.)
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

  } catch (error) {
    console.error('Proxy error:', error);
    
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
          <title>BigGrade - Loading Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .error-container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 500px;
            }
            h1 { color: #e74c3c; }
            p { color: #666; line-height: 1.6; }
            .retry-btn {
              margin-top: 20px;
              padding: 10px 20px;
              background: #3498db;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            .retry-btn:hover { background: #2980b9; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>⚠️ Connection Error</h1>
            <p>Unable to load BigGrade. The proxy service encountered an error.</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <button class="retry-btn" onclick="location.reload()">Retry</button>
          </div>
        </body>
        </html>
      `
    };
  }
};

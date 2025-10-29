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
      'referer': TARGET_URL,
      'origin': TARGET_URL,
    };

    // Add cookies if present
    if (event.headers['cookie']) {
      headers['cookie'] = event.headers['cookie'];
    }

    // Fetch from target
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: headers,
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' ? event.body : undefined,
      redirect: 'manual'
    });

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const newLocation = location.replace(TARGET_URL, '');
        return {
          statusCode: response.status,
          headers: {
            'Location': newLocation
          },
          body: ''
        };
      }
    }

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
            
            [style*="position: fixed"],
            [style*="position:fixed"] {
              display: none !important;
            }
            
            [style*="bottom"][style*="right"],
            [style*="bottom:"][style*="right:"] {
              display: none !important;
            }
          </style>
          <script>
            (function() {
              'use strict';
              
              const KILL_INTERVAL = 50;
              const SEARCH_TERMS = ['base44', 'Base44', 'BASE44', 'edit with', 'Edit with', 'remix', 'Remix'];
              
              function nukeBase44() {
                try {
                  const allElements = document.querySelectorAll('*');
                  allElements.forEach(el => {
                    const text = (el.textContent || '').toLowerCase();
                    const innerHTML = (el.innerHTML || '').toLowerCase();
                    
                    for (const term of SEARCH_TERMS) {
                      if (text.includes(term.toLowerCase()) || innerHTML.includes(term.toLowerCase())) {
                        el.remove();
                        return;
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
                  
                  document.querySelectorAll('*').forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.position === 'fixed') {
                      const rect = el.getBoundingClientRect();
                      const winWidth = window.innerWidth;
                      const winHeight = window.innerHeight;
                      
                      if (rect.right > winWidth * 0.7 && rect.bottom > winHeight * 0.7) {
                        el.remove();
                      }
                      
                      if (rect.width < 300 && rect.height < 100) {
                        el.remove();
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
              
              nukeBase44();
              
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', nukeBase44);
              }
              
              window.addEventListener('load', nukeBase44);
              setInterval(nukeBase44, KILL_INTERVAL);
              
              const observer = new MutationObserver(() => {
                nukeBase44();
              });
              
              observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true
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
        
        content = content.replace(/<script[^>]*src=["'][^"']*base44[^"']*["'][^>]*><\/script>/gi, '');
      }
      
      // Remove Base44 references from JavaScript
      if (contentType.includes('javascript')) {
        content = content.replace(/base44\.app/g, event.headers.host || '');
        content = content.replace(/["']remix["']/gi, '""');
      }
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': response.headers.get('cache-control') || 'no-cache',
        },
        body: content
      };
    } else {
      // Binary content (images, etc.)
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
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy error: ' + error.message })
    };
  }
};

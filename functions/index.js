const functions = require('firebase-functions');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.raw({ type: '*/*', limit: '10mb' }));

const TARGET_URL = 'https://biggrade0.base44.app';

app.use(async (req, res) => {
  try {
    const targetUrl = `${TARGET_URL}${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    console.log(`Proxying: ${req.method} ${targetUrl}`);

    const headers = {
      ...req.headers,
      'host': new URL(TARGET_URL).host,
      'referer': TARGET_URL,
      'origin': TARGET_URL,
    };
    
    delete headers['x-forwarded-host'];
    delete headers['x-forwarded-proto'];
    delete headers['x-forwarded-for'];
    delete headers['connection'];

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
      redirect: 'manual'
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const newLocation = location.replace(TARGET_URL, '');
        res.redirect(response.status, newLocation);
        return;
      }
    }

    res.status(response.status);

    response.headers.forEach((value, name) => {
      if (name === 'content-encoding' || name === 'transfer-encoding') return;
      
      if (name === 'location') {
        value = value.replace(TARGET_URL, '');
      }
      
      if (name === 'set-cookie') {
        value = value.replace(/domain=[^;]+/gi, '');
      }
      
      res.setHeader(name, value);
    });

    const contentType = response.headers.get('content-type') || '';
    const buffer = await response.buffer();
    
    if (contentType.includes('text/html') || 
        contentType.includes('text/css') || 
        contentType.includes('application/javascript') ||
        contentType.includes('text/javascript')) {
      
      let content = buffer.toString('utf-8');
      content = content.replace(/https:\/\/biggrade0\.base44\.app/g, '');
      content = content.replace(/biggrade0\.base44\.app/g, req.headers.host);
      
      // Remove Base44 branding/watermark
      if (contentType.includes('text/html')) {
        // Inject CSS to hide Base44 logo/watermark
        const hideBase44CSS = `
          <style>
            /* Nuclear option: Hide ALL fixed position elements */
            * {
              /* Scan for base44 in any attribute */
              &[class*="base44"],
              &[id*="base44"],
              &[data-base44],
              &[class*="Base44"],
              &[id*="Base44"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                position: absolute !important;
                left: -99999px !important;
                top: -99999px !important;
                width: 0 !important;
                height: 0 !important;
                z-index: -99999 !important;
              }
            }
            
            /* Block all links to base44 */
            a[href*="base44"],
            a[href*="Base44"] {
              display: none !important;
              pointer-events: none !important;
            }
            
            /* Hide ALL fixed position elements (nuclear option) */
            [style*="position: fixed"],
            [style*="position:fixed"] {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* Additional position-based blocking */
            [style*="bottom"][style*="right"],
            [style*="bottom:"][style*="right:"] {
              display: none !important;
            }
            
            /* Block high z-index overlays */
            [style*="z-index"],
            [style*="z-index:"] {
              z-index: -1 !important;
              display: none !important;
            }
            
            /* Cover bottom-right corner with overlay blocker */
            body::after {
              content: '';
              position: fixed !important;
              bottom: 0 !important;
              right: 0 !important;
              width: 200px !important;
              height: 100px !important;
              background: transparent !important;
              z-index: 999999 !important;
              pointer-events: auto !important;
            }
          </style>
          <script>
            (function() {
              'use strict';
              
              // ULTRA AGGRESSIVE BASE44 REMOVAL
              const KILL_INTERVAL = 50; // Check every 50ms
              const SEARCH_TERMS = ['base44', 'Base44', 'BASE44', 'edit with', 'Edit with', 'remix', 'Remix'];
              
              function nukeBase44() {
                try {
                  // Method 1: Remove by text content (most reliable)
                  const allElements = document.querySelectorAll('*');
                  allElements.forEach(el => {
                    const text = (el.textContent || '').toLowerCase();
                    const innerHTML = (el.innerHTML || '').toLowerCase();
                    const outerHTML = (el.outerHTML || '').toLowerCase();
                    
                    // Check if element contains any Base44 references
                    for (const term of SEARCH_TERMS) {
                      if (text.includes(term.toLowerCase()) || 
                          innerHTML.includes(term.toLowerCase()) ||
                          outerHTML.includes(term.toLowerCase())) {
                        el.remove();
                        return;
                      }
                    }
                    
                    // Check all attributes
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
                  
                  // Method 2: Remove ALL fixed position elements
                  document.querySelectorAll('*').forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.position === 'fixed') {
                      // Check if it's in bottom-right corner (typical for Base44 button)
                      const rect = el.getBoundingClientRect();
                      const winWidth = window.innerWidth;
                      const winHeight = window.innerHeight;
                      
                      // If element is in bottom-right quadrant, kill it
                      if (rect.right > winWidth * 0.7 && rect.bottom > winHeight * 0.7) {
                        el.remove();
                      }
                      
                      // Or if it's small (button-sized) and fixed, kill it
                      if (rect.width < 300 && rect.height < 100) {
                        el.remove();
                      }
                    }
                  });
                  
                  // Method 3: Shadow DOM check (in case they hide it there)
                  document.querySelectorAll('*').forEach(el => {
                    if (el.shadowRoot) {
                      const shadowElements = el.shadowRoot.querySelectorAll('*');
                      shadowElements.forEach(shadowEl => {
                        const text = (shadowEl.textContent || '').toLowerCase();
                        if (text.includes('base44') || text.includes('edit with')) {
                          el.remove();
                        }
                      });
                    }
                  });
                  
                  // Method 4: Remove iframes that might contain Base44
                  document.querySelectorAll('iframe').forEach(iframe => {
                    if (iframe.src && iframe.src.includes('base44')) {
                      iframe.remove();
                    }
                  });
                  
                  // Method 5: Override any inline styles that might show the button
                  const styleSheets = document.styleSheets;
                  for (let i = 0; i < styleSheets.length; i++) {
                    try {
                      const rules = styleSheets[i].cssRules || styleSheets[i].rules;
                      for (let j = 0; j < rules.length; j++) {
                        const rule = rules[j];
                        if (rule.cssText && rule.cssText.includes('base44')) {
                          styleSheets[i].deleteRule(j);
                        }
                      }
                    } catch (e) {
                      // Cross-origin stylesheet, skip
                    }
                  }
                  
                } catch (e) {
                  console.error('Base44 removal error:', e);
                }
              }
              
              // Override createElement to block Base44 elements at creation time
              const originalCreateElement = document.createElement;
              document.createElement = function(...args) {
                const element = originalCreateElement.apply(document, args);
                
                // Intercept setters to prevent Base44 attributes
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                  if (value && value.toString().toLowerCase().includes('base44')) {
                    return; // Block it
                  }
                  return originalSetAttribute.call(element, name, value);
                };
                
                return element;
              };
              
              // Override appendChild to block Base44 elements
              const originalAppendChild = Element.prototype.appendChild;
              Element.prototype.appendChild = function(child) {
                if (child && child.outerHTML && child.outerHTML.toLowerCase().includes('base44')) {
                  return child; // Pretend it worked but don't actually append
                }
                return originalAppendChild.call(this, child);
              };
              
              // Run immediately
              nukeBase44();
              
              // Run on DOM ready
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', nukeBase44);
              } else {
                nukeBase44();
              }
              
              // Run after window load
              window.addEventListener('load', nukeBase44);
              
              // Run continuously at high frequency
              setInterval(nukeBase44, KILL_INTERVAL);
              
              // Mutation observer for instant removal
              const observer = new MutationObserver((mutations) => {
                nukeBase44();
              });
              
              observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeOldValue: true,
                characterData: true
              });
              
              // Extra paranoid: check every property change
              const paranoidObserver = new MutationObserver(() => {
                requestAnimationFrame(nukeBase44);
              });
              
              paranoidObserver.observe(document.documentElement, {
                attributes: true,
                childList: true,
                subtree: true,
                attributeOldValue: true
              });
              
            })();
          </script>
        `;
        
        // Inject before closing head tag or at start of body
        if (content.includes('</head>')) {
          content = content.replace('</head>', hideBase44CSS + '</head>');
        } else if (content.includes('<body>')) {
          content = content.replace('<body>', '<body>' + hideBase44CSS);
        } else {
          content = hideBase44CSS + content;
        }
        
        // Remove any script tags that might inject Base44 branding
        content = content.replace(/<script[^>]*src=["'][^"']*base44[^"']*["'][^>]*><\/script>/gi, '');
      }
      
      // Remove Base44 references from JavaScript
      if (contentType.includes('javascript')) {
        content = content.replace(/base44\.app/g, req.headers.host);
        content = content.replace(/["']remix["']/gi, '""');
      }
      
      res.send(content);
    } else {
      res.send(buffer);
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error: ' + error.message);
  }
});

exports.proxy = functions.https.onRequest(app);

const fetch = require('node-fetch');

const TARGET_URL = 'https://biggrade0.base44.app';

exports.handler = async (event, context) => {
  // Log the incoming request for debugging
  console.log('=== PROXY REQUEST ===');
  console.log('Path:', event.path);
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers));
  
  try {
    // Extract the path after the function name
    let requestPath = event.path || '/';
    
    // Remove function prefix
    if (requestPath.startsWith('/.netlify/functions/proxy')) {
      requestPath = requestPath.replace('/.netlify/functions/proxy', '');
    }
    
    // Default to root if empty
    if (!requestPath || requestPath === '') {
      requestPath = '/';
    }
    
    // Build target URL
    const queryString = event.rawQuery ? `?${event.rawQuery}` : '';
    const targetUrl = `${TARGET_URL}${requestPath}${queryString}`;
    
    console.log('Target URL:', targetUrl);

    // Make the request
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
      },
      redirect: 'follow',
      timeout: 10000
    });

    console.log('Response status:', response.status);
    console.log('Response content-type:', response.headers.get('content-type'));

    // Get the response body
    const contentType = response.headers.get('content-type') || '';
    const buffer = await response.buffer();
    
    // Check if it's text content
    const isText = contentType.includes('text/') || 
                   contentType.includes('application/javascript') ||
                   contentType.includes('application/json');
    
    if (isText) {
      let content = buffer.toString('utf-8');
      
      // Replace URLs
      content = content.replace(/https:\/\/biggrade0\.base44\.app/g, `https://${event.headers.host}`);
      content = content.replace(/biggrade0\.base44\.app/g, event.headers.host);
      
      // For HTML, add Base44 removal
      if (contentType.includes('text/html')) {
        const script = `<script>
          setInterval(() => {
            document.querySelectorAll('*').forEach(el => {
              if ((el.textContent || '').toLowerCase().includes('base44')) {
                el.remove();
              }
            });
          }, 100);
        </script>`;
        
        if (content.includes('</body>')) {
          content = content.replace('</body>', script + '</body>');
        }
      }
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        },
        body: content
      };
    } else {
      // Binary content
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

  } catch (error) {
    console.error('=== PROXY ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Proxy Error</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              background: #f5f5f5;
            }
            .error {
              background: white;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #e74c3c;
            }
            pre {
              background: #f8f9fa;
              padding: 10px;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Proxy Error</h1>
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Path:</strong> ${event.path}</p>
            <p><strong>Method:</strong> ${event.httpMethod}</p>
            <pre>${error.stack}</pre>
            <button onclick="location.reload()">Retry</button>
          </div>
        </body>
        </html>
      `
    };
  }
};

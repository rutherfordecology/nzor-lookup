// netlify/functions/gbif-proxy.js
// Downloads a GBIF zip file server-side and streams it back to the browser,
// bypassing the browser CORS restriction on GBIF's download servers.

const https = require('https');
const http  = require('http');

function fetchFollowRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) && res.headers.location && maxRedirects > 0) {
        const redirectUrl = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return fetchFollowRedirects(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, buffer: Buffer.concat(chunks) }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

exports.handler = async function(event) {
  const url = event.queryStringParameters && event.queryStringParameters.url;

  if (!url) return { statusCode: 400, body: 'Missing url parameter' };

  // Log the URL being requested for debugging
  console.log('Proxy fetching:', url);

  if (!url.startsWith('https://api.gbif.org/') && !url.startsWith('http://api.gbif.org/')) {
    return { statusCode: 403, body: 'Only GBIF URLs are allowed. Got: ' + url };
  }

  try {
    const { statusCode, buffer } = await fetchFollowRedirects(url);
    if (statusCode !== 200) {
      return { statusCode: 200, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' }, body: 'GBIF returned HTTP ' + statusCode + ' for URL: ' + url + ' (buffer size: ' + buffer.length + ' bytes)' };
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': 'attachment; filename="gbif-download.zip"'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch(err) {
    return { statusCode: 500, body: 'Proxy error: ' + err.message };
  }
};

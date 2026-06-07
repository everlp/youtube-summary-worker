import { connect } from 'cloudflare:sockets';

export async function proxyFetch(urlStr: string, proxyUrlStr: string): Promise<string> {
  const url = new URL(urlStr);
  const proxyUrl = new URL(proxyUrlStr);
  
  const proxyHost = proxyUrl.hostname;
  const proxyPort = proxyUrl.port ? parseInt(proxyUrl.port) : 80;
  const auth = btoa(`${proxyUrl.username}:${proxyUrl.password}`);
  
  const socket = connect({ hostname: proxyHost, port: proxyPort });
  const writer = socket.writable.getWriter();
  
  const connectReq = `CONNECT ${url.hostname}:443 HTTP/1.1\r\nHost: ${url.hostname}:443\r\nProxy-Authorization: Basic ${auth}\r\n\r\n`;
  await writer.write(new TextEncoder().encode(connectReq));
  writer.releaseLock();
  
  const reader = socket.readable.getReader();
  let connectRes = '';
  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      connectRes += new TextDecoder().decode(value);
      if (connectRes.includes('\r\n\r\n')) break;
    }
    if (done) break;
  }
  reader.releaseLock();
  
  if (!connectRes.startsWith('HTTP/1.1 200')) {
    throw new Error('Proxy CONNECT failed: ' + connectRes.split('\r\n')[0]);
  }
  
  const secureSocket = socket.startTls({ expectedServerName: url.hostname } as any);
  const secureWriter = secureSocket.writable.getWriter();
  
  // Use HTTP/1.0 to avoid chunked encoding and Accept-Encoding: identity to avoid compression
  const getReq = `GET ${url.pathname}${url.search} HTTP/1.0\r\nHost: ${url.hostname}\r\nAccept-Language: en-US,en;q=0.9\r\nAccept-Encoding: identity\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\nConnection: close\r\n\r\n`;
  await secureWriter.write(new TextEncoder().encode(getReq));
  secureWriter.releaseLock();
  
  const secureReader = secureSocket.readable.getReader();
  let responseText = '';
  while (true) {
    const { done, value } = await secureReader.read();
    if (value) {
      responseText += new TextDecoder().decode(value);
    }
    if (done) break;
  }
  secureReader.releaseLock();
  
  const headerEnd = responseText.indexOf('\r\n\r\n');
  if (headerEnd !== -1) {
    return responseText.substring(headerEnd + 4);
  }
  return responseText;
}

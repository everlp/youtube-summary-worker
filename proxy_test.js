import { connect } from 'cloudflare:sockets';

export default {
  async fetch(request, env, ctx) {
    try {
      const proxyHost = '38.154.203.95';
      const proxyPort = 5863;
      const proxyAuth = btoa('wwpbjlqb:wofwr5l4kto9');

      const socket = connect({ hostname: proxyHost, port: proxyPort });
      const writer = socket.writable.getWriter();
      
      const connectReq = `CONNECT www.youtube.com:443 HTTP/1.1\r\nHost: www.youtube.com:443\r\nProxy-Authorization: Basic ${proxyAuth}\r\n\r\n`;
      await writer.write(new TextEncoder().encode(connectReq));
      writer.releaseLock();
      
      const reader = socket.readable.getReader();
      let response = '';
      while (true) {
        const { done, value } = await reader.read();
        if (value) {
          response += new TextDecoder().decode(value);
          if (response.includes('\r\n\r\n')) break;
        }
        if (done) break;
      }
      reader.releaseLock();
      
      if (!response.startsWith('HTTP/1.1 200')) {
        return new Response('Proxy CONNECT failed: ' + response, { status: 502 });
      }
      
      const secureSocket = socket.startTls({ expectedServerName: 'www.youtube.com' });
      const secureWriter = secureSocket.writable.getWriter();
      
      const getReq = `GET /watch?v=xRh2sVcNXQ8 HTTP/1.1\r\nHost: www.youtube.com\r\nUser-Agent: Mozilla/5.0\r\nConnection: close\r\n\r\n`;
      await secureWriter.write(new TextEncoder().encode(getReq));
      secureWriter.releaseLock();
      
      const secureReader = secureSocket.readable.getReader();
      let html = '';
      while (true) {
        const { done, value } = await secureReader.read();
        if (value) {
          html += new TextDecoder().decode(value);
        }
        if (done) break;
      }
      secureReader.releaseLock();
      
      return new Response(html.substring(0, 500), { headers: { 'Content-Type': 'text/plain' } });
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};

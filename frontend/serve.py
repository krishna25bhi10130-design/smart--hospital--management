"""
Smart Hospital Management - Frontend Runner & API Proxy
Serves the frontend application on http://127.0.0.1:3000 and proxies /api/* calls to FastAPI.
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import os
import sys

PORT = 3000
BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))

class HospitalFrontendHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def handle_proxy(self):
        # Strip /api prefix and forward to backend
        # e.g. /api/doctors?name=Dr.+Sharma -> http://127.0.0.1:8000/doctors?name=Dr.+Sharma
        path_and_query = self.path
        if path_and_query.startswith('/api/'):
            backend_path = path_and_query[4:] # removes '/api'
        elif path_and_query == '/api':
            backend_path = '/'
        else:
            backend_path = path_and_query

        target_url = f"{BACKEND_URL}{backend_path}"
        
        # Read body if present
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        req = urllib.request.Request(
            target_url,
            data=body,
            method=self.command,
            headers={
                'Accept': self.headers.get('Accept', 'application/json'),
                'Content-Type': self.headers.get('Content-Type', 'application/json')
            }
        )

        try:
            with urllib.request.urlopen(req) as response:
                status = response.status
                content = response.read()
                self.send_response(status)
                self.send_header('Content-Type', response.headers.get('Content-Type', 'application/json'))
                self.end_headers()
                self.wfile.write(content)
        except urllib.error.HTTPError as e:
            content = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"detail": "Proxy error: {str(e)}"}}'.encode('utf-8'))

    def do_GET(self):
        if self.path.startswith('/api'):
            self.handle_proxy()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api'):
            self.handle_proxy()
        else:
            super().do_POST()

    def do_PUT(self):
        if self.path.startswith('/api'):
            self.handle_proxy()
        else:
            self.send_response(405)
            self.end_headers()

    def do_DELETE(self):
        if self.path.startswith('/api'):
            self.handle_proxy()
        else:
            self.send_response(405)
            self.end_headers()

    def log_message(self, format, *args):
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")

def run():
    os.chdir(FRONTEND_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), HospitalFrontendHandler) as httpd:
        url = f"http://127.0.0.1:{PORT}"
        print("=" * 65)
        print(" Smart Hospital Management - Frontend & API Proxy Server")
        print(f" -> Frontend Application: {url}")
        print(f" -> FastAPI Backend:      {BACKEND_URL}")
        print("=" * 65)
        print("Press Ctrl+C to stop.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down frontend server.")

if __name__ == "__main__":
    run()

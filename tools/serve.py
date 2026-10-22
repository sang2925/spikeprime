"""Serve the project for the browser simulator, telling the browser never to cache files,
so a normal refresh always picks up edited app.js / missions.js.
Run from the project root: python3 tools/serve.py   then open http://localhost:8000/simulator/"""
import http.server, functools, os


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


try:
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 8000), functools.partial(NoCache, directory=os.getcwd()))
except OSError:
    raise SystemExit('Port 8000 is already in use: a server is probably already running. '
                     'Open http://localhost:8000/simulator/ (or stop the other server first).')
print('Simulator: http://localhost:8000/simulator/  (Ctrl+C to stop)')
server.serve_forever()

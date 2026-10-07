"""Fetch public pages with DNS pinned per connection and bounded redirects."""
import http.client
import ipaddress
import socket
import ssl
from urllib.parse import urlsplit, urljoin

MAX_RESPONSE = 2 * 1024 * 1024


def public_address(url):
    parsed = urlsplit(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Use a public HTTP(S) URL without credentials")
    if parsed.port not in (None, 80, 443):
        raise ValueError("Only standard web ports are allowed")
    addresses = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(row[4][0]).is_global for row in addresses):
        raise ValueError("Private, loopback, and reserved network addresses are not allowed")
    return parsed, addresses[0][4][0]


def fetch_public_url(url):
    for _ in range(5):
        parsed, address = public_address(url)
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        connection = http.client.HTTPConnection(parsed.hostname, port, timeout=15)
        sock = socket.create_connection((address, port), timeout=15)
        if parsed.scheme == "https":
            sock = ssl.create_default_context().wrap_socket(sock, server_hostname=parsed.hostname)
        connection.sock = sock
        try:
            connection.request("GET", (parsed.path or "/") + ("?" + parsed.query if parsed.query else ""), headers={"Host": parsed.hostname, "User-Agent": "Synapse/0.2", "Accept-Encoding": "identity"})
            response = connection.getresponse()
            if response.status in (301, 302, 303, 307, 308):
                location = response.getheader("Location")
                if not location:
                    raise ValueError("Redirect has no destination")
                url = urljoin(url, location)
                continue
            if response.status != 200:
                raise ValueError(f"Page returned HTTP {response.status}")
            content_type = response.getheader("Content-Type", "")
            if not any(value in content_type.lower() for value in ("text/html", "text/plain")):
                raise ValueError("URL must return an HTML or text page")
            data = response.read(MAX_RESPONSE + 1)
            if len(data) > MAX_RESPONSE:
                raise ValueError("Page exceeds the 2 MB response limit")
            return url, data.decode("utf-8", errors="replace")
        finally:
            connection.close()
    raise ValueError("Too many redirects")

# Douji Reverse Proxy

Nginx-based reverse proxy for the Douji service.

## Environment variables

### DOUJI_HTTP_PORTS

- List of ports on which the proxy should listen for HTTP traffic
- If empty, HTTP is disabled
- Format: Whitespace-separated list of valid port numbers
- Defaults to "80"

### DOUJI_HTTPS_PORTS

- List of ports on which the proxy should listen for HTTPS traffic
- If empty, HTTPS is disabled
- Format: Whitespace-separated list of valid port numbers
- Defaults to "443"

### DOUJI_URL

- List of URLs which the frontend serves
- Also configures allowed origins for CORS on the backend
- Format: White-space separated list
- Defaults to localhost

### DOUJI_HTTPS_REDIRECT

- Whether proxy should redirect HTTP traffic to HTTPS port
- If enabled and:
  - HTTP is disabled, this will have no effect
  - HTTPS is disabled, this will result in bad redirects (to port that isn't open)
- Traffic is always redirected to the first port specified in [DOUJI_HTTPS_PORTS](#douji_https_ports)
  - If no port is specified, default HTTPS port (443) is used
  - Use default HTTPS port (443) if you want to avoid redirect URL with port number
- Format: 0/1
- Defaults to 0

### DOUJI_CERTBOT_EMAIL

- Email to be registered in certbot for the domain
- If empty string is given, no email will be registered for the domain
- Defaults to empty string

### DOUJI_DEV

- Whether the proxy should run in dev mode (1) or production mode (0)
- In dev mode, SSL certificates from [dev_certs](./dev_certs/) directory are used
- In production mode, certificate for all domains specified in [DOUJI_URL](#douji_url) is obtained and automatically renewed from Let's Encrypt using certbot
- Format: 0/1
- Defaults to 1

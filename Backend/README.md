# Douji Backend

An ASP.NET Core backend for the Douji video watch-along service.

## Environment variables

### DOUJI_BACKEND_URLS

- URLs on which the backend should listen
- Format: Space-separated URL list
- If HTTPS URL(s) is/are defined, executable must have an HTTPS certificate available, otherwise it'll crash on startup
- Defaults:
  - Binary: <http://localhost:8080>
  - Docker: <http://0.0.0.0:8080>

### DOUJI_BACKEND_ALLOWED_HOSTS

- URLs which the backend should serve
- Format: Space-separated URL list
- Defaults:
  - Binary: Empty
  - Docker: Empty

### DOUJI_BACKEND_ALLOWED_CORS_URLS

- URLs from which the backend should accept Cross-Origin requests
- Useful for serving frontend from a different URL than the backend
- Format: Space-separated URL list
- Default:
  - Binary: Empty
  - Docker:
    - Dev: <https://localhost:3000>
    - Prod: Empty

### DOUJI_BACKEND_HTTPS_REDIRECT

- Whether the backend should redirect HTTP requests to HTTPS port
- Will cause a warning if no HTTPS URL is defined among [DOUJI_BACKEND_URLS](#douji_backend_urls)
- Format: 0/false or 1/true
- Default:
  - Binary: 0
  - Docker: 0

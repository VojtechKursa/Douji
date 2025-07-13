# Douji Frontend

A ReactJS frontend for the Douji video watch-along service.

## Environment variables

### DOUJI_FRONTEND_PORT

- Port on which the frontend should listen
- Format: Number
- Defaults:
  - Binary: 3000
  - Docker: 3000

### DOUJI_FRONTEND_DOCKER_EXPOSE

- List of frontend's ports a Docker image should expose
- Has no effect if running outside Docker
- Format: Identical to Docker's EXPOSE directive
- Defaults:
  - Binary: N/A
  - Docker: 3000

### DOUJI_FRONTEND_BACKEND_URL

- URL to which requests to backend should be directed
- Can be left empty if frontend and backend run on the same URL (behind a reverse proxy for example)
- Format: Full URL (will be prepended to every backend request route)
- Defaults:
  - Binary: Empty
  - Docker: Empty

### NEXT_PUBLIC_DEV_BUILD

- Whether this is a DEV build with increased logging or not
- The desired value needs to be set at compile time
- Format: 0/false or 1/true
- Defaults:
  - Binary: false
  - Docker: false

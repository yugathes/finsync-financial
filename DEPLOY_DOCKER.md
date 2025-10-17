# Deploying the app with Docker

This repo contains a Vite React client and an Express + Prisma server. The Dockerfile included in this repo is a multi-stage build that:

- Installs dependencies and builds the client and server artifacts.
- Produces a small production image that contains only runtime dependencies and the built `dist` folder.

Quick local build and run

1. Build the image:

```bash
docker build -t finsync-financial:latest .
```

2. Run the container (replace the env vars with your real values):

```bash
docker run -it --rm -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e SUPABASE_URL="https://..." \
  -e SUPABASE_KEY="..." \
  -e NODE_ENV=production \
  finsync-financial:latest
```

What to set

- DATABASE_URL — your Postgres connection string used by Prisma
- Any other env vars found in `.env` or required by Supabase/Prisma

Prisma and connection pooling

Prisma works best with a persistent server process. If you deploy this container to a platform that scales horizontally, ensure your database can handle the number of connections, or use a proxy/pooling layer (PgBouncer) or Prisma Data Proxy.

Deploying to a cloud provider

- Render, Fly, Railway, DigitalOcean App Platform, and AWS ECS all support running Docker containers. Use their UI or CLI to push the image or connect your Git repository and point to the Dockerfile.
- Example: to push to Docker Hub and deploy on a host that pulls images:

```bash
docker tag finsync-financial:latest yourdockerhubuser/finsync-financial:latest
docker push yourdockerhubuser/finsync-financial:latest
```

Notes

- The Docker image runs the compiled `dist/index.js` produced by the repo `yarn build` script.
- If you want a smaller image, we can switch to an Alpine-based Node image and adjust build steps.

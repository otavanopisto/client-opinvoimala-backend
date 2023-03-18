# Backend for Opinvoimala

[Strapi.io (v3)](https://docs-v3.strapi.io/developer-docs/latest/getting-started/introduction.html) backend for Opinvoimala

## Setup/config

- Project should have `.env` file on the root folder (see `.env.example` for required variables)
- Most of the configurations can be done in `app/config/*` directory
  - `database.js` to [change database settings](https://docs-v3.strapi.io/developer-docs/latest/setup-deployment-guides/configurations.html#database)
  - `plugins.js` to [change email provider](https://docs-v3.strapi.io/developer-docs/latest/development/plugins/email.html#configure-the-plugin)
- `docker-compose.yml` is used to launch LOCAL containerized dev environment (file should't require any configurations as long as the environment variables are set)
- `Dockerfile` is containing build process for the app (additionally `gcloud/cloudbuild-[environment].yaml` files are used to describe build steps for Google Clould Build)
- Uploads (e.g. images) are stored to mount in the server (or in container on local environment) and files can be accessed from paths such as `https://my-domain/uploads/image-file-name.jpg`. [More info in Strapi documentation](https://docs-v3.strapi.io/developer-docs/latest/development/plugins/upload.html#configuration).

## Start developing

[Docker compose](https://docs-v3.strapi.io/developer-docs/latest/setup-deployment-guides/installation/docker.html) is used to run project locally.

Make sure you have `.env` variables set (see `.env.example`).

Run

```sh
docker-compose up
```

To manage your project 🚀, go to the administration panel at:
http://localhost:1337/admin

To access the server ⚡️, go to:
http://localhost:1337

### Access the container
```sh
# List containers (to see container names)
docker ps

# Open bash shell in strapi container
docker exec -it client-opinvoimala-backend_strapi_1 bash

# Open bash shell in DB container
docker exec -it client-opinvoimala-backend_mariadb_1 bash
```

**Note**: If you are managing/installing new packages (e.g. `yarn add...`), it is strongly recommended to install these from within the container (accessing the container described above)! Encountered some errors with some packages (most of them works both ways) when wasn't doing this.

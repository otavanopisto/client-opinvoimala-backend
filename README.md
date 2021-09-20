# Backend for Opinvoimala
[Strapi.io](https://strapi.io/documentation/developer-docs/latest/getting-started/introduction.html) backend for Opinvoimala

## Start developing
Make sure you have `.env` variables set (see `.env.example`).

Run

```sh
docker-compose up
```

To manage your project 🚀, go to the administration panel at:
http://localhost:1337/admin

To access the server ⚡️, go to: 
http://localhost:1337

## Deploy

### Upgrade stage

Create & push new tag `*-stage` (e.g. yyyymmdd-hhmm-stage)

```sh
git checkout stage
# Make sure that all changes are merged/committed into stage
git tag [tag]
git push origin stage --tags
```

### Upgrade production

Create & push new tag `*-production` (e.g. 0.0.1-production)

```sh
git checkout master
# Make sure that all changes are merged/committed into master
git tag [tag]
git push origin master --tags
```

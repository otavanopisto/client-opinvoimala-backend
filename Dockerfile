FROM node:14.15

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY app/package.json app/yarn.lock ./
RUN yarn install

# Bundle app source
COPY app ./

# Install plugin dependencies
RUN yarn --cwd "plugins/wysiwyg" install
RUN yarn --cwd "/usr/src/app/plugins/wysiwyg" install

# Build the app inside the container
RUN yarn build

# Expose the port
EXPOSE 1337

# Start the app
ENTRYPOINT ["/usr/local/bin/yarn", "start"]

FROM node:14.15

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY app/package.json app/yarn.lock ./
RUN yarn install

# Install plugin dependencies
RUN yarn --cwd "app/plugins/wysiwyg" install

# Bundle app source
COPY app ./

# Build the app inside the container
RUN yarn build

# Expose the port
EXPOSE 1337

# Start the app
ENTRYPOINT ["/usr/local/bin/yarn", "start"]

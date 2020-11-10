# use node
FROM node:lts

# Create app directory
WORKDIR /usr/src/module

# Copy directory
COPY . /usr/src/module

# Install graphicsmagic
RUN apt-get update
RUN apt-get install -y graphicsmagick

# Install dependencies
RUN npm i

# CMD
CMD ["node", "index"]
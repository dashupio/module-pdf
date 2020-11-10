# use node
FROM node:alpine

# Create app directory
WORKDIR /usr/src/module

# Copy directory
COPY . /usr/src/module

# Install apk dependencies
RUN apk --update add imagemagick

# Fix permissions
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/g' /etc/ImageMagick-6/policy.xml

# Install dependencies
RUN npm i

# CMD
CMD ["node", "index"]
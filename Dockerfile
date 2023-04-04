
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY . .

EXPOSE 8088
CMD [ "node", "app.js" ]

#Create image docker
#docker build . -t isf/ons-social-crawler-be

#Run node app
#docker run -p 49160:8080 -d isf/ons-social-crawler-be

#https://nodejs.org/en/docs/guides/nodejs-docker-webapp
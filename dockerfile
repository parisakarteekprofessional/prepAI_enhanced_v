#building the frontend
#multistage building
# Frontend build
# Frontend Build
FROM node:20 as frontend-builder

COPY ./Frontend /app
WORKDIR /app

RUN npm install
RUN npm run build

# Backend
FROM node:20

# Install Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY ./Backend /app

WORKDIR /app

RUN npm install

COPY --from=frontend-builder /app/dist /app/public

EXPOSE 3000

CMD ["node", "server.js"]

#very light weight
#combines the node 20 version with the alpine linux distribution
#FROM node:20-alpine 
#add all the backend logic into the container
#COPY ./Backend .
#to add all the node modules into the container
#run will execute during the build of the image
#RUN npm install
#this is the command to run the server
#create will execute while starting the container it will be passive in the image as of now later while executing image it would be active
#CMD ["node","server.js"]

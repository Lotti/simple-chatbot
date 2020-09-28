FROM node:10
WORKDIR /usr/src/app
COPY . /usr/src/app

RUN npm run install-all
RUN npm run build-client

ENV PORT=3000

EXPOSE 8080
CMD [ "npm", "start" ]

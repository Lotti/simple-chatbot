 # Simple chatbot

Server is made with Node.js. Client is made with React and ant.design framework. It uses Watson Assistant to deliver chatbot functionality.

- npm run install-all: installs all server and client dependencies
- npm start: run server
- npm run start-client: run react development server
- npm run watch: run server and reload it every time it detects a change on code
- npm run build-client: compile react client code
- more commands defined in package.json

# Work with Docker

To run the sample chatbot app with Docker

* Create a Docker.env file containing the following variables:

```
ASSISTANT_URL='...'
ASSISTANT_APIKEY='...'
ASSISTANT_ID='...'
```

* Run the following command to build and run the Docker
```
docker build -t chatbot .
docker run --env-file ./Docker.env -p 8080:3000 chatbot
```
* Open the url http://localhost:8080

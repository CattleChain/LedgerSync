# use latest version of node
# service is under development
FROM node:10
# set working directory
WORKDIR /dist
# bundle source code
COPY . .
#installing dependencies
RUN npm install
# start app with yarn
CMD ["npm", "start"]

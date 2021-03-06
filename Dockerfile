FROM node:latest
RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY package.json /usr/app/
RUN yarn
COPY . /usr/app
EXPOSE 3000
CMD ["yarn", "start"]

FROM node:12

RUN npm i -g now@latest

COPY dist /now-action/dist

ENTRYPOINT ["node", "/now-action/dist/index.js"]

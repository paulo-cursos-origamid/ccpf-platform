FROM node:22-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./

RUN chown node:node /app

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
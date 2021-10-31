FROM node:current

WORKDIR /usr/src/syn
RUN mkdir build

COPY package.json .
COPY ./.npmrc .

RUN yarn install

COPY . .

RUN yarn tsc

CMD node ./build/syn.js

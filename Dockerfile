FROM node:16-alpine
RUN apk add --no-cache python3 g++ make
WORKDIR /tracker
COPY . .
RUN yarn install
CMD ["yarn", "start"]
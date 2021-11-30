FROM node:16-alpine
RUN apk update && apk add bash
RUN apk add --no-cache python3 g++ make
WORKDIR /tracker
COPY . ./
RUN yarn install
RUN chmod +x ./wait-for-it.sh ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["yarn", "start"]
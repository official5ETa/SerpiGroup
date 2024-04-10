FROM node:18.7-slim

WORKDIR /home/node

RUN apt-get update \
 && apt-get install -y python3 python3-pip

COPY ./app .

RUN pip3 install telethon
RUN npm install

CMD ["npm", "start"]

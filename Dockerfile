FROM node:18.7-slim

WORKDIR /home/node

RUN apt-get update \
 && apt-get install -y python3 python3-pip \
 && pip3 install --no-cache telethon \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \

COPY ./app .

RUN npm install --no-cache

CMD ["npm", "start"]

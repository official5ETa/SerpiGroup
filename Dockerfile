FROM node:18.7-slim

WORKDIR /home/node

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true       \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    XAUTHORITY=/home/node/.Xauthority           \
    PUPPETEER_USER_DATA_DIR=/home/node/puppeteer-data

RUN apt-get update                                                                                                      \
 && apt-get install -y                                                                                                  \
    xvfb x11vnc x11-xkb-utils gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libdbus-1-3 libexpat1 libfontconfig1 \
    libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6           \
    libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation                                            \
    libgbm1 xdg-utils procps bash chromium                                                                              \
 && rm -rf /var/lib/apt/lists/*                                                                                         \
 && mkdir ./.vnc                                                                                                        \
 && x11vnc -storepasswd 1234 ./.vnc/passwd

COPY app/package*.json ./
RUN npm i --no-update-notifier

ENV DISPLAY=:99
COPY app/ ./
CMD Xvfb :99 -screen 0 1280x1080x16 & \
    node index.js & \
    sleep 5 && \
    x11vnc -forever -create -display :99
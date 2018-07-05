# FROM node:8.9-alpine
# ENV NODE_ENV production
# WORKDIR /usr/src/app
# COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# RUN npm install --production --silent && mv node_modules ../
# COPY . .
# EXPOSE 2300
# CMD npm start

FROM node:latest
ENV NPM_CONFIG_LOGLEVEL warn

EXPOSE 2300

USER root
RUN useradd -ms /bin/bash app

RUN apt-get update
RUN apt-get install -y runit

COPY . /src
RUN chown -R app:app /src

WORKDIR /src

USER app
RUN npm install
RUN npm install dotenv

USER root
COPY services/ /etc/service/
RUN chmod +x /etc/service/*/run

ENTRYPOINT ["runsvdir"]
CMD ["/etc/service/"]
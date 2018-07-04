#!/bin/bash

# arquivo de exemplo para iniciar o container
#export SOURCE_DIR='/home/appcivico/projects/De-Olho-Nas-Metas-2017'
export SOURCE_DIR='/home/lucas-eokoe/projects/alda-chatbot'
export DATA_DIR='/tmp/alda-chatbot/data/'

# confira o seu ip usando ifconfig docker0|grep 'inet addr:'
export DOCKER_LAN_IP=$(ifconfig docker0 | grep 'inet addr:' | awk '{ split($2,a,":"); print a[2] }')

# porta que será feito o bind
export LISTEN_PORT=2300

docker run --name renova \
 -v $SOURCE_DIR:/src -v $DATA_DIR:/data \
 -p $DOCKER_LAN_IP:$LISTEN_PORT:2049 \
 --cpu-shares=512 \
 --memory 1800m -dit --restart unless-stopped appcivico/alda-chatbot

 

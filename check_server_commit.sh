#!/bin/bash
# Команда для проверки текущего коммита на сервере

ssh root@155.212.170.255 "cd /var/www/studnet && git log --oneline -1 && echo '' && git rev-parse HEAD && echo '' && git status"



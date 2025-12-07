#!/bin/bash
# Команда для отката сервера до коммита 43f15ce

ssh root@155.212.170.255 "cd /var/www/studnet && git fetch origin && git reset --hard 43f15ce && npm install && npm run build && chown -R www-data:www-data build && chmod -R 755 build && systemctl reload nginx && echo '✅ Откат выполнен успешно!' && git log --oneline -1"



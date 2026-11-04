#!/usr/bin/env bash
# Обновление приложения SkillUp на VPS из GitHub.
#
# Запуск (одна строка в консоли VM):
#   curl -fsSL https://raw.githubusercontent.com/EKlimiks/skillup/main/deploy.sh | sudo bash
#
set -euo pipefail

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "== SkillUp deploy =="
git clone --depth 1 https://github.com/EKlimiks/skillup.git "$TMP/repo"

mkdir -p /var/www/skillup
cp -r "$TMP/repo/skillup/." /var/www/skillup/
chown -R www-data:www-data /var/www/skillup
chmod -R a+rX /var/www/skillup

echo "DEPLOY-OK $(date -u +%FT%TZ)"

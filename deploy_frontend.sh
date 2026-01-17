#!/usr/bin/env bash
set -euo pipefail
sudo mkdir -p /var/www/pt-tracker
sudo cp -f ./index.html ./app.js ./config.js /var/www/pt-tracker/
sudo chown -R www-data:www-data /var/www/pt-tracker
echo "✅ Frontend deployed to /var/www/pt-tracker"

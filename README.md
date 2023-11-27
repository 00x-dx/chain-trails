# chain-trails
```
demo link: http://148.113.17.15:3000/
creds: admin/PruPHo4EprOY#mifayIylxlspA
```
## Pre-req:
```
redis
clickhouse
```
## Migrations:
* Run migrations from migrations/
* Update creds in config.yaml

## Installation:
```
cd $dir
npm install
npm install -g pm2
pm2 start LiveIndex.js
Pm2 start src/workers/LiveWorker.js
pm2 list
```

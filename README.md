# chain-trails
```
```
## Pre-req:
```
redis
clickhouse
pm2
```
## Catching historical data:
* You can modify src/archive/backlog.js with the range you are interested in
* And then run the backlog worker, via ```pm2 start src/workers/BacklogWorker.js```
## Migrations:
* Run migrations from migrations/
* Update creds in config.yaml

## Installation:
```
cd $dir
npm install
npm install -g pm2
pm2 start LiveIndex.js
pm2 start src/workers/LiveWorker.js
pm2 list
pm2 logs
```

# chain-trails
```
demo link: http://148.113.17.15:3000/d/c8d9f7a4-3c35-4da4-8b6d-03ecea76da86/chain-trails-lukso?orgId=1&refresh=5s
creds: admin/6dT~TD'qd6%G'zU
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

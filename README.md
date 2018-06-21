# PilotReshoring


## Hyper Ledger Fabric

For all information regarding the Fabric network installation read this link --> https://github.com/far-edge/DistributedLedger/tree/develop/configuration-service-network

### Requirements -> O.S Ubuntu 16.04 LTS,  Node.js 8.x , TypeScript 2.9 , Docker 17.x and Docker Compose 1.18

For download : 
Node.js --> https://nodejs.org
TypeScript --> https://www.typescriptlang.org/
Docker --> https://www.docker.com/
Docker Compose --> https://github.com/docker/compose

Copy your HLF `crypto-config` dir under the chosen directory (default directory is **USER HOME**).

## smart-conveyor-chaincode

. Open a Terminal in your machine:<br/>

 - ` npm install -j typescript`
 - ` docker exec -it cli bash`
 - ` cd .. `
 - ` cd /chainocde`
 - ` tsc`
 - ` peer chaincode install -p smart-conveyor-chaincode -n smart-conveyor-chaincode -v 1.0 -l Node`
 - ` peer chaincode instantiate -n smart-conveyor-chaincode -c '{"Args":["a","10"]}' -C ledgerchannel -v 1.0`

## event-generator-input

Clone this repo https://github.com/far-edge/PilotReshoring.git <br/>

Configure file `resources/config-fabric-network.json`. <br/>

Edit the file `config-fabric-network.json` with your favourite text editor in order to configure the network as in your HLF previous installation. Under you can find a complete example of configured file: <br/>
`vim config-fabric-network.json` 
```
{
  "name": "fabric-network",
  "type": "hlfv1.1",
  "channelName": "ledgerchannel",
  "timeout": 5000,
  "cryptoconfigdir": "crypto-config path",
  "tls": false,
  "chaincode": {
    "path": "smart-conveyor-chaincode",
    "name": "smart-conveyor-chaincode",
    "version": "1.0",
    "lang": "NODE"
  },
  "organizations": [
    {
      "domainName": "org1.example.com",
      "mspID": "Org1MSP",
      "peers": [
        {
          "name": "peer0.org1.example.com",
          "requestURL": "grpc://localhost:7051",
          "eventURL": "grpc://localhost:7053"
        }
      ],
      "ca": {
        "url": "http://localhost:7054",
        "name": "ca.example.com"
      },
      "orderers": [
        {
          "name": "orderer.example.com",
          "url": "grpc://localhost:7050"
        }
      ],
      "users": [
        {
          "name": "Admin",
          "roles": [
            "admin"
          ]
        }
      ]
    }
  ]
} 
```

Open a terminal: ` cd /event-generator-input/  ` 

 ` npm start `
 
Alternatively:

Open a terminal and launch `tsc -w` to compile the Typescript code. <br/>

Open another terminal `node ./dist/server.js`. <br/>


## event-generator-output

Clone this repo https://github.com/far-edge/PilotReshoring.git <br/>

edit the file  `resources/config-fabric-network.json` as done before. <br/>

Open a terminal: ` cd /event-generator-output/  ` 

 ` npm start `
 
Alternatively:

Open a terminal and launch `tsc -w` to compile the Typescript code. <br/>

Open another terminal `node ./dist/server.js`. <br/>


## presentation

Clone this repo : https://github.com/far-edge/PilotReshoring.git <br/>

Open a terminal in your machine

` cd /presentation/docker/ `
` ./start.sh `

### Installation

```
    cd /presentation/
    npm install
    npn start
```

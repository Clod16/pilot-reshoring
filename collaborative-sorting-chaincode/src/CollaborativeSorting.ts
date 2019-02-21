import shim = require('fabric-shim');
import { ChaincodeInterface, ChaincodeResponse, Stub } from 'fabric-shim';
import { ERRORS } from './constants/errors';
import { ChaincodeError } from './ChaincodeError';
import { StubHelper } from './StubHelper';
import { Transform } from './utils/datatransform';
import { Gate } from './Gate';
import { ItemType } from './ItemType';
import { Item } from './Item';
import { Event } from './Event';
import { EventContainer } from './EventContainer';
import { LedgerQueries } from './LedgerQueries';
import { LedgerDao } from './LedgerDao';
import { LedgerDaoCouch } from './LedgerDaoCouch';
import { LedgerDaoLevel } from './LedgerDaoLevel';

// import { EventPayload } from './EventPayload';

/**
 * The CollaborativeSorting class is a base class containing handlers for the `Invoke()` and `Init()` function which are required
 * by `fabric-shim`. The `Init()` function can be overwritten by just implementing it in your CollaborativeSorting implementation
 * class.
 */
export class CollaborativeSorting implements ChaincodeInterface {

    public logger: any;
    public ledgerDao: LedgerDao;

    constructor(logLevel?: string) {
        this.logger = shim.newLogger('CollaborativeSorting');
        this.logger.level = logLevel || 'debug';
        this.ledgerDao = new LedgerDaoCouch(this.logger);
        // this.logger = Helpers.getLoggerInstance(this.name, logLevel);
    }

    /* methods POST */
    /* storeItem(stub: Stub, itemStr: string) */
    /* The storeItem method is called to insert a Item in the Conveyor Loop */
    /* A exit Gate will be assigned to new Item */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async storeItem(stub: Stub, itemStr: string) {
        this.logger.info('************* storeItem *************');
        if (!itemStr) {
            throw new Error('storeItem - ERROR: NO Item in Input');
        }
        const item: Item = JSON.parse(itemStr);
        try {
            // await this.controlGates(stub);
            await this.assignItemToGate(stub, item);
            //  await this.chooseGateForItem(stub, item);
        } catch (err) {
            throw new Error('storeItem in assigne function - ERROR with code: ' + err);
        }
        try {
            let keyItem = await this.generateKey(stub, 'ITEM', item.id);
            this.logger.info('storeItem - PUT ITEM by id with KEY ITEM: ' + item.id);
            await stub.putState(keyItem, Buffer.from(JSON.stringify(item)));
        } catch (err) {
            throw new Error('storeItem in putState - ERROR with code: ' + err);
        }
    }

    /* methods POST */
    /* storeBay(stub: Stub, gate string) */
    /* The storeBay method is called to insert a new Bay in a Gate */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async storeBay(stub: Stub, gateStr: string) {
        this.logger.info('************* storeBay *************');
        if (!gateStr) {
            throw new Error(`storeBay - ERROR: NO Gate in Input`);
        }
        try {
            let gate: Gate = JSON.parse(gateStr);
            let gateIn = new Gate(gate.id, gate.idConnectedBay, gate.load, gate.enable, new Date());
            if (gate.preference != null) {
                gateIn.preference = gate.preference;
            }
            if (gate.payload != null) {
                gateIn.payload = gate.payload;
            }
            if (gate.items != null && gate.items != [] && gate.items.length != 0) {
                gateIn.items = gate.items;
            }
            if (gate.doubleSize != null) {
                gateIn.doubleSize = gate.doubleSize;
            }

            if (!gate.enable) {
                this.logger.warn('storeBay - ATTENTION!!! StoreBay of a DISABLE GATE: ' + gate.id + ' ' + gate.enable);
                this.logger.warn('storeBay - ATTENTION!!! StoreBay FORCED ENABLE TRUE');
                gateIn.enable = true;
            }
            this.logger.info('storeBay -> CALL doEditGate');
            await this.doEditGate(stub, gateIn);
            await this.doCreateEvent(stub, 'storeBay', gateIn, null);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* removeBay(stub: Stub, gate string) */
    /* The removeGate method is called to remove a Bay from a Gate */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async removeBay(stub: Stub, gateStr: string) {
        this.logger.info('************* removeBay *************');
        if (!gateStr) {
            throw new Error('removeBay - ERROR: NO Gate in Input');
        }
        try {
            let gate: Gate = JSON.parse(gateStr);
            let gateIn = new Gate(gate.id, null, 0, false, new Date());
            gateIn.payload = null;
            this.logger.info('removeBay -> CALL doEditGate');
            await this.doEditGate(stub, gateIn);
            await this.doCreateEvent(stub, 'removeBay', gateIn, null);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* heartbeat(stub: Stub, gate string) */
    /* The heartbeat method is called to keep on a Gate */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async heartbeat(stub: Stub, gateStr: string) {
        this.logger.info('************* heartbeat *************');
        if (!gateStr) {
            throw new Error(`heartbeat - ERROR: NO Gate in Input`);
        }
        try {
            let gate: Gate = JSON.parse(gateStr);
            this.logger.info('************* heartbeat for GATE: ' + gate.id + '*************');

            /*
            let keyGate: string = await this.generateKey(stub, 'GATE', gate.id);
            // let keyGate: string = 'GATE' + gate.id;
            this.logger.debug('heartbeat - GET GATE (gatState) by id with KEY: GATE ' + gate.id);
            let gateLedger = await stub.getState(keyGate);
            let gateReturn = Transform.bufferToObject(gateLedger) as Gate;
            this.logger.debug('GET GATE (gatState) ITEMS in gateLedger: ' + gateReturn.items.length);
            // let gateLedger = await this.getGateById(stub, gate.id);
            */

            // let gateReturn = await this.getGateByIdCouch(stub, gate.id);
            let gateReturn = await this.ledgerDao.getGateById(stub, gate.id);
            this.logger.info('************* GATELEDGER SEARCHED: ' + gateReturn.id + '*************');

            if (typeof gateReturn == 'undefined' || gateReturn == null) {
                throw new Error(`heartbeat - ERROR: Gate not found: ` + gateReturn.id);
            }

            // TEMPORARY 
            let its: Item[];
            its = await this.getItemsByGate(stub, gate.id);
            this.logger.debug('heartbeat - GATE IS ON  : ' + gate.id);
            this.logger.debug('heartbeat - GATE DBS    : ' + gate.doubleSize);
            this.logger.debug('heartbeat - NUMBER ITEMS: ' + its.length);
            for (let itemElem of its) {
                let item = itemElem as Item;
                this.logger.debug('heartbeat - ITEMS in GATE: ' + item.id);
            }

            gateReturn.enable = true;
            gateReturn.datetime = new Date();
            // this.logger.info('heartbeat -> CALL doEditGate');
            // await this.doEditGate(stub, gateReturn);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* editGate(stub: Stub, gate string) */
    /* The editGate method is called to update a Gate */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async editGate(stub: Stub, gateStr: string) {
        this.logger.info('************* editGate *************');
        if (!gateStr) {
            throw new Error(`editGate - ERROR: NO Gate in Input`);
        }
        try {
            let gate: Gate = JSON.parse(gateStr);
            // let gateIn = await this.getGateByIdCouch(stub, gate.id);
            let gateIn = await this.ledgerDao.getGateById(stub, gate.id);
            // let gateIn = new Gate(gate.id, gate.idConnectedBay, gate.load, gate.enable, new Date());

            if (gate.preference != null) {
                gateIn.preference = gate.preference;
            }
            if (gate.payload != null) {
                gateIn.payload = gate.payload;
            }
            if (gate.items != null && gate.items != []) {
                gateIn.items = gate.items;
            }
            if (gate.doubleSize != null) {
                gateIn.doubleSize = gate.doubleSize;
            }
            // await this.controlItemsNotAssigned(stub);
            this.logger.info('editGate -> CALL doEditGate');
            await this.doEditGate(stub, gate);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* switchBay(stub: Stub, gateId string, idConnectedBay string, enable boolean ) */
    /* The switchBay method is called to switch ON or switch OFF a bay connected to Gate */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    // public async switchBay(stub: Stub, gateId: string, idConnectedBay: string, enable: boolean) {
    public async switchBay(stub: Stub, args: string[]) {
        this.logger.info('************* switchBay *************');
        let gateId: string = args[0];
        let enable: boolean = (args[2] == 'true');
        let itemsToAssign: Item[] = [];
        if (!gateId) {
            throw new Error(`switchBay - ERROR: NO Gate in Input`);
        };
        try {

            /*    let keyGate: string = await this.generateKey(stub, 'GATE', gateId);
                let gateLedger = await stub.getState(keyGate);
                let gate = Transform.bufferToObject(gateLedger) as Gate;
            */
            // let gate: Gate = await this.getGateById(stub, gateId);
            // let gate: Gate = await this.getGateByIdCouch(stub, gateId);
            let gate:Gate = await this.ledgerDao.getGateById(stub, gateId);
            gate.enable = enable;

            if (!gate.enable) {
                if (gate.items != null && typeof gate.items !== 'undefined' && gate.items.length != 0) {
                    // Save the array of item to reassign to new gate after disable this
                    itemsToAssign = gate.items;
                }
                await this.doCreateEvent(stub, 'disableBay', gate, null);
                gate.items = [];
            }
            //else {
            //    await this.controlItemsNotAssigned(stub);
            //}

            this.logger.info('switchBay -> CALL doEditGate');
            await this.doEditGate(stub, gate);
            // ReAssign the items 
            if (itemsToAssign.length != 0) {
                for (let it of itemsToAssign) {

                    await this.assignItemToGate(stub, it);
                    // await this.chooseGateForItem(stub, it);
                }
            }

        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* updateLoad(stub: Stub, gateId string, idConnectedBay string, load string ) */
    /* The updateLoad method is called to change the value of load in a bay connected to Gate */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    // public async updateLoad(stub: Stub, gateId: string, idConnectedBay: string, load: string) {
    public async updateLoad(stub: Stub, args: string[]) {
        this.logger.info('************* updateLoad *************');
        let gateId: string = args[0];
        let load: string = args[2];
        if (!gateId) {
            throw new Error(`updateLoad - ERROR: NO Gate in Input`);
        };

        try {
            /*let keyGate: string = await this.generateKey(stub, 'GATE', gateId);
            let gateLedger = await stub.getState(keyGate);
            let gate = Transform.bufferToObject(gateLedger) as Gate;
            */
            //let gate = await this.getGateById(stub, gateId);
            // let gate = await this.getGateByIdCouch(stub, gateId);
            let gate = await this.ledgerDao.getGateById(stub, gateId);

            let loadNew = +load;
            let loadOld = gate.load;

            this.logger.debug('updateLoad - UPDATE LOAD GATE ID:' + gateId);
            this.logger.debug('updateLoad - OLD LOAD of GATE   :' + gate.load);
            this.logger.debug('updateLoad - NEW LOAD of GATE STR:' + load);
            gate.load = +load;
            this.logger.debug('updateLoad - NEW LOAD of GATE NUM:' + gate.load);
            this.logger.info('updateLoad -> CALL doEditGate');
            await this.doEditGate(stub, gate);

            //if (loadOld == 1 && loadNew < 1) {
            //    await this.controlItemsNotAssigned(stub);
            //}
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* editItemType(stub: Stub, itemTypeStr string) */
    /* The editItemType method is called to update a ItemType */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async editItemType(stub: Stub, itemTypeStr: string) {
        this.logger.info('************* editItemType *************');
        if (!itemTypeStr) {
            throw new Error(`editItemType - ERROR: NO ItemType in Input`);
        }
        try {
            let itemType: ItemType = JSON.parse(itemTypeStr);
            await this.doEditItemType(stub, itemType);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* grabItemIntoGate(stub: Stub, itemStr: string) */
    /* The grabItemIntoGate method is called to delete a item from grab list of Gate */
    /* When the Gate "captures" a Item from the Conveyor Loop, it is removed from the Map (GrabList - Routing Table)  */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async grabItemIntoGate(stub: Stub, itemStr: string) {
        this.logger.info('************* insertItemIntoBay *************');
        if (!itemStr) {
            throw new Error('insertItemIntoBay - ERROR No input Item');
        }
        try {
            const item: Item = JSON.parse(itemStr);
            await this.doGrabItem(stub, item);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods GET */
    /* getItemsByGate(stub: Stub, gateId: string) */
    /* The getItemsByGate method is called to GET a subset of "Map" with all items INTO CONVEYOR LOOP assigned at this Gate */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async getItemsByGate(stub: Stub, gateId: string) {
        this.logger.info('************* getItemsByGate *************');
        if (gateId == null || gateId == '') {
            throw new Error('getItemsByGate - ERROR No  input Gate');
        }
        try {

            // let gate = await this.getGateByIdCouch(stub, gateId);
            let gate = await this.ledgerDao.getGateById(stub, gateId);
            let items: Item[];
            this.logger.info('getItemsByGate for gate.id: ' + gateId);
            if (gate &&
                gate.items &&
                gate.items != null &&
                typeof gate.items != 'undefined') {
                this.logger.info('getItemsByGate items found number:: ' + gate.items.length);
                items = gate.items;
            }
            return items;
        } catch (err) {
            this.logger.error('getItemsByGate ERROR for gate.id: ' + gateId + ' with code error: ' + err);
            throw new Error('getItemsByGate ERROR: ' + err);
        }
    }

    
    /* methods POST */
    /* initConfiguration(stub: Stub) */
    /* The initConfiguration method is called to initialize the configuratione of ledger */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    public async initConfiguration(stub: Stub) {
        this.logger.info('************* initConfiguration *************');

        // INIT creates the Gate -1 for the items not assigned 
        let gateItemsNotAssigned = new Gate('-1', '-1', 0, true, new Date());
        try {
            this.logger.info('initConfiguration - Init Virtual Gate-> CALL doEditGate');
            await this.doEditGate(stub, gateItemsNotAssigned);
            // await this.doCreateEvent(stub, 'storeBay', gateItemsNotAssigned, null);
        } catch (err) {
            this.logger.error('initConfiguration - ERROR: Something wrong in doEditGate of gateItemsNotAssigned ' + err);
            throw new Error('initConfiguration - ERROR: Something wrong in doEditGate of gateItemsNotAssigned ' + err);
        }

        // INIT creates the Mixed Gate with id 30 for the spot item
        /*
        let gateMixed = new Gate('30', '30', 0, true, new Date());
        try {
            let typeStar: ItemType = {
                id: '*',
                description: '',
                doubleSize : false
            };
            gateMixed.preference = typeStar;
            this.logger.info('initConfiguration - Init Mixed Gate-> CALL doEditGate');
            await this.doEditGate(stub, gateMixed);
            await this.doCreateEvent(stub, 'storeBay', gateMixed, null);
        } catch (err) {
            this.logger.error('initConfiguration - ERROR: Something wrong in doEditGate of gateMixed ' + err);
            throw   new Error('initConfiguration - ERROR: Something wrong in doEditGate of gateMixed ' + err);
        } 
        */
    }

    /**
     * the name of the current CollaborativeSorting.
     *
     * @readonly
     * @type {string}
     * @memberof CollaborativeSorting
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * the Default StubHelper with extra functionality and return your own instance.
     *
     * @param {Stub} stub
     * @returns the stub helper for the given stub. This can be used to extend the stub functionality
     * @memberof CollaborativeSorting
     */
    getStubHelperFor(stub: Stub) {
        return new StubHelper(stub);

    }

    /**
     * The Init method is called when the Smart Contract is instantiated by the blockchain network
     * Best practice is to have any Ledger initialization in separate function -- see initLedger()
     *
     * @param {Stub} stub
     * @returns {Promise<ChaincodeResponse>}
     * @memberof CollaborativeSorting
     */
    async Init(stub: Stub): Promise<ChaincodeResponse> {
        this.logger.info(`=========== Instantiated ${this.name} CollaborativeSorting ===========`);
        this.logger.info(`Transaction ID: ${stub.getTxID()}`);
        this.logger.info(`Args: ${stub.getArgs().join(',')}`);
        let args = stub.getArgs();

        this.initConfiguration(stub);

        /*
                // INIT creates the Gate -1 for the items not assigned 
        
                let gateItemsNotAssigned = new Gate('-1', '-1', 0, true, new Date());
                try {
                    this.logger.info('Init Virtual Gate-> CALL doEditGate');
                    await this.doEditGate(stub, gateItemsNotAssigned);
                } catch (err) {
                    this.logger.error('INIT - ERROR: Something wrong in doEditGate of gateItemsNotAssigned ' + err);
                    throw new Error('INIT - ERROR: Something wrong in doEditGate of gateItemsNotAssigned ' + err);
                }
        
                // INIT creates the Mixed Gate with id 30 for the spot item
                let gateMixed = new Gate('30', '30', 0, true, new Date());
                try {
                    gateMixed.preference.id = '*';
                    this.logger.info('Init Mixed Gate-> CALL doEditGate');
                    await this.doEditGate(stub, gateMixed);
                } catch (err) {
                    this.logger.error('INIT - ERROR: Something wrong in doEditGate of gateMixed ' + err);
                    throw new Error('INIT - ERROR: Something wrong in doEditGate of gateMixed ' + err);
                }
                // This Gate is a virtual gate (-1) and will be contain the items not assigned at any Gate (connectedBay)
                let gateInit: Gate;
                gateInit = await this.getGateById(stub, '-1');
                this.logger.info('INIT - This Gate is a virtual gate (-1) and contains the items not assigned');
            */
        // this.logger.info('INIT - The id of virtual gate is: ' + gateInit.id);

        /* Init method initializes a List of Bay (allBays) and a List of Type (allTypes)  */
        /* INIT 2 types initial (869990965260, 869990965261) */
        // DA QUI
        /*        let typeA: ItemType = {
                    id: '869990965260',
                    description: ''
                };
        
                let typeB: ItemType = {
                    id: '869990965261',
                    description: ''
                };
        
                try {
                    await stub.putState(typeA.id, Buffer.from(JSON.stringify(typeA)));
                    await stub.putState(typeB.id, Buffer.from(JSON.stringify(typeB)));
                    await this.doEditItemType(stub, typeA);
                    await this.doEditItemType(stub, typeB);
                } catch (err) {
                    this.logger.error('INIT - ERROR: Something wrong in put State of types ' + err);
                    throw new Error('INIT - ERROR: Something wrong in put State of types ' + err);
                }
                A QUI */
        /* INIT 10 gates initial (with precerence) */
        // @FIXME Use Loop for repetitive tasks

        /* (producer: string, type:string, pushQuantity:string, speed:string, temperature:string, length:string,
            width:string, motorFrequency:string, motorVoltage: string, acceptedProduct:string) */
        /* QUI let payloadDefault = new Payload('Interroll', 'NST21550', '5', '1', '22', '500', '300', '60', '230', ''); */

        // (id: string, idConnectedBay:string, load:number, enable:boolean, datetime:Date) {

        /*    
        let gateZero = new Gate('10', 'xcvbnm', 0, true, new Date());
        //gateZero.addPreference(typeA);

        let gateOne = new Gate('15', 'asdfghjkl', 0, true, new Date());
        //gateOne.addPreference(typeB);

        let gateTwo = new Gate('20', 'qwertyuiop', 0, true, new Date());
        //gateTwo.addPreference(typeB);

        let gateThree = new Gate('25', '1234567890', 0, true, new Date());
        //gateThree.addPreference(typeA);
        this.logger.info('Init MULTIPLE -> CALL doEditGate');
        await this.doEditGate(stub, gateZero);
        await this.doEditGate(stub, gateOne);
        await this.doEditGate(stub, gateTwo);
        await this.doEditGate(stub, gateThree);
        */
        /* DA QUI  
                let gateFour = new Gate('4', '8', 0, true, '20', new Date());
                gateFour.addPreference(typeB);
                payloadDefault.acceptedProduct = typeB.id;
                gateFour.payload = payloadDefault;
        
                let gateFive = new Gate('5', '10', 0, true, '25', new Date());
                gateFive.addPreference(typeA);
                payloadDefault.acceptedProduct = typeA.id;
                gateFive.payload = payloadDefault;
        
                let gateSix = new Gate('6', '12', 0, true, '30', new Date());
                gateSix.addPreference(typeB);
                payloadDefault.acceptedProduct = typeB.id;
                gateSix.payload = payloadDefault;
        
                let gateSeven = new Gate('7', '14', 0, true, '35', new Date());
                gateSeven.addPreference(typeA);
                payloadDefault.acceptedProduct = typeA.id;
                gateSeven.payload = payloadDefault;
        
                let gateEight = new Gate('8', '16', 0, true, '40', new Date());
                gateEight.addPreference(typeA);
                payloadDefault.acceptedProduct = typeA.id;
                gateEight.payload = payloadDefault;
        
                let gateNine = new Gate('9', '18', 0, true, '45', new Date());
                gateNine.addPreference(typeB);
                payloadDefault.acceptedProduct = typeB.id;
                gateNine.payload = payloadDefault;
        
                try {
                    await this.doEditGate(stub, gateZero);
                    await this.doEditGate(stub, gateOne);
                    await this.doEditGate(stub, gateTwo);
                    await this.doEditGate(stub, gateThree);
                    await this.doEditGate(stub, gateFour);
                    await this.doEditGate(stub, gateFive);
                    await this.doEditGate(stub, gateSix);
                    await this.doEditGate(stub, gateSeven);
                    await this.doEditGate(stub, gateEight);
                    await this.doEditGate(stub, gateNine);
                } catch (err) {
                    this.logger.error('INIT - ERROR: Something wrong in doEditGate of gate ' + err);
                    throw new Error('INIT - ERROR: Something wrong in doEditGate of gate ' + err);
                }
                A QUI */
        // In INIT all Items must have state null
        /*       let iterator = await stub.getStateByPartialCompositeKey('ITEM', []);
               let items = await Transform.iteratorToObjectList(iterator);
               if (items != null) {
                   for (let itemElem of items) {
                       let item = itemElem as Item;
                       try {
                           let keyItem = await this.generateKey(stub, 'ITEM', item.id);
                           this.logger.debug('PUT ITEM by id with KEY: ' + keyItem + '<- ');
                           await this.storeItem(stub, JSON.stringify(item));
                           // await stub.putState(keyItem, Buffer.from(JSON.stringify(item)));
                       } catch (err) {
                           this.logger.error('INIT - ERROR: Something wrong in put State of item ' + err);
                           throw new Error('INIT - ERROR: Something wrong in put State of item ' + err);
                       }
                   }
               }
       */

        // @FIXME Use Loop for repetitive tasks
        return await this.executeMethod('init', args, stub, true);
    }

    /**
     * The Invoke method is called as a result of an application request to run the Smart Contract.
     * The calling application program has also specified the particular smart contract
     * function to be called, with arguments
     *
     * @param {Stub} stub
     * @returns {Promise<ChaincodeResponse>}
     * @memberof CollaborativeSorting
     */
    async Invoke(stub: Stub): Promise<ChaincodeResponse> {

        this.logger.info(`=========== Invoked CollaborativeSorting ${this.name} ===========`);
        this.logger.info(`Transaction ID: ${stub.getTxID()}`);
        this.logger.info(`Args: ${stub.getArgs().join(',')}`);

        let ret = stub.getFunctionAndParameters();
        let fcn = ret.fcn;
        // let args = ret.params;

        this.logger.info('Invoke function: ' + fcn);
        return await this.executeMethod(ret.fcn, ret.params, stub);
    }

    /**
     * Handle custom method execution
     *
     * @param {string} fcn
     * @param {string[]} params
     * @param stub
     * @param {boolean} silent
     * @returns {Promise<any>}
     */
    private async executeMethod(fcn: string, params: string[], stub: Stub, silent = false) {
        let method = this[fcn];

        if (!method) {
            if (!silent) {
                this.logger.error(`no function of name: ${fcn} found`);

                throw new ChaincodeError(ERRORS.UNKNOWN_FUNCTION_ERROR, {
                    'function': fcn
                });
            } else {
                return shim.success(); /* fcn null and silent = true */
            }
        }

        try {
            this.logger.debug(`============= START : ${fcn} ===========`);

            // let payload = await method.call(this, this.getStubHelperFor(stub), params);
            // ascatox Using this.getStubHelper is impossible to test :-(
            let arg: String = '';
            let payload = null;
            if (params && params[0] && params.length == 1) {
                arg = params[0];
                payload = await method.call(this, stub, arg);
            } else if (params.length > 1) {
                payload = await method.call(this, stub, params);
            }

            if (payload && !Buffer.isBuffer(payload)) {
                payload = Buffer.from(JSON.stringify(Transform.normalizePayload(payload)));
            }

            this.logger.debug(`============= END : ${fcn} ===========`);

            return shim.success(payload);

        } catch (err) {
            let error = err;

            const stacktrace = err.stack;

            if (!(err instanceof ChaincodeError)) {
                error = new ChaincodeError(ERRORS.UNKNOWN_ERROR, {
                    'message': err.message
                });
            }
            this.logger.error(stacktrace);
            this.logger.error(`Data of error ${err.message}: ${JSON.stringify(err.data)}`);

            return shim.error(error.serialized);
        }
    }

    /* methods POST */
    /* controlGates() */
    /* The controlGates method is called to extract and control all gates  */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    private async controlGates(stub: Stub) {
        this.logger.info('######################## controlGates #######################');
        try {

            let queryIterator = await stub.getQueryResult(LedgerQueries.queryGatesObj());
            let queryList = await Transform.iteratorToList(queryIterator);
            let gates: Gate[] = queryList;

            let displayDate: Date = new Date();
            let mill = displayDate.getTime();
            //    mill = mill - 60000;      // 60 secondi
            mill = mill - 1800000;      // 1800000 ms = 1800 s = 30 m
            for (let gate of gates) {
                let exitGate = gate as Gate;
                let gateDate = new Date(exitGate.datetime).getTime();
                let itemsToAssign: Item[] = [];

                // TEMPORARY LOG
                let its = Array<Item>();
                its = await this.getItemsByGate(stub, exitGate.id);
                this.logger.debug('controlGates - GATE IS: ' + exitGate.enable);
                this.logger.debug('controlGates - NUMBER ITEMS in GATE LEDGER: ' + its.length);
                for (let itemElem of its) {
                    let item = itemElem as Item;
                    this.logger.debug('controlGates - ITEMS in GATE LEDGER: ' + item.id);
                }
                // END TEMPORARY LOG

                if (exitGate.id != '-1' && gateDate < mill) {
                    this.logger.error('controlGates - Gate with id: ' + exitGate.id + ' switched OFF due to inactivity ');
                    if (exitGate.items != null && typeof exitGate.items !== 'undefined' && exitGate.items.length != 0) {
                        exitGate.enable = false;
                        // Save the array of item to reassign to new gate after disable this
                        itemsToAssign = exitGate.items;
                    }

                    await this.doCreateEvent(stub, 'disableBay', exitGate, null);
                    exitGate.items = [];
                    this.logger.info('controlGates -> CALL doEditGate');
                    await this.doEditGate(stub, exitGate);
                    // ReAssign the items 
                    if (itemsToAssign.length != 0) {
                        for (let it of itemsToAssign) {

                            await this.assignItemToGate(stub, it);
                            // await this.chooseGateForItem(stub, it);
                        }
                    }
                }
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* controlItemsNotAssigned() */
    /* The controlItemsNotAssigned method is called to reassigned the items not assigned before  */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    private async controlItemsNotAssigned(stub: Stub) {
        this.logger.info('######################## controlItemsNotAssigned #######################');
        try {
            // let gateVirtual = await this.getGateById(stub, '-1');
            // let gateVirtual = await this.getGateByIdCouch(stub, '-1');
            let gateVirtual = await this.ledgerDao.getGateById(stub, '-1');

            this.logger.debug('controlItemsNotAssigned - Number of item not assigned: ' + gateVirtual.items.length);
            if (gateVirtual.items && gateVirtual.items.length > 0) {
                let items = gateVirtual.items;
                gateVirtual.items = [];
                this.logger.info('controlItemsNotAssigned -> CALL doEditGate');
                await this.doEditGate(stub, gateVirtual);
                for (let item of items) {
                    await this.assignItemToGate(stub, item);
                    // await this.chooseGateForItem(stub, item);
                }
            }
        } catch (err) {
            this.logger.error('controlItemsNotAssigned - Error with code: ' + err);
            throw new Error(err);
        }
    }

    /* methods POST */
    /* assignItemToGate */
    /* The assignItemToGate method is called to assign a exit gate to item in parameter */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    private async assignItemToGate(stub: Stub, item: Item) {
        this.logger.info('######################## assignItemToGate #######################');

        let gateCompatible: Gate[] = [];
        let gateAvailable: Gate[] = [];
        let gateMixed: Gate[] = [];
        let gateSelected: Gate;
        // let gateNotAssigned: Gate = await this.getGateById(stub, '-1');
        // let gateNotAssigned: Gate = await this.getGateByIdCouch(stub, '-1');
        let gateNotAssigned: Gate = await this.ledgerDao.getGateById(stub, '-1');
        // let isInitGate: Boolean;
        let isAvailableToChangePref: Boolean;

        try {
            let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
            let gates = await Transform.iteratorToObjectList(iterator);

            this.logger.info('######### Number of GATE to scroll to associate the item ########');
            this.logger.debug('assignItemToGate - NUMBER OF GATES  : ' + gates.length);
            this.logger.debug('assignItemToGate - ITEM TO ASSIGN ID: ' + item.id);
            this.logger.debug('assignItemToGate - ITEM ITEMTYPE  ID: ' + item.type.id);
            this.logger.debug('assignItemToGate - ITEM ITEMTYPE DBS: ' + item.type.doubleSize);
            this.logger.info('##################################################################');

            // Order by id, for assign the items before a the gate with id lower -> TODO distance!
            this.OrderByArray(gates, 'id');

            for (let gate of gates) {
                let exitGate = gate as Gate;
                isAvailableToChangePref = false;
                if (exitGate.id != '-1' && exitGate.enable && exitGate.idConnectedBay != null) {
                    this.logger.debug('assignItemToGate - PROCESS GATE ID    : ' + exitGate.id);
                    this.logger.debug('assignItemToGate - GATE IDCONNECTEDBAY: ' + exitGate.idConnectedBay);
                    this.logger.debug('assignItemToGate - GATE LOAD          : ' + exitGate.load);
                    this.logger.debug('assignItemToGate - GATE ENABLE        : ' + exitGate.enable);
                    this.logger.debug('assignItemToGate - GATE doubleSize    : ' + exitGate.doubleSize);
                    if (exitGate.load < 1) {
                        if (exitGate.preference != null &&
                            typeof exitGate.preference != 'undefined' &&
                            exitGate.preference.id == item.type.id) {
                            this.logger.debug('assignItemToGate - GATE PREFERENCE: ' + exitGate.preference.id);
                            gateCompatible.push(exitGate);
                        } else {
                            if ((typeof exitGate.preference === 'undefined' ||
                                exitGate.preference == null ||
                                exitGate.preference.id == null) &&
                                exitGate.doubleSize === item.type.doubleSize) {
                                this.logger.debug('assignItemToGate - GATE WITHOUT PREFERENCE: ' + exitGate.id);
                                this.logger.debug('assignItemToGate - GATE doubleSize        : ' + exitGate.doubleSize);
                                gateAvailable.push(exitGate);
                            } else {
                                if (exitGate.preference != null &&
                                    typeof exitGate.preference != 'undefined' &&
                                    exitGate.preference.id == '*') {
                                    this.logger.debug('assignItemToGate - GATE mixed: ' + exitGate.id);
                                    gateMixed.push(exitGate);
                                } else {
                                    if (exitGate.preference != null &&
                                        typeof exitGate.preference != 'undefined' &&
                                        exitGate.items.length == 0 &&
                                        exitGate.load == 0 &&
                                        exitGate.doubleSize === item.type.doubleSize) {
                                        this.logger.debug('assignItemToGate - GATE NOT COMPATIBLE BUT WITHOUT ITEMS: ' + exitGate.id);
                                        this.logger.debug('assignItemToGate - GATE PREFERENCE     ID: ' + exitGate.preference.id);
                                        isAvailableToChangePref = true;
                                        gateAvailable.push(exitGate);
                                    } else {
                                        this.logger.debug('assignItemToGate - GATE NOT COMPATIBLE ID: ' + exitGate.id);
                                        if (exitGate.preference != null &&
                                            typeof exitGate.preference != 'undefined') {
                                            this.logger.debug('assignItemToGate - GATE PREFERENCE     ID: ' + exitGate.preference.id);
                                        }
                                        //    gateNotAssigned = await this.getGateById(stub, '-1');;
                                    }

                                }
                            }
                        }

                    } else {
                        this.logger.info('assignItemToGate - GATE OVERLOAD ID: ' + exitGate.id);
                        this.logger.info('assignItemToGate - GATE LOAD       : ' + exitGate.load);
                    }
                }
            }

            // isInitGate = false;
            this.logger.debug('assignItemToGate - Number of Gate Compatible: ' + gateCompatible.length);
            this.logger.debug('assignItemToGate - Number of Gate Avaiable  : ' + gateAvailable.length);
            this.logger.debug('assignItemToGate - Number of Gate Mixed     : ' + gateMixed.length);

            if (gateCompatible.length > 0) {
                this.logger.debug('assignItemToGate - GATE SELECTED Compatible: ' + gateCompatible[0].id);
                this.logger.debug('assignItemToGate - WITH PREFERENCE         : ' + gateCompatible[0].preference.id);
                gateSelected = gateCompatible[0];
            } else if (gateAvailable.length > 0) {
                this.logger.debug('assignItemToGate - GATE SELECTED Available: ' + gateAvailable[0].id);
                gateSelected = gateAvailable[0];
                gateSelected.preference = item.type;
                // isInitGate = true;
            } else if (gateMixed.length > 0) {
                this.logger.debug('assignItemToGate - GATE SELECTED Mixed: ' + gateMixed[0].id);
                gateSelected = gateMixed[0];
            } else {
                this.logger.warn('assignItemToGate - GATE NOT FOUND. ITEM NOT ASSIGNED');
                gateSelected = gateNotAssigned;
            }
            // gateSelected.items.indexOf(item) === -1 ? 
            // gateSelected.items.push(item) : 
            // this.logger.warn('assignItemToGate - ITEM: ' + item.id + 'ALREADY PRESENT IN GATE: '+ gateSelected.id);;
            gateSelected.items.push(item);
            gateSelected.datetime = new Date();
            this.logger.info('assignItemToGate -> CALL doEditGate');
            await this.doEditGate(stub, gateSelected);

            // TODO addPreference at next bay (only preference, no item). 
            /* if (isInitGate && gateAvailable[1]) {
                gateSelected = gateAvailable[1];
                gateSelected.preference = item.type;
                await this.doEditGate(stub, gateSelected);
            } */


            this.logger.debug('assignItemToGate - CREATE EVENT. ITEM ASSIGNED: ' + item.id);
            await this.doCreateEvent(stub, 'assignItemToGate', gateSelected, item);

        } catch (err) {
            throw new Error(err);
        }
    };

    /* methods POST */
    /* doEditGate */
    /* The doEditGate method is called to  Write (insert or update) the GATE into the Ledger */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    private async doEditGate(stub: Stub, gate: Gate) {
        this.logger.info('########### doEditGate: ' + gate.id + ' ###########');

        try {
            let keyGate = await this.generateKey(stub, 'GATE', gate.id);
            this.logger.debug('doEditGate - GATE with ID        : ' + gate.id);
            this.logger.debug('doEditGate - Items in gate edited: ' + gate.items.length);
            this.logger.debug('doEditGate - Gate.enable         : ' + gate.enable);
            this.logger.debug('doEditGate - Gate.load           : ' + gate.load);
            this.logger.debug('doEditGate - Gate.doubleSize     : ' + gate.doubleSize);
            await stub.putState(keyGate, Buffer.from(JSON.stringify(gate)));
        } catch (err) {
            this.logger.error('doEditGate - ERROR: Something wrong in put State of gate ' + err);
            this.logger.error('doEditGate - GATE id: ' + gate.id);
            throw new Error('doEditGate - ERROR: Something wrong in put State of bay ' + err);
        }
    }

    /* doCreateEvent */
    /* The doCreateEvent method is called to create a Event */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    private async doCreateEvent(stub: Stub, funct: string, gate: Gate, item: Item) {
        this.logger.info('########### doCreateEvent ###########');
        if (funct == null || (funct != 'storeBay' && funct != 'removeBay' &&
            funct != 'assignItemToGate' && funct != 'disableBay')) {
            this.logger.error('doCreateEvent ERROR: funct is empty or not valid value: ' + funct);
            throw new Error('doCreateEvent ERROR: id is empty or not valid value: ' + funct);
        }
        try {
            let idPreference = '';
            if (typeof gate.preference !== 'undefined' &&
                gate.preference != null &&
                typeof gate.preference.id !== 'undefined') {
                idPreference = gate.preference.id;
            }

            this.logger.info('doCreateEvent SEND PREFERENCE      : ' + idPreference);
            this.logger.info('doCreateEvent SEND POSITION (id)   : ' + gate.id);
            this.logger.info('doCreateEvent SEND IDCONNECTEDBAY  : ' + gate.idConnectedBay);
            this.logger.info('doCreateEvent SEND DOUBLESIZE      : ' + gate.doubleSize);
            let event = new Event(gate.idConnectedBay,
                gate.id, JSON.stringify(gate.payload),
                idPreference,
                gate.doubleSize);
            if (item) {
                event.payload = JSON.stringify(item);
            }
            let eventContainer = new EventContainer(funct, event);
            const payload = JSON.stringify(eventContainer);
            stub.setEvent('EVENT', Buffer.from(payload));
            this.logger.info('Event generated with payload: ' + payload);
        } catch (err) {
            this.logger.error('doCreateEvent - ERROR: Something wrong in Event construction ' + err);
            throw new Error('doCreateEvent - ERROR: Something wrong in Event construction ' + err);
        }
    }

    /* methods POST */
    /* doEditItemType */
    /* The doEditItemType method is called to  Write (insert or update) the itemType into the Ledger */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    private async doEditItemType(stub: Stub, itemType: ItemType) {
        this.logger.info('########### insertItemGateIntoTheLedger ###########');

        try {
            let keyItemType = await this.generateKey(stub, 'ITEMTYPE', itemType.id);
            this.logger.debug('PUT ITEMTYPE by id with KEY: ITEMTYPE ' + itemType.id + '<- ');
            await stub.putState(keyItemType, Buffer.from(JSON.stringify(itemType)));
        } catch (err) {
            this.logger.error('doEditItemType - ERROR: Something wrong in put State of itemType ' + err);
            this.logger.error('doEditItemType - ITEMTYPE id: ' + itemType.id);
            throw new Error('doEditItemType - ERROR: Something wrong in put State of itemType ' + err);
        }
    }

    private async OrderByArray(values: any[], orderType: any) {
        return values.sort((a, b) => {
            if (a[orderType] < b[orderType]) {
                return -1;
            }

            if (a[orderType] > b[orderType]) {
                return 1;
            }
            return 0;
        });
    }

    /* methods POST */
    /* doGrabItem */
    /* The doGrabItem method is called to Delete item from the ledger because is grabbed by Gate (Bay) */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    private async doGrabItem(stub: Stub, item: Item) {
        this.logger.info('########### doGrabItem id: ' + item.id + ' ###########');
      
        let queryIterator = await stub.getQueryResult(LedgerQueries.queryGatesObj());
        let queryList = await Transform.iteratorToList(queryIterator);            
        let gates = await queryList;


        let isFound = false;
        for (let gate of gates) {
            let gat = gate as Gate;
            let exitGate = new Gate(gat.id, gat.idConnectedBay, gat.load, gat.enable, gat.datetime);
            if (gat.preference != null) {
                exitGate.preference = gat.preference;
            }
            if (gat.payload != null) {
                exitGate.payload = gat.payload;
            }
            this.logger.debug('doGrabItem - Gate with number of items: ' + gat.items.length);
            if (gat.items != null && gat.items != [] && gat.items.length != 0) {

                let its = Array<Item>();
                its = await this.getItemsByGate(stub, gat.id);
                exitGate.items = its;
            }

            this.logger.debug('doGrabItem - Gate with id                   : ' + exitGate.id);
            this.logger.debug('doGrabItem - Gate with enable               : ' + exitGate.enable);
            this.logger.debug('doGrabItem - Gate with idConnectedBay       : ' + exitGate.idConnectedBay);
            this.logger.debug('doGrabItem - Gate with exitGate.items.length: ' + exitGate.items.length);
            this.logger.debug('doGrabItem - Gate with exitGate.doubleSize  : ' + exitGate.doubleSize);

            if (!isFound &&
                exitGate.enable &&
                exitGate.idConnectedBay != null &&
                exitGate.items != null &&
                exitGate.items.length != 0) {

                this.logger.debug('doGrabItem - Gate with id: ' + exitGate.id + ' has items not null: ' + exitGate.items.length);
                for (let itemOfGate of exitGate.items) {
                    this.logger.debug('doGrabItem - Gate with id: ' + exitGate.id + ' contains item with id: ' + itemOfGate.id);
                    if (item.id == itemOfGate.id) {
                        this.logger.debug('doGrabItem - Item with id: ' + item.id + ' found into Gate: ' + exitGate.id);
                        isFound = true;
                        try {
                            /* remove the item from the list items assigned to the Gate exitGate and update the Gate */
                            let itRemoved = await exitGate.items.splice(exitGate.items.indexOf(itemOfGate), 1);
                            this.logger.info('doGrabItem -> ITEM REMOVED ID: ' + itRemoved[0].id);
                            this.logger.info('doGrabItem -> CALL doEditGate');
                            await this.doEditGate(stub, exitGate);
                            this.logger.debug('doGrabItem - Post editGate method: ' + exitGate.id);
                        } catch (err) {
                            this.logger.error('doGrabItem - ERROR in call doEditGate: itemOfGate.id: ' + itemOfGate.id);
                            throw new Error('doGrabItem - doEditGate ERROR with code: ' + err);
                        }

                        try {
                            /* remove the item from the ledger; items is into the bay */
                            await this.doDeleteItem(stub, item);
                            this.logger.debug('doGrabItem - Item with id: ' + item.id + ' removed from the Conveyor Loop (and from the Ledger)');
                            break;
                        } catch (err) {
                            this.logger.error('doGrabItem - ERROR in call doDeleteItem: item.id: ' + item.id);
                            throw new Error('doGrabItem - doDeleteItem ERROR with code: ' + err);
                        }
                    }
                }
            }
        }
        if (!isFound) {

            this.logger.warn('doGrabItem - #####################################################################');
            this.logger.warn('doGrabItem - *********************************************************************');
            this.logger.warn('doGrabItem - ERROR: item not found in any gate. Please try later!!!!!!!!!!');
            this.logger.warn('doGrabItem - ITEM id: ' + item.id);
            this.logger.warn('doGrabItem - *********************************************************************');
            this.logger.warn('doGrabItem - #####################################################################');
            // throw new Error('doGrabItem - ERROR: ITEM id: ' + item.id + ' not found in any gate');
        }
    }

    /* methods POST */
    /* doDeleteItem */
    /* The doDeleteItem method is called to  delete the ITEM from the Ledger */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    private async doDeleteItem(stub: Stub, item: Item) {
        this.logger.info('########### doDeleteItem : ' + item.id + ' ###########');

        try {
            let keyItem = await this.generateKey(stub, 'ITEM', item.id);
            await stub.deleteState(keyItem);
        } catch (err) {
            this.logger.error('doDeleteItem - ERROR: Something wrong in delete State of item ' + err);
            this.logger.error('doDeleteItem - Item id: ' + item.id);
            throw new Error('doDeleteItem - ERROR: Something wrong in delete State of item ' + err);
        }
    }

    private async  generateKey(stub: Stub, type: string, id: string) {
        return stub.createCompositeKey(type, [id]);
        // return type + ' ' + id;
    }
}   
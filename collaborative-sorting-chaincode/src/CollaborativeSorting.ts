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

/* Map for position - gate to search easily the gate associated when will be connect a new Bay */
let mapPosGate = new Map();

// import { EventPayload } from './EventPayload';

/**
 * The CollaborativeSorting class is a base class containing handlers for the `Invoke()` and `Init()` function which are required
 * by `fabric-shim`. The `Init()` function can be overwritten by just implementing it in your CollaborativeSorting implementation
 * class.
 */
export class CollaborativeSorting implements ChaincodeInterface {

    public logger: any;

    constructor(logLevel?: string) {
        this.logger = shim.newLogger('CollaborativeSorting');
        this.logger.level = logLevel || 'debug';
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
            await this.controlGates(stub);
            await this.controlItemsNotAssigned(stub);
            await this.assignItemToGate(stub, item);
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
            if (gate.items != null && gate.items != []) {
                gateIn.items = gate.items;
            }
            this.logger.info('storeBay -> CALL doEditGate');
            await this.doEditGate(stub, gateIn);
            await this.doCreateEvent(stub, 'storeBay', gateIn, null);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* updateBay(stub: Stub, gate string) */
    /* The updateGate method is called to change the data of a Bay in a Gate */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async updateBay(stub: Stub, gateStr: string) {
        this.logger.info('************* updateBay *************');
        if (!gateStr) {
            throw new Error(`updateBay - ERROR: NO Gate in Input`);
        }
        try {
            await this.storeBay(stub, gateStr);
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

            let keyGate: string = await this.generateKey(stub, 'GATE', gate.id);
            // let keyGate: string = 'GATE' + gate.id;
            this.logger.debug('heartbeat - GET GATE (gatState) by id with KEY: GATE ' + gate.id);
            let gateLedger = await stub.getState(keyGate);

            let gateReturn = Transform.bufferToObject(gateLedger) as Gate;
            this.logger.debug('GET GATE (gatState) ITEMS in gateLedger: ' + gateReturn.items.length);
            // let gateLedger = await this.getGateById(stub, gate.id);
            this.logger.info('************* GATELEDGER SEARCHED: ' + gateReturn.id + '*************');
            if (typeof gateReturn == 'undefined' || gateReturn == null) {
                throw new Error(`heartbeat - ERROR: Gate not found: ` + gateReturn.id);
            }

            // TEMPORARY 
            let its = Array<Item>();
            its = await this.getItemsByGate(stub, gate.id);
            this.logger.debug('heartbeat - GATE IS ON: ' + gate.id);
            this.logger.debug('heartbeat - NUMBER ITEMS in GATE LEDGER: ' + its.length);
            for (let itemElem of its) {
                let item = itemElem as Item;
                this.logger.debug('heartbeat - ITEMS in GATE LEDGER: ' + item.id);
            }



            gateReturn.datetime = new Date();
            this.logger.info('heartbeat -> CALL doEditGate');
            await this.doEditGate(stub, gateReturn);
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

            let gateIn = new Gate(gate.id, gate.idConnectedBay, gate.load, gate.enable, new Date());
            if (gate.preference != null) {
                gateIn.preference = gate.preference;
            }
            if (gate.payload != null) {
                gateIn.payload = gate.payload;
            }
            if (gate.items != null && gate.items != []) {
                gateIn.items = gate.items;
            }
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
    public async switchBay(stub: Stub, gateId: string, idConnectedBay: string, enable: boolean) {
        this.logger.info('************* switchBay *************');
        if (!gateId) {
            throw new Error(`switchBay - ERROR: NO Gate in Input`);
        }
        try {
            let gate: Gate = await this.getGateById(stub, gateId);
            gate.enable = enable;

            if (!gate.enable) {
                if (gate.items != null && typeof gate.items !== 'undefined' && gate.items.length != 0) {
                    for (let item of gate.items) {
                        await this.assignItemToGate(stub, item);
                    }
                }
            }
            await this.doCreateEvent(stub, 'disableBay', gate, null);
            gate.items = [];
            this.logger.info('switchBay -> CALL doEditGate');
            await this.doEditGate(stub, gate);

        } catch (err) {
            throw new Error(err);
        }
    }


    /* methods POST */
    /* updateLoad(stub: Stub, gateId string, idConnectedBay string, load double ) */
    /* The updateLoad method is called to change the value of load in a bay connected to Gate */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async updateLoad(stub: Stub, gateId: string, idConnectedBay: string, load: string) {
        this.logger.info('************* updateLoad *************');
        if (!gateId) {
            throw new Error(`updateLoad - ERROR: NO Gate in Input`);
        };

        try {
            let gate: Gate = await this.getGateById(stub, gateId);
            gate.load = +load;
            this.logger.info('updateLoad -> CALL doEditGate');
            await this.doEditGate(stub, gate);
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
            let keyGate: string = await this.generateKey(stub, 'GATE', gateId);
            let gate = await stub.getState(keyGate);
            const gateObj = (Transform.bufferToObject(gate) as Gate);
            let items = Array<Item>();
            this.logger.info('getItemsByGate for gate.id: ' + gateId);
            if (gateObj && gateObj.items && gateObj.items != null && typeof gateObj.items != 'undefined') {
                this.logger.info('getItemsByGate items found number:: ' + gateObj.items.length);
                items = gateObj.items;
            }
            return items;
        } catch (err) {
            this.logger.error('getItemsByGate ERROR for gate.id: ' + gateId + ' with code error: ' + err);
            throw new Error('getItemsByGate ERROR: ' + err);
        }
    }

    /* methods GET */
    /* getGateById(stub: Stub, id: string) */
    /* The getGateById method is called to GET the gate with this id */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    public async getGateById(stub: Stub, gateId: string) {
        this.logger.info('************* getGateById: ' + gateId + ' *************');
        if (gateId == null || gateId == '') {
            this.logger.error('getGateById ERROR: id is empty or null!');
            throw new Error('getGateById ERROR: id is empty or null!');
        }
        try {
            let keyGate: string = await this.generateKey(stub, 'GATE', gateId);
            this.logger.debug('getGateById - GET GATE by id with KEY GATE : ' + gateId);

            let gate = await stub.getState(keyGate);
            return Transform.bufferToObject(gate) as Gate;
        } catch (err) {
            this.logger.error('getGateById ERROR: Gate not found with this id: ' + gateId);
            throw new Error('getGateById ERROR: ' + err);
            // return new Error('getGateById ERROR: ' + err);
        }
    }

    /* methods GET */
    /* getGates(stub: Stub) */
    /* The getGates method is called to GET all Gates */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    public async getGates(stub: Stub) {
        this.logger.info('************* getGates *************');
        try {
            let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
            let gates = await Transform.iteratorToObjectList(iterator);
            return gates;
        } catch (err) {
            this.logger.error('getGates ERROR code: ' + err);
            return new Error('getGates ERROR: ' + err);
        }
    }

    /* methods GET */
    /* getItems(stub: Stub) */
    /* The getItems method is called to GET all Items */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    public async getItems(stub: Stub) {
        this.logger.info('************* getItems *************');
        try {
            let iterator = await stub.getStateByPartialCompositeKey('ITEM', []);
            let items = await Transform.iteratorToObjectList(iterator);
            return items;
        } catch (err) {
            this.logger.error('getItems ERROR code: ' + err);
            return new Error('getItems ERROR: ' + err);
        }
    }

    /* methods GET */
    /* getItemById(stub: Stub, id: string) */
    /* The getItemById method is called to GET the item with this id */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    public async getItemById(stub: Stub, itemId: string) {
        this.logger.info('************* getItemById: ' + itemId + '  *************');
        if (itemId == null || itemId == '') {
            this.logger.error('getItemById ERROR: id is empty or null!');
            throw new Error('getItemById ERROR: id is empty or null!');
        }
        try {
            let keyItem: string = await this.generateKey(stub, 'ITEM', itemId);
            this.logger.debug('GET ITEM by id with KEY: ITEM ' + itemId);
            let item = await stub.getState(keyItem);
            return Transform.bufferToObject(item) as Item;
        } catch (err) {
            this.logger.warn('getItemById WARNING: Item not found with this id: ' + itemId);
            throw new Error('getItemById ERROR: item not found!');
        }
    }

    /* methods GET */
    /* getItemTypeById(stub: Stub, id: string) */
    /* The getItemTypeById method is called to GET the itemType with this id */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    public async getItemTypeById(stub: Stub, itemTypeId: string) {
        this.logger.info('************* getItemTypeById: ' + itemTypeId + '  *************');
        if (itemTypeId == null || itemTypeId == '') {
            this.logger.error('getItemTypeById ERROR: id is empty or null!');
            throw new Error('getItemTypeById ERROR: id is empty or null!');
        }
        try {
            let keyItemType: string = await this.generateKey(stub, 'ITEMTYPE', itemTypeId);
            this.logger.debug('GET ITEMTYPE by id with KEY: ITEMTYPE ' + itemTypeId);
            let itemType = await stub.getState(keyItemType);
            return Transform.bufferToObject(itemType) as ItemType;
        } catch (err) {
            this.logger.error('getItemTypeById ERROR: Item not found with this id: ' + itemTypeId);
            return new Error('getItemTypeById ERROR: ' + err);
        }
    }

    /* methods GET */
    /* getItemsType(stub: Stub) */
    /* The getItemsType method is called to GET all ItemsType */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    public async getItemsType(stub: Stub) {
        this.logger.info('************* getItems *************');
        try {
            let iterator = await stub.getStateByPartialCompositeKey('ITEMTYPE', []);
            let itemsType = await Transform.iteratorToObjectList(iterator);
            return itemsType;
        } catch (err) {
            this.logger.error('getItemsType ERROR code: ' + err);
            return new Error('getItemsType ERROR: ' + err);
        }
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

        // INIT creates the Gate -1 for the items not assigned 

        let gateItemsNotAssigned = new Gate('-1', '-1', 0, true, new Date());
        try {
            this.logger.info('Init Virtual Gate-> CALL doEditGate');
            await this.doEditGate(stub, gateItemsNotAssigned);
        } catch (err) {
            this.logger.error('INIT - ERROR: Something wrong in doEditGate of gateItemsNotAssigned ' + err);
            throw new Error('INIT - ERROR: Something wrong in doEditGate of gateItemsNotAssigned ' + err);
        }
        // This Gate is a virtual gate (-1) and will be contain the items not assigned at any Gate (connectedBay)
        let gateInit: Gate;
        gateInit = await this.getGateById(stub, '-1');
        this.logger.info('INIT - This Gate is a virtual gate (-1) and contains the items not assigned');
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
            if (params && params[0]) {
                arg = params[0];
            }
            let payload = await method.call(this, stub, arg);

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
            let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
            let gates = await Transform.iteratorToObjectList(iterator);
            let itemsToAssign = Array<Item>();
            let displayDate: Date = new Date();
            let mill = displayDate.getTime();
            mill = mill - 60000;
            // let num = displayDate.setSeconds(displayDate.getSeconds() - 15);

            for (let gate of gates) {
                let exitGate = gate as Gate;
                let gateDate = new Date(exitGate.datetime).getTime();

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
            let gateVirtual = await this.getGateById(stub, '-1');
            let items = new Array<Item>();
            items = await this.getItemsByGate(stub, '-1');
            this.logger.debug('controlItemsNotAssigned - Number of item not assigned: ' + items.length);
            if (items && items.length > 0) {
                for (let item of items) {
                    gateVirtual.items.splice(gateVirtual.items.indexOf(item), 1);
                    this.assignItemToGate(stub, item);
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

        let gateCompatible = new Array<Gate>();
        let gateAvailable = new Array<Gate>();
        let gateMixed = new Array<Gate>();
        let gateSelected: Gate;
        let gateNotAssigned: Gate;
        // let isInitGate: Boolean;

        try {
            let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
            let gates = await Transform.iteratorToObjectList(iterator);

            this.logger.info('######### Number of GATE to scroll to associate the item ########');
            this.logger.debug('assignItemToGate - NUMBER OF GATES  : ' + gates.length);
            this.logger.debug('assignItemToGate - ITEM TO ASSIGN ID: ' + item.id);
            this.logger.debug('assignItemToGate - ITEM TEMTYPE   ID: ' + item.type.id);
            this.logger.info('##################################################################');

            this.OrderByArray(gates, 'id');

            for (let gate of gates) {
                let exitGate = gate as Gate;
                if (exitGate.id != '-1' && exitGate.enable) {
                    this.logger.debug('assignItemToGate - PROCESS GATE ID    : ' + exitGate.id);
                    this.logger.debug('assignItemToGate - GATE IDCONNECTEDBAY: ' + exitGate.idConnectedBay);
                    this.logger.debug('assignItemToGate - GATE LOAD          : ' + exitGate.load);
                    if (exitGate.enable && exitGate.idConnectedBay != null) {
                        if (exitGate.load < 1) {
                            if (exitGate.preference && exitGate.preference.id == item.type.id) {
                                this.logger.debug('assignItemToGate - GATE PREFERENCE: ' + exitGate.preference.id);
                                gateCompatible.push(exitGate);
                            } else {
                                if (typeof exitGate.preference === 'undefined' ||
                                    exitGate.preference == null ||
                                    typeof exitGate.preference.id === 'undefined') {
                                    this.logger.debug('assignItemToGate - GATE WITHOUT PREFERENCE: ' + exitGate.id);
                                    gateAvailable.push(exitGate);
                                } else {
                                    if (exitGate.preference.id == '*') {
                                        this.logger.debug('assignItemToGate - GATE mixed: ' + exitGate.id);
                                        gateMixed.push(exitGate);
                                    } else {
                                        this.logger.debug('assignItemToGate - GATE NOT COMPATIBLE ID: ' + exitGate.id);
                                        this.logger.debug('assignItemToGate - GATE PREFERENCE     ID: ' + exitGate.preference.id);
                                        gateNotAssigned = exitGate;
                                    }
                                }
                            }

                        } else {
                            this.logger.info('assignItemToGate - GATE OVERLOAD ID: ' + exitGate.id);
                            this.logger.info('assignItemToGate - GATE LOAD       : ' + exitGate.load);
                        }
                    } else {
                        this.logger.info('assignItemToGate - GATE NOT READY - ID    : ' + exitGate.id);
                        this.logger.info('assignItemToGate - GATE NOT READY - ENA   : ' + exitGate.enable);
                        this.logger.info('assignItemToGate - GATE NOT READY - BAY   : ' + exitGate.idConnectedBay);
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
            } else if (gateNotAssigned) {
                this.logger.warning('assignItemToGate - GATE NOT FOUND. ITEM NOT ASSIGNED');
                gateSelected = await this.getGateById(stub, '-1');
            }

            gateSelected.items.push(item);
            gateSelected.datetime = new Date();
            this.logger.info('assignItemToGate -> CALL doEditGate');
            await this.doEditGate(stub, gateSelected);
            if (gateSelected.id != '-1') {
                this.logger.debug('assignItemToGate - CREATE EVENT. ITEM ASSIGNED: ' + item.id);
                await this.doCreateEvent(stub, 'assignItemToGate', gateSelected, item);
            }

            //TODO addPreference at next bay (only preference, no item). 
            /* if (isInitGate && gateAvailable[1]) {
                gateSelected = gateAvailable[1];
                gateSelected.preference = item.type;
                await this.doEditGate(stub, gateSelected);
            } */

            this.logger.info('######################## REPORT OK assignItemToGate REPORT OK #######################');
            this.logger.info('assignItemToGate - ID ITEM IN LOOP: ' + item.id + ' GATE DESTINATION ASSIGNED: ' + gateSelected.id);
            this.logger.info('assignItemToGate - Load of BAY connected at the GATE PRE-ASSIGNED: ' + gateSelected.load);
            this.logger.info('############################## END assignItemToGate END #############################');

            return gateSelected.id;
        } catch (err) {
            throw new Error(err);
        }
    }

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
            this.logger.debug('doEditGate - PUT GATE by id with KEY: GATE ' + gate.id);
            this.logger.debug('doEditGate - Items in gate edited: ' + gate.items.length);
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
            let event = new Event(gate.idConnectedBay, gate.id, JSON.stringify(gate.payload), idPreference);
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
        let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
        let gates = await Transform.iteratorToObjectList(iterator);
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

                // TEMPORARY
                let its = Array<Item>();
                its = await this.getItemsByGate(stub, gat.id);
                this.logger.debug('doGrabItem - GATE WITH ITEMS: ' + gat.id);
                this.logger.debug('doGrabItem - NUMBER ITEMS in GATE: ' + its.length);
                for (let itemElem of its) {
                    let item = itemElem as Item;
                    this.logger.debug('heartbeat - ITEMS in GATE: ' + item.id);
                }
                exitGate.items = its;
            }

            this.logger.debug('doGrabItem - Gate with id: ' + exitGate.id);
            this.logger.debug('doGrabItem - Gate with enable: ' + exitGate.enable);
            this.logger.debug('doGrabItem - Gate with idConnectedBay: ' + exitGate.idConnectedBay);
            this.logger.debug('doGrabItem - Gate with exitGate.items.length: ' + exitGate.items.length);

            if (!isFound && exitGate.enable && exitGate.idConnectedBay != null && exitGate.items != null && exitGate.items.length != 0) {

                this.logger.debug('doGrabItem - Gate with id: ' + exitGate.id + ' has items not null: ' + exitGate.items.length);
                for (let itemOfGate of exitGate.items) {
                    this.logger.debug('doGrabItem - Gate with id: ' + exitGate.id + ' contains item with id: ' + itemOfGate.id);
                    if (item.id == itemOfGate.id) {
                        this.logger.debug('doGrabItem - Item with id: ' + item.id + ' found into Gate: ' + exitGate.id);
                        isFound = true;
                        try {
                            /* remove the item from the list items assigned to the Gate exitGate and update the Gate */
                            exitGate.items.splice(exitGate.items.indexOf(itemOfGate), 1);
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
            this.logger.error('doGrabItem - ERROR: item not found in any gate');
            this.logger.error('doGrabItem - ITEM id: ' + item.id);
            throw new Error('doGrabItem - ERROR: ITEM id: ' + item.id + ' not found in any gate');
        }
    }



    /* methods POST */
    /* doGetGateByItem */
    /* The doGetGateByItem method is called to Search the Gate assigned to item*/
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    private async doGetGateByItem(stub: Stub, item: Item) {
        this.logger.info('########### doGetGateByItem id: ' + item.id + ' ###########');
        let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
        let gates = await Transform.iteratorToObjectList(iterator);
        for (let gate of gates) {
            let gat = gate as Gate;
            let exitGate = new Gate(gat.id, gat.idConnectedBay, gat.load, gat.enable, gat.datetime);
            if (gat.preference != null) {
                exitGate.preference = gat.preference;
            }
            if (gat.payload != null) {
                exitGate.payload = gat.payload;
            }
            if (gat.items != null && gat.items != []) {
                exitGate.items = gat.items;
            }

            this.logger.debug('doGetGateByItem - Search into Gate with id: ' + exitGate.id);
            this.logger.debug('doGetGateByItem - Gate with idConnectedBay: ' + exitGate.idConnectedBay);
            this.logger.debug('doGetGateByItem - Gate with exitGate.items.length: ' + exitGate.items.length);

            if (exitGate.enable && exitGate.idConnectedBay != null && exitGate.items != null && exitGate.items.length != 0) {
                let isFound = false;
                this.logger.debug('doGrabItem - Gate with id: ' + exitGate.id + ' has items not null: ' + exitGate.items.length);
                for (let itemOfGate of exitGate.items) {
                    if (item.id == itemOfGate.id) {
                        this.logger.debug('doGrabItem - Item with id: ' + item.id + ' found into Gate: ' + exitGate.id);
                        isFound = true;

                    }
                }
                if (!isFound) {
                    this.logger.error('doGrabItem - ERROR: item not found in any gate');
                    this.logger.error('doGrabItem - ITEM id: ' + item.id);
                    throw new Error('doGrabItem - ERROR: ITEM id: ' + item.id + ' not found in any gate');
                } else {
                    return exitGate;;
                }
            }
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
import shim = require('fabric-shim');
import { ChaincodeInterface, ChaincodeResponse, Stub } from 'fabric-shim';
import { ERRORS } from './constants/errors';
import { ChaincodeError } from './ChaincodeError';
import { StubHelper } from './StubHelper';
import { Transform } from './utils/datatransform';
import { Gate } from './Gate';
import { ItemType } from './ItemType';
import { Item } from './Item';
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
            // TO DO Create version PROD and version DEV (This version not run)
            // await this.controlGates(stub);
            await this.assignItemToGate(stub, item);
        } catch (err) {
            throw new Error('storeItem in assigne function - ERROR with code: ' + err);
        }
        try {
            let keyItem = await this.generateKey(stub, 'ITEM', item.id);
            await stub.putState(keyItem, Buffer.from(JSON.stringify(item)));
        } catch (err) {
            throw new Error('storeItem in putState - ERROR with code: ' + err);
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
            throw new Error(`editGAte - ERROR: NO Gate in Input`);
        }
        try {
            let gate: Gate = JSON.parse(gateStr);
            gate.datetime = new Date();
            await this.doEditGate(stub, gate);
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
            return (Transform.bufferToObject(gate) as Gate).items;
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
        this.logger.info('************* getGateById *************');
        if (gateId == null || gateId == '') {
            this.logger.error('getGateById ERROR: id is empty or null!');
            throw new Error('getGateById ERROR: id is empty or null!');
        }
        try {
            let keyGate: string = await this.generateKey(stub, 'GATE', gateId);
            let gate = await stub.getState(keyGate);
            return Transform.bufferToObject(gate) as Gate;
        } catch (err) {
            this.logger.error('getGateById ERROR: Gate not found with this id: ' + gateId);
            return new Error('getGateById ERROR: ' + err);
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

    public async getItemById(stub: Stub, ItemId: string) {
        this.logger.info('************* getItemById *************');
        if (ItemId == null || ItemId == '') {
            this.logger.error('getItemById ERROR: id is empty or null!');
            throw new Error('getItemById ERROR: id is empty or null!');
        }
        try {
            let keyItem: string = await this.generateKey(stub, 'ITEM', ItemId);
            let item = await stub.getState(keyItem);
            return Transform.bufferToObject(item) as Item;
        } catch (err) {
            this.logger.error('getItemById ERROR: Item not found with this id: ' + ItemId);
            return new Error('getItemById ERROR: ' + err);
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

        /* Init method initializes a List of Bay (allBays) and a List of Type (allTypes)  */
        /* INIT 2 types initial (869990965260, 869990965261) */

        let typeA: ItemType = {
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

        } catch (err) {
            this.logger.error('INIT - ERROR: Something wrong in put State of types ' + err);
            throw new Error('INIT - ERROR: Something wrong in put State of types ' + err);
        }

        /* INIT 10 gates initial (with precerence) */
        // @FIXME Use Loop for repetitive tasks
        let gateZero = new Gate('0', '0', 0, true, 0, new Date());
        gateZero.addPreference(typeA);
        gateZero.addPreference(typeB);

        let gateOne = new Gate('1', '2', 0, true, 5, new Date());
        gateOne.addPreference(typeA);
        gateOne.addPreference(typeB);

        let gateTwo = new Gate('2', '4', 0, true, 10, new Date());
        gateTwo.addPreference(typeA);
        gateTwo.addPreference(typeB);

        let gateThree = new Gate('3', '6', 0, true, 15, new Date());
        gateThree.addPreference(typeA);
        gateThree.addPreference(typeB);

        let gateFor = new Gate('4', '8', 0, true, 20, new Date());
        gateFor.addPreference(typeB);

        let gateFive = new Gate('5', '10', 0, true, 25, new Date());
        gateFive.addPreference(typeA);

        let gateSix = new Gate('6', '12', 0, true, 30, new Date());
        gateSix.addPreference(typeB);

        let gateSeven = new Gate('7', '14', 0, true, 35, new Date());
        gateSeven.addPreference(typeA);

        let gateEight = new Gate('8', '16', 0, true, 40, new Date());
        gateEight.addPreference(typeA);
        gateEight.addPreference(typeB);

        let gateNine = new Gate('9', '18', 0, true, 45, new Date());
        gateNine.addPreference(typeA);
        gateNine.addPreference(typeB);

        try {
            await this.doEditGate(stub, gateZero);
            await this.doEditGate(stub, gateOne);
            await this.doEditGate(stub, gateTwo);
            await this.doEditGate(stub, gateThree);
            await this.doEditGate(stub, gateFor);
            await this.doEditGate(stub, gateFive);
            await this.doEditGate(stub, gateSix);
            await this.doEditGate(stub, gateSeven);
            await this.doEditGate(stub, gateEight);
            await this.doEditGate(stub, gateNine);
        } catch (err) {
            this.logger.error('INIT - ERROR: Something wrong in doEditGate of gate ' + err);
            throw new Error('INIT - ERROR: Something wrong in doEditGate of gate ' + err);
        }

        // In INIT all Items must have state null
        let iterator = await stub.getStateByPartialCompositeKey('ITEM', []);
        let items = await Transform.iteratorToObjectList(iterator);
        if (items != null) {
            for (let itemElem of items) {
                let item = itemElem as Item;
                try {
                    let keyItem = await this.generateKey(stub, 'ITEM', item.id);
                    await stub.putState(keyItem, Buffer.from(JSON.stringify(item)));
                } catch (err) {
                    this.logger.error('INIT - ERROR: Something wrong in put State of gate ' + err);
                    throw new Error('INIT - ERROR: Something wrong in put State of item ' + err);
                }
            }
        }

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
            let payload = await method.call(this, stub, params);

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
        this.logger.info('############################## ATTENTION ##########################');
        this.logger.info('##########  TO DO Insert controlGates in storeItem Method #########');
        this.logger.info('###################################################################');

        try {
            let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
            let gates = await Transform.iteratorToObjectList(iterator);
            let displayDate: Date = new Date();
            let mill = displayDate.getTime();
            mill = mill - 15000;
            // let num = displayDate.setSeconds(displayDate.getSeconds() - 15);

            for (let gate of gates) {
                let exitGate = gate as Gate;
                // this.logger.info('CONTROL Gate with id: ' + gate.id);
                let gateDate = new Date(exitGate.datetime).getTime();
                if (gateDate < mill) {
                    this.logger.info('Gate with id: ' + exitGate.id + ' switched OFF due to inactivity ');

                    if (exitGate.items != null) {
                        for (let item of exitGate.items) {
                            await this.assignItemToGate(stub, item);
                        }
                    }
                    exitGate.enable = false;
                    exitGate.items = [];
                    await this.doEditGate(stub, exitGate);
                }
            }
        } catch (err) {
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
        this.logger.info('########### assignItemToGate ###########');

        let gatesCompatible = Array<Gate>();
        let gatesAvailable = Array<Gate>();
        let gateSelected: Gate;
        try {
            let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
            let gates = await Transform.iteratorToObjectList(iterator);
            for (let gate of gates) {
                let exitGate = gate as Gate;
                if (exitGate.enable && exitGate.idConnectedBay != null) {
                    if (exitGate.load < 1) {
                        let isFound = false;
                        for (let pref of exitGate.preference) {
                            if (pref.id === item.type.id) {
                                gatesCompatible.push(exitGate);
                                isFound = true;
                            }
                        }
                        if (!isFound) {
                            gatesAvailable.push(exitGate);
                        }
                    } else {
                        this.logger.debug('assignItemToGate - GATE OVERLOAD ID: ' + exitGate.id);
                        this.logger.debug('assignItemToGate - GATE LOAD       : ' + exitGate.load);
                    }
                } else {
                    this.logger.debug('assignItemToGate - GATE DISABLED       : ' + exitGate.id);
                }
            }

            if (gatesCompatible.length != 0) {
                if (gatesCompatible.length != 1) {
                    this.OrderByArray(gatesCompatible, 'load');
                }
                gateSelected = gatesCompatible[0];
            } else {
                if (gatesAvailable.length != 0) {
                    if (gatesAvailable.length != 1) {
                        this.OrderByArray(gatesAvailable, 'load');
                    }
                    gateSelected = gatesAvailable[0];
                } else {
                    this.logger.error(`assignItemToGate - ERROR: NO Gates available for Item: ` + item.id);
                    this.logger.error(`assignItemToGate - ITEM TYPE : ` + item.type.id);

                    throw new Error(`assignItemToGate - ERROR: NO Gates available for Item ` + item.id);
                }
            }
            gateSelected.items.push(item);
            gateSelected.datetime = new Date();
            /* Call the method for insert/update the gate into the ledger */
            await this.doEditGate(stub, gateSelected);
            this.logger.info('assignItemToGate - ID ITEM IN LOOP: ' + item.id + ' GATE DESTINATION ASSIGNED: ' + gateSelected.id);
            this.logger.info('assignItemToGate - Load of BAY connected at the GATE PRE-ASSIGNED: ' + gateSelected.load);
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
        this.logger.info('########### insertGateIntoTheLedger : ' + gate.id + ' ###########');

        try {
            let keyGate = await this.generateKey(stub, 'GATE', gate.id);
            await stub.putState(keyGate, Buffer.from(JSON.stringify(gate)));
        } catch (err) {
            this.logger.error('doEditGate - ERROR: Something wrong in put State of gate ' + err);
            this.logger.error('doEditGate - GATE id: ' + gate.id);
            throw new Error('doEditGate - ERROR: Something wrong in put State of bay ' + err);
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
        this.logger.info('########### doGrabItem ###########');
        let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
        let gates = await Transform.iteratorToObjectList(iterator);
        for (let gate of gates) {
            let exitGate = gate as Gate;
            if (exitGate.enable && exitGate.idConnectedBay != null) {
                let isFound = false;
                for (let itemOfGate of exitGate.items) {
                    if (item.id === itemOfGate.id) {
                        isFound = true;
                        try {
                            /* remove the item from the list items assigned to the Gate exitGate and update the Gate */
                            exitGate.removeItem(itemOfGate);
                            await this.doEditGate(stub, exitGate);
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
                if (!isFound) {
                    this.logger.error('doGrabItem - ERROR: item not found in any gate');
                    this.logger.error('doGrabItem - ITEM id: ' + item.id);
                    throw new Error('doGrabItem - ERROR: ITEM id: ' + item.id + ' not found in any gate');
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
        // this.logger.info('########### generateKey for ' + id + ' of TYPE ' + type + ' ######');
        return stub.createCompositeKey(type, [id]);
    }
    /*
        private async createEvent(stub: Stub, gate: Gate) {
            this.logger.info('########### createEvent ###########');
            let items = Array<Item>();
            items = await this.getItemsByGate(stub, gate.id);
    
            let itemsReduced = Array<any>();
            for (let item of items) {
                const itm = {
                    id: item.id,
                    type: item.type.id
                };
                itemsReduced.push(itm);
            };
    
            let preferencesReduced = Array<any>();
            for (let pref of gate.preference) {
                const prf = {
                    id: pref.id
                };
                preferencesReduced.push(prf);
            };
    
            // let carico = (bay.load / bay.capacity) * 100;
            let carico = gate.load * 100;
            let ena = '';
            if (gate.enable) {
                ena = 'ON';
            } else {
                ena = 'OFF';
            }
    
            let event = {
                id: gate.id,
                type: gate.typeObject,
                preferences: JSON.stringify(preferencesReduced),
                loadFactor: carico + '',
                items: JSON.stringify(itemsReduced),
                enable: ena
            };
    
            this.logger.debug('createEvent - ' + event.items);
            this.logger.debug('createEvent - EVENT SEND: ' + JSON.stringify(event));
            return event;
        }
    */
    //    private sleepFor(sleepDuration: number) {
    //        var now = new Date().getTime();
    //        while (new Date().getTime() < now + sleepDuration) { /* do nothing */ }
    //    }
}
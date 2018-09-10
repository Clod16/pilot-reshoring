import shim = require('fabric-shim');
import { ChaincodeInterface, ChaincodeReponse, Stub } from 'fabric-shim';
import { ERRORS } from './constants/errors';
import { ChaincodeError } from './ChaincodeError';
import { StubHelper } from './StubHelper';
import { Transform } from './utils/datatransform';
import { ConveyorBay } from './ConveyorBay';
import { ConveyorItemType } from '.';
import { ConveyorItem } from './ConveyorItem';
import { EventPayload } from './EventPayload';

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
    /* A exit Bay will be assigned to new Item */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async storeItem(stub: Stub, itemStr: string) {
        this.logger.info('************* storeItem *************');
        if (!itemStr) {
            throw new Error(`storeItem - ERROR: NO Item in Input`);
        }
        try {
            const item: ConveyorItem = JSON.parse(itemStr);
            /* Control all bays on - off */
            // await this.controlBays(stub);
            await this.assignBayToItem(stub, item);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* editBay(stub: Stub, bay: string) */
    /* The editeConveyorBay method is called to update a Bay */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async editBay(stub: Stub, bay: string) {
        this.logger.info('************* editBay *************');
        if (!bay) {
            throw new Error(`editBay - ERROR: NO Bay in Input`);
        }
        try {
            let bayIn: ConveyorBay = JSON.parse(bay);
            await this.doEditConveyorBay(stub, bayIn);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* insertItemIntoBay(stub: Stub, itemStr: string) */
    /* The insertItemIntoBay method is called to update a Bay and update the items in the Conveyor Belt */
    /* When the Bay "captures" a Item from the Conveyor Belt, it is removed from the Map (state inBay)  */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async insertItemIntoBay(stub: Stub, itemStr: string) {
        this.logger.info('************* insertItemIntoBay *************');
        if (!itemStr) {
            throw new Error('insertItemIntoBay - ERROR No input Item');
        }
        try {

            await this.doConveyorItemAssignTo(stub, JSON.parse(itemStr), ConveyorItem.State.inBay);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods POST */
    /* removeItemFromBay(stub: Stub, itemStr: string) */
    /* The removeItemFromBay method is called to update a Bay and update the items in the Conveyor Belt */
    /* When the Bay release a Item, it is removed from the Bay and the state is Released */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async removeItemFromBay(stub: Stub, itemStr: string) {
        this.logger.info('************* removeItemFromBay *************');
        if (!itemStr) {
            throw new Error('removeItemFromBay - ERROR No  input Item');
        }
        try {
            await this.doConveyorItemAssignTo(stub, JSON.parse(itemStr), ConveyorItem.State.inWharehouse);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods GET */
    /* getItemsByExitBay(stub: Stub, bayId: string) */
    /* The getItemsByExitBay method is called to GET a subset of "Map" with all items INTO CONVEYOR LOOP assigned at this Bay */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async getItemsByExitBay(stub: Stub, bayId: string) {
        this.logger.info('************* getItemsByExitBay *************');
        if (bayId == null || bayId == '') {
            throw new Error('getItemsByExitBay - ERROR No  input Bay');
        }
        try {
            return this.doGetItemsByBayByState(stub, bayId, ConveyorItem.State.inConveyorGate);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods GET */
    /* getItemsIntoBay(stub: Stub, bayId: string) */
    /* The getItemsIntoBay method is called to GET a subset of "Map" with all items INTO this Bay */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    public async getItemsIntoBay(stub: Stub, bayId: string) {
        this.logger.info('************* getItemsIntoBay *************');
        if (bayId == null || bayId == '') {
            throw new Error('getItemsIntoBay - ERROR No  input Bay');
        }
        try {
            return this.doGetItemsByBayByState(stub, bayId, ConveyorItem.State.inBay);
        } catch (err) {
            throw new Error(err);
        }
    }

    /* methods GET */
    /* getBays(stub: Stub) */
    /* The getBays method is called to GET all Bays */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    public async getBays(stub: Stub) {
        this.logger.info('************* getBays *************');
        try {
            let iterator = await stub.getStateByPartialCompositeKey('BAY', []);
            let bays = await Transform.iteratorToObjectList(iterator);
            return bays;
        } catch (err) {
            throw new Error(err);
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

    public async getItemById(stub: Stub, id: string) {
        this.logger.info('************* getItemById *************');
        if (id == null || id == '') {
            this.logger.error('getItemById ERROR: id is empty or null!');
            throw new Error('getItemById ERROR: id is empty or null!');
        }
        try {
            let keyItem: string = await this.generateKey(stub, 'ITEM', id);
            let item = await stub.getState(keyItem);
            return Transform.bufferToObject(item) as ConveyorItem;
        } catch (e) {
            this.logger.error(
                'getItemById ERROR: Item not found with this id: ' + id
            );
            return new Error(e);
        }
    }

    /* methods GET */
    /* getItemsByDescription(stub: Stub, desc: string) */
    /* The getItemsByDescription method is called to GET items with this description */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    public async getItemsByDescription(stub: Stub, desc: string) {
        let arrayItem = Array<ConveyorItem>();
        this.logger.info('************* getItemsByDescription *************');
        if (desc == null || desc == "") {
            this.logger.error('getItemsByDescription ERROR: desc is empty or null!');
            return new Error('getItemsByDescription ERROR: desc is empty or null!');
        }
        try {
            let iterator = await stub.getStateByPartialCompositeKey("ITEM", []);
            let items = await Transform.iteratorToObjectList(iterator);
            for (let item of items) {
                let conveyorItem = item as ConveyorItem;
                if (conveyorItem.type.description == desc) {
                    arrayItem.push(conveyorItem);
                }

            }
            return arrayItem;
        } catch (e) {
            this.logger.error('getItemsByDescription ERROR: Item not found with this desc: ' + desc);
            return new Error(e);
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
     * @returns {Promise<ChaincodeReponse>}
     * @memberof CollaborativeSorting
     */
    async Init(stub: Stub): Promise<ChaincodeReponse> {
        this.logger.info(`=========== Instantiated ${this.name} CollaborativeSorting ===========`);
        this.logger.info(`Transaction ID: ${stub.getTxID()}`);
        this.logger.info(`Args: ${stub.getArgs().join(',')}`);
        let args = stub.getArgs();

        /* Init method initializes a List of Bay (allBays) and a List of Type (allTypes)  */
        /* INIT 2 types initial (869990965260, 869990965261) */

        let typeA = new ConveyorItemType('869990965260', '');
        let typeB = new ConveyorItemType('869990965261', '');

        try {
            await stub.putState(typeA.id, Buffer.from(JSON.stringify(typeA)));
            await stub.putState(typeB.id, Buffer.from(JSON.stringify(typeB)));

        } catch (e) {
            this.logger.error(`INIT - ERROR: Something wrong in put State of types ` + e);
            throw new Error('INIT - ERROR: Something wrong in put State of types' + e);
        }

        /* INIT 10 bays initial (with precerence) */
        // @FIXME Use Loop for repetitive tasks


        let bayZero = new ConveyorBay('0', 8, 0, 0, true, 10, new Date());
        bayZero.addPreference(typeA);
        bayZero.addPreference(typeB);
        
        let bayOne = new ConveyorBay('1', 8, 0, 0, true, 1, new Date());
        bayOne.addPreference(typeA);
        bayOne.addPreference(typeB);

        let bayTwo = new ConveyorBay('2', 8, 0, 0, true, 2, new Date());
        bayTwo.addPreference(typeA);
        bayTwo.addPreference(typeB);

        let bayThree = new ConveyorBay('3', 8, 0, 0, true, 3, new Date());
        bayThree.addPreference(typeA);
        bayThree.addPreference(typeB);

        let bayFor = new ConveyorBay('4', 8, 0, 0, true, 4, new Date());
        bayFor.addPreference(typeB);

        let bayFive = new ConveyorBay('5', 8, 0, 0, true, 5, new Date());
        bayFive.addPreference(typeA);

        let baySix = new ConveyorBay('6', 8, 0, 0, true, 6, new Date());
        baySix.addPreference(typeB);

        let baySeven = new ConveyorBay('7', 8, 0, 0, true, 7, new Date());
        baySeven.addPreference(typeA);

        let bayEight = new ConveyorBay('8', 8, 0, 0, true, 8, new Date());
        bayEight.addPreference(typeA);
        bayEight.addPreference(typeB);

        let bayNine = new ConveyorBay('9', 8, 0, 0, true, 9, new Date());
        bayNine.addPreference(typeA);
        bayNine.addPreference(typeB);

        try {
            await this.doEditConveyorBay(stub, bayZero);
            await this.doEditConveyorBay(stub, bayOne);
            await this.doEditConveyorBay(stub, bayTwo);
            await this.doEditConveyorBay(stub, bayThree);
            await this.doEditConveyorBay(stub, bayFor);
            await this.doEditConveyorBay(stub, bayFive);
            await this.doEditConveyorBay(stub, baySix);
            await this.doEditConveyorBay(stub, baySeven);
            await this.doEditConveyorBay(stub, bayEight);
            await this.doEditConveyorBay(stub, bayNine);
        } catch (e) {
            this.logger.error(`INIT - ERROR: Something wrong in addPreference of bay ` + e);
            throw new Error('INIT - ERROR: Something wrong in addPreference of bay ' + e);
        }


        // In INIT all Items must have state null
        let iterator = await stub.getStateByPartialCompositeKey('ITEM', []);
        let items = await Transform.iteratorToObjectList(iterator);
        if (items != null) {
            for (let itemElem of items) {
                let item = itemElem as ConveyorItem;
                item.state = null;
                try {
                    let keyItem = await this.generateKey(stub, 'ITEM', item.id);
                    await stub.putState(keyItem, Buffer.from(JSON.stringify(item)));
                } catch (e) {
                    throw new Error('INIT - ERROR: Something wrong in put State of item ' + e);
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
     * @returns {Promise<ChaincodeReponse>}
     * @memberof CollaborativeSorting
     */
    async Invoke(stub: Stub): Promise<ChaincodeReponse> {

        this.logger.info(`=========== Invoked CollaborativeSorting ${this.name} ===========`);
        this.logger.info(`Transaction ID: ${stub.getTxID()}`);
        this.logger.info(`Args: ${stub.getArgs().join(',')}`);

        let ret = stub.getFunctionAndParameters();
        let fcn = ret.fcn;
        let args = ret.params;

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
    /* controlBays() */
    /* The controlBays method is called to extract and control all bays  */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    private async controlBays(stub: Stub) {
        this.logger.info('################ ATTENTION #########################');
        this.logger.info('########### controlBays  NOT IN FUNCTION ###########');
        this.logger.info('####################################################');

        try {
            let iterator = await stub.getStateByPartialCompositeKey('BAY', []);
            let bays = await Transform.iteratorToObjectList(iterator);
            let displayDate: Date = new Date();
            let mill = displayDate.getTime();
            mill = mill - 15000;
            // let num = displayDate.setSeconds(displayDate.getSeconds() - 15);

            for (let bay of bays) {
                let baia = bay as ConveyorBay;
                // this.logger.info('CONTROL ConveyorBay with id: ' + baia.id);
                let bayDate = new Date(baia.datetime).getTime();
                if (bayDate < mill) {
                    this.logger.info('ConveyorBay with id: ' + baia.id + ' switched OFF due to inactivity ');
                    baia.enable = false;
                    await this.doEditConveyorBay(stub, baia);

                    let items = new Array<ConveyorItem>();
                    items = await this.doGetItemsByBayByState(stub, baia.id, ConveyorItem.State.inConveyorLoop);
                    for (let item of items) {
                        await this.assignBayToItem(stub, item);
                    }
                }
            }
        } catch (err) {
            throw new Error(err);
        }

    }

  
    /* methods POST */
    /* assignBayToItem */
    /* The assignBayToItem method is called to assign a exit bay to item in parameter */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    private async assignBayToItem(stub: Stub, item: ConveyorItem) {
        this.logger.info('########### assignBayToItem ###########');
        try {
            let iterator = await stub.getStateByPartialCompositeKey('BAY', []);
            let bays = await Transform.iteratorToObjectList(iterator);
            let baysCompatible = Array<ConveyorBay>();
            let baysAvailable = Array<ConveyorBay>();

            for (let bay of bays) {
                let baia = bay as ConveyorBay;
                if (baia.enable) {
                    if (baia.capacity > baia.load) {
                        let isFound = false;
                        for (let pref of baia.preference) {
                            if (pref.id === item.type.id) {
                                baysCompatible.push(baia);
                                isFound = true;
                            }
                        }
                        if (!isFound) {
                            baysAvailable.push(baia);
                        }
                    } else {
                        this.logger.debug('assignBayToItem - BAY OVERLOAD ID: ' + baia.id);
                        this.logger.debug('assignBayToItem - BAY CAPACITY : ' + baia.capacity);
                        this.logger.debug('assignBayToItem - BAY LOAD     : ' + baia.load);
                    }
                }
            }

            let baySelected: ConveyorBay;
            if (baysCompatible.length != 0) {
                if (baysCompatible.length != 1) {
                    this.OrderByArray(baysCompatible, 'load');
                }
                baySelected = baysCompatible[0];
            } else {
                if (baysAvailable.length != 0) {
                    if (baysAvailable.length != 1) {
                        this.OrderByArray(baysAvailable, 'load');
                    }

                    baySelected = baysAvailable[0];
                } else {
                    this.logger.error(`assignBayToItem - ERROR: NO Bays available for Item: ` + item.id);
                    this.logger.error(`assignBayToItem - ITEM TYPE : ` + item.type.id);
                    this.logger.error(`assignBayToItem - ITEM STATE: ` + item.state);

                    throw new Error(`assignBayToItem - ERROR: NO Bays available for Item ` + item.id);
                    // In this case assign state suspended at the item.state and item.conveyorBay = vrtualBay
                }
            }

            item.conveyorBay = baySelected;
            this.logger.info('assignBayToItem - ITEM IN BELT: ' + item.id + ' BAY DESTINATION ASSIGNED: ' + item.conveyorBay.id);
            this.logger.info('assignBayToItem - BAY ASSIGNED with LOAD: ' + item.conveyorBay.load);
            return await this.doConveyorItemAssignTo(stub, item, ConveyorItem.State.inConveyorLoop);
        } catch (err) {
            throw new Error(err);
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

    private async doEditConveyorBay(stub: Stub, bay: ConveyorBay) {
        this.logger.info('########### doEditConveyorBay ###########');
        if (bay == null) {
            throw new Error(`doEditConveyorBay - ERROR: NO Bay in Input`);
        }
        try {
            this.logger.info('doEditConveyorBay - BAY UPDATED with ID:   ' + bay.id);
            this.logger.info('doEditConveyorBay - BAY UPDATED with LOAD: ' + bay.load);
            bay.datetime = new Date();
            let keyBay = await this.generateKey(stub, 'BAY', bay.id);
            return await stub.putState(keyBay, Buffer.from(JSON.stringify(bay)));

        } catch (e) {
            this.logger.error(`doEditConveyorBay - ERROR: Something wrong in put State of bay ` + e);
            this.logger.error(`doEditConveyorBay - BAY id: ${bay.id}`);
            throw new Error('doEditConveyorBay - ERROR: Something wrong in put State of bay ' + e);
        }
    }


    private async doConveyorItemAssignTo(stub: Stub, item: ConveyorItem, state: ConveyorItem.State) {
        this.logger.info('########### doConveyorItemAssignTo : ' + state + ' ' + item.id + ' ###########');

        // bay.load = number of item with state 'in bay' into this bay
        // bay.assign = number of item with state 'inConveyorLoop' with this assigned bay
        this.logger.info('doConveyorItemAssignTo - ITEM IN STATE: ' + item.state + ' PRE UPDATE OF STATE');

        switch (state) {
            // When item will arrive, the first state is inConveyorLegacy 
            case ConveyorItem.State.inConveyorLegacy: {
                if (item.state != null) {
                    this.logger.warn('doConveyorItemAssignTo - ITEM IN STATE NOT NULL : ' + item.state);
                }
                item.state = ConveyorItem.State.inConveyorLegacy;
                this.logger.info('doConveyorItemAssignTo - ITEM IN CONVEYOR LEGACY: ' + item.id);
                break;
            }
            // When item is in first position of ConveyorLegacy, the item state will be readiIN 
            case ConveyorItem.State.readyIN: {
                if (item.state != ConveyorItem.State.inConveyorLegacy) {
                    this.logger.warn('doConveyorItemAssignTo - ITEM IN STATE NOT inConveyorLegacy : ' + item.state);
                }
                item.state = ConveyorItem.State.readyIN;
                this.logger.info('doConveyorItemAssignTo - ITEM IS READY IN: ' + item.id);
                break;
            }

            // When item go into Conveyor Loop, the item state will be inConveyorLoop 
            case ConveyorItem.State.inConveyorLoop: {
                if (item.state != ConveyorItem.State.readyIN) {
                    this.logger.warn('doConveyorItemAssignTo - ITEM IN STATE NOT readiIN : ' + item.state);
                }
                item.conveyorBay.assign++;
                item.state = ConveyorItem.State.inConveyorLoop;
                this.logger.info('doConveyorItemAssignTo - ITEM IN BELT: ' + item.id + ' BAY DESTINATION ASSIGNED: ' + item.conveyorBay.id);
                this.logger.info('doConveyorItemAssignTo - BAY with ASSIGN(++): ' + item.conveyorBay.assign);
                break;
            }
            // When item is on Exit Gate, ready to go into bay assigned, the state will be inConveyorGate
            case ConveyorItem.State.inConveyorGate: {
                if (item.state != ConveyorItem.State.inConveyorLoop) {
                    this.logger.warn('doConveyorItemAssignTo - ITEM IN STATE NOT IN CONVEYOR LOOP : ' + item.state);
                }
                item.state = ConveyorItem.State.inConveyorGate;
                this.logger.info('doConveyorItemAssignTo - ITEM IN CONVEYOR GATE: ' + item.id + ' in STATE : ' + item.state);
                this.logger.info('doConveyorItemAssignTo - BAY:   ' + item.conveyorBay.id + ' with LOAD: ' + item.conveyorBay.load);
                break;
            }
            // When item go into Bay assigned, the state will be inBay and load++, assigned--
            case ConveyorItem.State.inBay: {
                if (item.state != ConveyorItem.State.inConveyorGate) {
                    this.logger.warn('doConveyorItemAssignTo - ITEM IN STATE NOT IN EXIT GATE : ' + item.state);
                }
                item.conveyorBay.load++;
                item.conveyorBay.assign--;
                item.state = ConveyorItem.State.inBay;
                this.logger.info('doConveyorItemAssignTo - ITEM IN BAY: ' + item.id + ' in STATE : ' + item.state);
                this.logger.info('doConveyorItemAssignTo - BAY:   ' + item.conveyorBay.id + ' with LOAD: ' + item.conveyorBay.load);
                break;
            }
            // When the item arrive at the last position of bay belt, the state will be Ready OUT
            case ConveyorItem.State.readyOUT: {
                if (item.state != ConveyorItem.State.inBay) {
                    this.logger.warn('doConveyorItemAssignTo - ITEM IN STATE NOT INBAY : ' + item.state);
                }
                item.state = ConveyorItem.State.readyOUT;
                this.logger.info('doConveyorItemAssignTo - ITEM Ready to go OUT: ' + item.id + ' in STATE : ' + item.state);
                this.logger.info('doConveyorItemAssignTo - From the BAY:   ' + item.conveyorBay.id + ' with LOAD: ' + item.conveyorBay.load);
                break;
            }
            // When the item go out from the bay, the state will be in Wharehouse
            case ConveyorItem.State.inWharehouse: {
                if (item.state != ConveyorItem.State.readyOUT) {
                    this.logger.warn('doConveyorItemAssignTo - ITEM IN STATE NOT Ready OUT : ' + item.state);
                }
                item.conveyorBay.load--;
                item.state = ConveyorItem.State.inWharehouse;
                this.logger.info('doConveyorItemAssignTo - ITEM go into WHAREHOUSE: ' + item.id + ' in STATE : ' + item.state);
                this.logger.info('doConveyorItemAssignTo - BAY REMOVED: ' + item.conveyorBay.id + ' with LOAD(--): ' + item.conveyorBay.load);
                break;
            }
            default: {
                this.logger.info('doConveyorItemAssignTo - NEW STATE OF ITEM IS NOT MAPPED: ' + state);
            }
        }

        this.logger.info('doConveyorItemAssignTo - ITEM: ' + item.id + ' in STATE : ' + item.state);

        try {
            let keyItem = await this.generateKey(stub, 'ITEM', item.id);
            await stub.putState(keyItem, Buffer.from(JSON.stringify(item)));
        } catch (e) {
            this.logger.error(`doConveyorItemAssignTo - ERROR: Something wrong in put State of item ` + e);
            throw new Error('doConveyorItemAssignTo - ERROR: Something wrong in put State of item ' + e);
        }

        try {
            let bay = item.conveyorBay;
            bay.datetime = new Date();
            let keyBaia = await this.generateKey(stub, 'BAY', bay.id);
            await stub.putState(keyBaia, Buffer.from(JSON.stringify(bay)));

        } catch (e) {
            this.logger.error(`doConveyorItemAssignTo - ERROR: Something wrong in put State of bay ` + e);
            throw new Error('doConveyorItemAssignTo - ERROR: Something wrong in put State of bay' + e);
        }

        //@FIXME await this.controlBays(stub);
        if (state == ConveyorItem.State.inConveyorLoop || state == ConveyorItem.State.inBay) {
            // NEW EVENT EVENT === Conveyor Belt Situation IN(inConveyorLoop) & OUT(inBay)
            const event: EventPayload = await this.createEvent(stub, item.conveyorBay);
            stub.setEvent('EVENT', Buffer.from(JSON.stringify(event)));
        }
    }


    private async  generateKey(stub: Stub, type: string, id: string) {
        // this.logger.info('########### generateKey for ' + id + ' of TYPE ' + type + ' ######');
        return stub.createCompositeKey(type, [id]);
    }


    private async doGetItemsByBayByState(stub: Stub, bayId: string, state: ConveyorItem.State) {
        this.logger.info('########### doGetItemsByBayByState: ' + bayId + ' ' + state + ' ###########');

        let itemsAssigned = Array<ConveyorItem>();
        let iterator = await stub.getStateByPartialCompositeKey('ITEM', []);
        let items = await Transform.iteratorToObjectList(iterator);

        for (let item of items) {
            let elemItem = item as ConveyorItem;
            if (elemItem.conveyorBay.id == bayId && elemItem.state == state) {
                itemsAssigned.push(elemItem);
            }
        }

        return itemsAssigned;
    }

    private async createEvent(stub: Stub, bay: ConveyorBay) {
        this.logger.info('########### createEvent ###########');
        let items = Array<ConveyorItem>();
        items = await this.doGetItemsByBayByState(stub, bay.id, ConveyorItem.State.inConveyorLoop);

        let itemsReduced = Array<any>();
        for (let item of items) {
            const itm = {
                id: item.id,
                type: item.type.id
            };
            itemsReduced.push(itm);
        };

        let preferencesReduced = Array<any>();
        for (let pref of bay.preference) {
            const prf = {
                id: pref.id
            };
            preferencesReduced.push(prf);
        };

        // let carico = (bay.load / bay.capacity) * 100;
        let carico = (itemsReduced.length / bay.capacity) * 100;
        let ena = '';
        if (bay.enable) {
            ena = 'ON';
        } else {
            ena = 'OFF';
        }

        let event = {
            id: bay.id,
            type: bay.typeObject,
            preferences: JSON.stringify(preferencesReduced),
            loadFactor: carico + '',
            items: JSON.stringify(itemsReduced),
            enable: ena
        };

        this.logger.debug('createEvent - ' + event.items);
        this.logger.debug('createEvent - EVENT SEND: ' + JSON.stringify(event));
        return event;
    }

    sleepFor(sleepDuration: number) {
        var now = new Date().getTime();
        while (new Date().getTime() < now + sleepDuration) { /* do nothing */ }
    }
}
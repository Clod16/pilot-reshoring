import { Stub } from 'fabric-shim';
import { Gate } from './Gate';
import { LedgerDao } from './LedgerDao';
import { Transform } from './utils/datatransform';
import { Item } from './Item';
import { ItemType } from './ItemType';

export class LedgerDaoLevel implements LedgerDao {
    public logger: any;
    constructor(logger: any) {
        this.logger = logger;
    }

    /* methods GET */
    /* getGateById(stub: Stub, stub: Stub, gateId: string) */
    /* The getGateById method is called to GET a Gate by the Key gateId */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    async getGateById(stub: Stub, gateId: string) {
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

    async getGates(stub: Stub) {
        this.logger.info('************* getGates *************');
        try {
            let iterator = await stub.getStateByPartialCompositeKey('GATE', []);
            let gates = await Transform.iteratorToObjectList(iterator) as Gate[];
            return gates;
        } catch (err) {
            this.logger.error('getGates ERROR code: ' + err);
            throw new Error('getGates ERROR: ' + err);
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

    async getItems(stub: Stub) {
        this.logger.info('************* getItems *************');
        try {
            let iterator = await stub.getStateByPartialCompositeKey('ITEM', []);
            let items = await Transform.iteratorToObjectList(iterator) as Item[];
            return items;
        } catch (err) {
            this.logger.error('getItems ERROR code: ' + err);
            throw new Error('getItems ERROR: ' + err);
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

    async getItemById(stub: Stub, itemId: string) {
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

    async getItemTypeById(stub: Stub, itemTypeId: string) {
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
            throw new Error('getItemTypeById ERROR: item not found!');
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

    async getItemsType(stub: Stub) {
        this.logger.info('************* getItemsType *************');
        try {
            let iterator = await stub.getStateByPartialCompositeKey('ITEMTYPE', []);
            let itemsType = await Transform.iteratorToObjectList(iterator) as ItemType[];
            return itemsType;
        } catch (err) {
            this.logger.error('getItemsType ERROR code: ' + err);
            throw new Error('getItemsType ERROR: item not found!');
        }
    }




    private async  generateKey(stub: Stub, type: string, id: string) {
        return stub.createCompositeKey(type, [id]);
        // return type + ' ' + id;
    }
} 
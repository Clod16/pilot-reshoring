import { Stub } from 'fabric-shim';
import { LedgerDao } from './LedgerDao';
import { LedgerQueries } from './LedgerQueries';
import { Transform } from './utils/datatransform';

export class LedgerDaoCouch implements LedgerDao {
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
            this.logger.error('getGateByIdCouch ERROR: id is empty or null!');
            throw new Error('getGateByIdCouch ERROR: id is empty or null!');
        }
        try {
            let queryIterator = await stub.getQueryResult(LedgerQueries.queryGateByIdObj(gateId));
            let queryList = await Transform.iteratorToList(queryIterator);
            this.logger.info('getGateByIdCouch QUERY RESULT LENGTH: ' + queryList.length);
            this.logger.info('getGateByIdCouch QUERY RESULT       : ' + JSON.stringify(queryList));
            return queryList[0];

        } catch (err) {
            this.logger.error('getGateByIdCouch ERROR: Gate not found with this id: ' + gateId);
            throw new Error('getGateByIdCouch ERROR: ' + err);
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
        this.logger.info('************* getGatesCouch *************');
        try {

            let queryIterator = await stub.getQueryResult(LedgerQueries.queryGatesObj());
            let queryList = await Transform.iteratorToList(queryIterator);
            return queryList;
        } catch (err) {
            this.logger.error('getGatesCouch ERROR code: ' + err);
            throw new Error('getGatesCouch ERROR: ' + err);
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
        this.logger.info('************* getItemsCouch *************');
        try {
            let queryIterator = await stub.getQueryResult(LedgerQueries.queryItemsObj());
            let queryList = await Transform.iteratorToList(queryIterator);
            return queryList;
        } catch (err) {
            this.logger.error('getItemsCouch ERROR code: ' + err);
            throw new Error('getItemsCouch ERROR: ' + err);
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
        this.logger.info('************* getItemByIdCouch: ' + itemId + '  *************');
        if (itemId == null || itemId == '') {
            this.logger.error('getItemByIdCouch ERROR: id is empty or null!');
            throw new Error('getItemByIdCouch ERROR: id is empty or null!');
        }
        try {
            let queryIterator = await stub.getQueryResult(LedgerQueries.queryItemByIdObj(itemId));
            let queryList = await Transform.iteratorToList(queryIterator);
            return queryList[0];
        } catch (err) {
            this.logger.warn('getItemByIdCouch WARNING: Item not found with this id: ' + itemId);
            throw new Error('getItemByIdCouch ERROR: item not found!');
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
        this.logger.info('************* getItemTypeByIdCouch: ' + itemTypeId + '  *************');
        if (itemTypeId == null || itemTypeId == '') {
            this.logger.error('getItemTypeByIdCouch ERROR: id is empty or null!');
            throw new Error('getItemTypeByIdCouch ERROR: id is empty or null!');
        }
        try {
            let queryIterator = await stub.getQueryResult(LedgerQueries.queryItemTypeByIdObj(itemTypeId));
            let queryList = await Transform.iteratorToList(queryIterator);
            return queryList[0];
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
        this.logger.info('************* getItemsTypeCouch *************');
        try {
            let queryIterator = await stub.getQueryResult(LedgerQueries.queryItemsTypeObj());
            let queryList = await Transform.iteratorToList(queryIterator);
            return queryList;
        } catch (err) {
            this.logger.error('getItemsTypeCouch ERROR code: ' + err);
            throw new Error('getItemsTypeCouch ERROR: item not found!');
        }
    }
} 
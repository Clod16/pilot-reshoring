import { Stub } from 'fabric-shim';
import { Gate } from './Gate';
import { Item } from './Item';
import { ItemType } from './ItemType';


export interface LedgerDao {

    /* methods GET */
    /* getGateById(stub: Stub, stub: Stub, gateId: string) */
    /* The getGateById method is called to GET a Gate by the Key gateId */
    /**
     * Handle custom method execution
     *
     * @param stub
     */
    getGateById(stub: Stub, gateId: string): Promise<Gate>;


    /* methods GET */
    /* getGates(stub: Stub) */
    /* The getGates method is called to GET all Gates */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    getGates(stub: Stub): Promise<Gate[]>;

    /* methods GET */
    /* getItems(stub: Stub) */
    /* The getItems method is called to GET all Items */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    getItems(stub: Stub): Promise<Item[]>;


    /* methods GET */
    /* getItemById(stub: Stub, id: string) */
    /* The getItemById method is called to GET the item with this id */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    getItemById(stub: Stub, itemId: string): Promise<Item>;


    /* methods GET */
    /* getItemTypeById(stub: Stub, id: string) */
    /* The getItemTypeById method is called to GET the itemType with this id */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    getItemTypeById(stub: Stub, itemTypeId: string): Promise<ItemType>;


    /* methods GET */
    /* getItemsType(stub: Stub) */
    /* The getItemsType method is called to GET all ItemsType */
    /**
     * Handle custom method execution
     *
     * @param stub
     */

    getItemsType(stub: Stub): Promise<ItemType[]>;

}
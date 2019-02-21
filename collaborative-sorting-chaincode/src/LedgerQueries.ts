export class LedgerQueries {

    /* Object QUERY */
    /* queryGateByIdObj(stub: Stub) */
    /* The queryGateByIdObj query extracts 1 GATE by gateId */
    public static queryGateByIdObj(id: string): string {
        const queryGateByIdObj = {
            selector: {
                typeObject: 'GATE',
                id: id
            }
        };
        return JSON.stringify(queryGateByIdObj);
    };

    /* Object QUERY */
    /* queryGatesObj() */
    /* The queryGatesObj query extracts ALL GATES */

    public static queryGatesObj(): string {
        const queryGatesObj = {
            selector: {
                typeObject: 'GATE'
            }
        };
        return JSON.stringify(queryGatesObj);
    };

    /* Object QUERY */
    /* queryItemsObj() */
    /* The queryItemsObj query extracts ALL ITEMS */
    public static queryItemsObj(): string {
        const queryItemsObj = {
            selector: {
                typeObject: 'ITEM'
            }
        };
        return JSON.stringify(queryItemsObj);
    };

    /* Object QUERY */
    /* queryItemsTypeObj() */
    /* The queryItemsTypeObj query extracts ALL ITEMSTYPE */
    public static queryItemsTypeObj(): string {
        const queryItemsTypeObj = {
            selector: {
                typeObject: 'ITEMTYPE'
            }
        };
        return JSON.stringify(queryItemsTypeObj);
    };

    /* Object QUERY */
    /* queryItemByIdObj(stub: Stub) */
    /* The queryItemByIdObj query extracts 1 ITEM by itemId */
    public static queryItemByIdObj(id: string): string {
        const queryItemByIdObj = {
            selector: {
                typeObject: 'ITEM',
                id: id
            }
        };
        return JSON.stringify(queryItemByIdObj);
    };

    /* Object QUERY */
    /* queryItemTypeByIdObj(stub: Stub) */
    /* The queryItemTypeByIdObj query extracts 1 ITEMTYPE by itemTypeId */   
    public static queryItemTypeByIdObj(id: string): string {
        const queryItemTypeByIdObj = {
            selector: {
                typeObject: 'ITEMTYPE',
                id: id
            }
        };
        return JSON.stringify(queryItemTypeByIdObj);
    };
}
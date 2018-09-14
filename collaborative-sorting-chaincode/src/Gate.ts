import { ItemType } from './ItemType';
import { Item } from './Item';

export class Gate {
    public typeObject       : string;       /* GATE */
    public id               : string;       /* 0 - 29 */
    public idConnectedBay   : string;       /* null --> no bay connected - Gate OFF */ 
    public load             : number;       /* 0 -> Empty - 1 -> Full */
    public preference       : Array<ItemType>;
    public enable           : boolean;      
    public position         : number;
    public items            : Array<Item>;  /* Items in ConveyorLoop assigned at this Gate*/
    public datetime         : Date;

    constructor(id: string, idConnectedBay:string, load:number, enable:boolean, position:number, datetime:Date) {
        this.typeObject     = 'BAY';
        this.id             = id;
        this.idConnectedBay = idConnectedBay;
        this.load           = load;
        this.preference     = new Array<ItemType>();
        this.enable         = enable;
        this.position       = position;
        this.datetime       = datetime;
    }

    addPreference(itemType:ItemType) {
        this.preference.push(itemType); 
    }

    addItem(item:Item) {
        this.items.push(item); 
    }
    removeItem(item:Item) {
        for (let i = 0; i < this.items.length; i++){
            if (this.items[i] === item) { 
                this.items.splice(i, 1);
                break;
            }
        }
    }
}

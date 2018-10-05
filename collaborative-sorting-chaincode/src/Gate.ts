import { ItemType } from './ItemType';
import { Item } from './Item';
import { Payload } from './Payload';
       
export class Gate {
    public typeObject       : string;       /* GATE */
    public id               : string;       /* 0 - 29 */
    public idConnectedBay   : string;       /* null --> no bay connected - Gate OFF */ 
    public load             : number;       /* 0 -> Empty - 1 -> Full */
    public preference       : Array<ItemType>;
    public enable           : boolean;      
    public position         : string;
    public items            : Array<Item>;  /* Items in ConveyorLoop assigned at this Gate*/
    public datetime         : Date;
    public payload          : Payload;
    
    constructor(id: string, idConnectedBay:string, load:number, enable:boolean, position:string, datetime:Date) {
        this.typeObject     = 'GATE';
        this.id             = id;
        this.idConnectedBay = idConnectedBay;
        this.load           = load;
        this.preference     = new Array<ItemType>();
        this.enable         = enable;
        this.position       = position;
        this.items          = [];
        this.datetime       = datetime;
        this.payload        = null;
    }

    public addPreference(itemType:ItemType) {
        this.preference.push(itemType); 
    }

    public addPayload(payload:Payload) {
        this.payload = payload;
    }

    public addItem(item:Item) {
        this.items.push(item); 
    }
    public removeItem(item:Item) {
        for (let i = 0; i < this.items.length; i++){
            if (this.items[i] === item) { 
                this.items.splice(i, 1);
                break;
            }
        }
    }
}

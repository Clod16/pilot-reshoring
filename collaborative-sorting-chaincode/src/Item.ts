import { ItemType } from './ItemType';

export class Item {
    public typeObject   : string; /* ITEM */
    public id           : string;
    public inLoop       : boolean;
    public type         : ItemType;
    public position     : number;
}
import { Payload } from './Payload';

export class Event {
    public idBay       : string; 
    public position    : string; 
    public payload     : Payload; 

    constructor(idBay:string, position:string, payload:Payload ){
        this.idBay    = idBay;
        this.position = position;
        this.payload  = payload;
    }
}
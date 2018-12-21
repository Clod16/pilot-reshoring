export class Event {
    public idBay       : string; 
    public position    : string; 
    public payload     : string; 

    constructor(idBay:string, position:string, payload:string ){
        this.idBay    = idBay;
        this.position = position;
        this.payload  = payload;
    }
}
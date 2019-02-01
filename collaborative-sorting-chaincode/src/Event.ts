export class Event {
    public idBay       : string; 
    public position    : string; 
    public payload     : string; 
    public preference  : string; 

    constructor(idBay:string, position:string, payload:string, preference:string ){
        this.idBay      = idBay;
        this.position   = position;
        this.payload    = payload;
        this.preference = preference;
    }
}
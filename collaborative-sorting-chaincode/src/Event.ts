export class Event {
    public idBay       : string; 
    public position    : string; 
    public payload     : string; 
    public preference  : string;
    public doubleSize  : boolean; 

    constructor(idBay:string, position:string, payload:string, preference:string, doubleSize:boolean){
        this.idBay      = idBay;
        this.position   = position;
        this.payload    = payload;
        this.preference = preference;
        this.doubleSize = doubleSize;
    }
}
export class ItemType {
    public id         : string;
    public description: string;
    public doubleSize : boolean;

    constructor(id:string, description:string){
        this.id          = id;
        this.description = description;
        this.doubleSize  = false;
    };
}

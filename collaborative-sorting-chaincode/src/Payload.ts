       
export class Payload {
    public producer         : string; 
    public type             : string; 
    public pushQuantity     : string; 
    public speed            : string; 
    public temperature      : string;
    public length           : string;
    public width            : string;
    public motorFrequency   : string;
    public motorVoltage     : string;
    public acceptedProduct  : string;
  
    constructor(producer: string, type:string, pushQuantity:string, speed:string, temperature:string, length:string,
                width:string, motorFrequency:string, motorVoltage: string, acceptedProduct:string) {
                    this.producer         = producer; 
                    this.type             = type; 
                    this.pushQuantity     = pushQuantity; 
                    this.speed            = speed; 
                    this.temperature      = temperature;
                    this.length           = length;
                    this.width            = width;
                    this.motorFrequency   = motorFrequency;
                    this.motorVoltage     = motorVoltage;
                    this.acceptedProduct  = acceptedProduct;
    }

}


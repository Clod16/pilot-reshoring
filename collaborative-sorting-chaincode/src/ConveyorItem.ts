import { ConveyorItemType } from '.';
import { ConveyorBay } from './ConveyorBay';

export class ConveyorItem {
    public typeObject   : string;
    public id           : string;
    public type         : ConveyorItemType;
    public conveyorBay  : ConveyorBay;
    public state        : ConveyorItem.State;
    public position     : number;
}

export module ConveyorItem {
    export enum State {
        inConveyorLegacy    = 'inConveyorLegacy',
        readyIN             = 'readyIn',
        inConveyorLoop      = 'inConveyorLoop',
        inConveyorGate      = 'inConveyorGate',
        inBay               = 'InBay',
        readyOUT            = 'ReadyOut',
        inWharehouse        = 'inWharehouse',
        suspended           = 'suspended'
    }
}
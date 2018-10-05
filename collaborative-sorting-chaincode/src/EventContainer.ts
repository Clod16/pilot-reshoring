import { Event } from './Event';

export class EventContainer {
    public eventType: string;
    public event    : Event;

    constructor(eventType: string, event: Event) {
        this.eventType = eventType;
        this.event     = event;
    }
}
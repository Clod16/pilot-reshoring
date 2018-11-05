package model;

public class EventContainer {
    private String eventType;
    private Event event;

    public EventContainer() {
    }

    public EventContainer(String eventType, Event event) {
        this.eventType = eventType;
        this.event = event;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    @Override
    public String toString() {
        return "EventContainer{" +
                "eventType='" + eventType + '\'' +
                ", event=" + event +
                '}';
    }
}

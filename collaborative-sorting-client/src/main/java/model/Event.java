package model;

public class Event {
    private String idBay;
    private String position;
    private String payload;

    public Event() {
    }

    public Event(String idBay, String position, String payload) {
        this.idBay = idBay;
        this.position = position;
        this.payload = payload;
    }

    public String getIdBay() {
        return idBay;
    }

    public void setIdBay(String idBay) {
        this.idBay = idBay;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    @Override
    public String toString() {
        return "Event{" +
                "idBay='" + idBay + '\'' +
                ", position='" + position + '\'' +
                ", payload='" + payload + '\'' +
                '}';
    }
}

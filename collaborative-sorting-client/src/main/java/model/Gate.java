package model;

import java.util.Date;
import java.util.List;
import java.util.Objects;


public class Gate {
    private String         typeObject = "GATE";
    private String         id;
    private String         idConnectedBay;
    private Double         load;
    private List<ItemType> preference;
    private Boolean        enable;
    private String         position;
    private List<Item>     items;
    private Date           datetime;
    private Payload        payload;

    public Gate() {
    }

    public Gate(String id, String idConnectedBay, Double load, List<ItemType> preference, Boolean enable, String position, Date datetime, Payload payload) {
        this.id             = id;
        this.idConnectedBay = idConnectedBay;
        this.load           = load;
        this.preference     = preference;
        this.enable         = enable;
        this.position       = position;
        this.datetime       = datetime;
        this.payload        = payload;
    }

    public String getTypeObject() {
        return typeObject;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getIdConnectedBay() {
        return idConnectedBay;
    }

    public void setIdConnectedBay(String idConnectedBay) {
        this.idConnectedBay = idConnectedBay;
    }

    public Double getLoad() {
        return load;
    }

    public void setLoad(Double load) {
        this.load = load;
    }

    public List<ItemType> getPreference() {
        return preference;
    }

    public void setPreference(List<ItemType> preference) {
        this.preference = preference;
    }

    public Boolean getEnable() {
        return enable;
    }

    public void setEnable(Boolean enable) {
        this.enable = enable;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public Date getDatetime() {
        return datetime;
    }

    public void setDatetime(Date datetime) {
        this.datetime = datetime;
    }

    public Payload getPayload() {
        return payload;
    }

    public void setPayload(Payload payload) {
        this.payload = payload;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Gate)) return false;
        Gate gate = (Gate) o;
        return Objects.equals(getTypeObject(), gate.getTypeObject()) &&
                Objects.equals(getId(), gate.getId());
    }

    @Override
    public int hashCode() {

        return Objects.hash(getTypeObject(), getId());
    }

    @Override
    public String toString() {
        return "Gate{" +
                "typeObject='" + typeObject + '\'' +
                ", id='" + id + '\'' +
                ", idConnectedBay='" + idConnectedBay + '\'' +
                ", load=" + load +
                ", preference=" + preference +
                ", enable=" + enable +
                ", position='" + position + '\'' +
                ", items=" + items +
                ", datetime=" + datetime +
                ", payload=" + payload +
                '}';
    }
}


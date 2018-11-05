package model;

import java.util.Objects;

public class Item {

    private String   typeObject = "ITEM";
    private String   id;
    private Boolean  inLoop;
    private ItemType type;
    private Integer  position;

    public Item() {
    }
    public Item(String id, Boolean inLoop, ItemType type) {
        this.id     = id;
        this.inLoop = inLoop;
        this.type   = type;
    }

    public String getTypeObject() {
        return typeObject;
    }

    public void setTypeObject(String typeObject) {
        this.typeObject = typeObject;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Boolean getInLoop() {
        return inLoop;
    }

    public void setInLoop(Boolean inLoop) {
        this.inLoop = inLoop;
    }

    public ItemType getType() {
        return type;
    }

    public void setType(ItemType type) {
        this.type = type;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Item)) return false;
        Item item = (Item) o;
        return Objects.equals(getTypeObject(), item.getTypeObject()) &&
                Objects.equals(getId(), item.getId());
    }

    @Override
    public int hashCode() {

        return Objects.hash(getTypeObject(), getId());
    }
    @Override
    public String toString() {
        return "Item{" +
                "typeObject='" + typeObject + '\'' +
                ", id='" + id + '\'' +
                ", inLoop=" + inLoop +
                ", type=" + type +
                ", position=" + position +
                '}';
    }

}


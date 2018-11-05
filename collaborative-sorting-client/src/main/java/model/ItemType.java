package model;

import java.util.Objects;

public class ItemType {
    private String id;
    private String description;

    public ItemType() {
    }

    public ItemType(String id, String description) {
        this.id = id;
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ItemType)) return false;
        ItemType itemType = (ItemType) o;
        return Objects.equals(getId(), itemType.getId()) &&
                Objects.equals(getDescription(), itemType.getDescription());
    }

    @Override
    public int hashCode() {

        return Objects.hash(getId(), getDescription());
    }

    @Override
    public String toString() {
        return "ItemType{" +
                "id='" + id + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}

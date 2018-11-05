package model;

public class Payload {
    private String producer;
    private String type;
    private String pushQuantity;
    private String speed;
    private String temperature;
    private String length;
    private String width;
    private String motorFrequency;
    private String motorVoltage;
    private String acceptedProduct;

    public Payload() {
    }

    public Payload(String producer, String type, String pushQuantity, String speed, String temperature, String length, String width, String motorFrequency, String motorVoltage, String acceptedProduct) {
        this.producer = producer;
        this.type = type;
        this.pushQuantity = pushQuantity;
        this.speed = speed;
        this.temperature = temperature;
        this.length = length;
        this.width = width;
        this.motorFrequency = motorFrequency;
        this.motorVoltage = motorVoltage;
        this.acceptedProduct = acceptedProduct;
    }

    public String getProducer() {
        return producer;
    }

    public void setProducer(String producer) {
        this.producer = producer;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPushQuantity() {
        return pushQuantity;
    }

    public void setPushQuantity(String pushQuantity) {
        this.pushQuantity = pushQuantity;
    }

    public String getSpeed() {
        return speed;
    }

    public void setSpeed(String speed) {
        this.speed = speed;
    }

    public String getTemperature() {
        return temperature;
    }

    public void setTemperature(String temperature) {
        this.temperature = temperature;
    }

    public String getLength() {
        return length;
    }

    public void setLength(String length) {
        this.length = length;
    }

    public String getWidth() {
        return width;
    }

    public void setWidth(String width) {
        this.width = width;
    }

    public String getMotorFrequency() {
        return motorFrequency;
    }

    public void setMotorFrequency(String motorFrequency) {
        this.motorFrequency = motorFrequency;
    }

    public String getMotorVoltage() {
        return motorVoltage;
    }

    public void setMotorVoltage(String motorVoltage) {
        this.motorVoltage = motorVoltage;
    }

    public String getAcceptedProduct() {
        return acceptedProduct;
    }

    public void setAcceptedProduct(String acceptedProduct) {
        this.acceptedProduct = acceptedProduct;
    }


    @Override
    public String toString() {
        return "Payload{" +
                "producer='" + producer + '\'' +
                ", type='" + type + '\'' +
                ", pushQuantity='" + pushQuantity + '\'' +
                ", speed='" + speed + '\'' +
                ", temperature='" + temperature + '\'' +
                ", length='" + length + '\'' +
                ", width='" + width + '\'' +
                ", motorFrequency='" + motorFrequency + '\'' +
                ", motorVoltage='" + motorVoltage + '\'' +
                ", acceptedProduct='" + acceptedProduct + '\'' +
                '}';
    }
}

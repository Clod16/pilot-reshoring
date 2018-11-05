import it.eng.jledgerclient.exception.JLedgerClientException;
import model.Event;
import model.EventContainer;
import model.Gate;
import model.Item;
import model.ItemType;

import java.util.List;

public interface CollaborativeSortingLedgerClient {

    void Init() throws JLedgerClientException;
    void storeItem(Item item) throws JLedgerClientException;
    void storeBay(Gate gate) throws JLedgerClientException;
    void updateBay(Gate gate) throws JLedgerClientException;
    void removeBay(Gate gate) throws JLedgerClientException;
    void editGate(Gate gate) throws JLedgerClientException;
    void editItemType(ItemType itemType) throws JLedgerClientException;
    void grabItemIntoGate(Item item) throws JLedgerClientException;
    Item getItemById(String id) throws JLedgerClientException;
    ItemType getItemTypeById(String id) throws JLedgerClientException;
    Gate getGateById(String id) throws JLedgerClientException;
    List<Item> getItems() throws JLedgerClientException;
    List<ItemType> getItemsType() throws JLedgerClientException;
    List<Gate> getGates() throws JLedgerClientException;
    List<Item>getItemsByGate(String gate) throws JLedgerClientException;

}

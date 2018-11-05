
import it.eng.jledgerclient.exception.JLedgerClientException;

import java.util.ArrayList;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.ExecutionException;
import it.eng.jledgerclient.fabric.HLFLedgerClient;
import it.eng.jledgerclient.fabric.config.ConfigManager;
import it.eng.jledgerclient.fabric.config.Configuration;
import it.eng.jledgerclient.fabric.config.Organization;
import it.eng.jledgerclient.fabric.helper.InvokeReturn;
import it.eng.jledgerclient.fabric.helper.LedgerInteractionHelper;
import it.eng.jledgerclient.fabric.helper.QueryReturn;
import it.eng.jledgerclient.fabric.utils.JsonConverter;
import model.Function;
import model.Gate;
import model.Item;
import model.ItemType;
import model.Event;
import model.EventContainer;
import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;
import org.hyperledger.fabric.sdk.ChaincodeEventListener;
// import org.hyperledger.fabric.sdk.BlockEvent;
import java.util.List;
import java.util.concurrent.TimeUnit;


final public class FabricCollaborativeSortingLedgerClient extends HLFLedgerClient implements CollaborativeSortingLedgerClient {
    private final static Logger log = LogManager.getLogger(FabricCollaborativeSortingLedgerClient.class);


    public FabricCollaborativeSortingLedgerClient() throws JLedgerClientException {
        doLedgerClient();
    }

    private void doLedgerClient() throws JLedgerClientException {
        try {
            configManager = ConfigManager.getInstance();
            Configuration configuration = configManager.getConfiguration();
            if (null == configuration || null == configuration.getOrganizations() || configuration.getOrganizations().isEmpty()) {
                log.error("Configuration missing!!! Check your config file!!!");
                throw new JLedgerClientException("Configuration missing!!! Check you config file!!!");
            }
            List<Organization> organizations = configuration.getOrganizations();
            if (null == organizations || organizations.isEmpty())
                throw new JLedgerClientException("Organizations missing!!! Check you config file!!!");
            //for (Organization org : organizations) {
            //FIXME multiple Organizations
            ledgerInteractionHelper = new LedgerInteractionHelper(configManager, organizations.get(0));
            //}
        } catch (Exception e) {
            log.error(e);
            throw new JLedgerClientException(e);
        }
    }
    @Override
    public String doRegisterEvent(String eventName, ChaincodeEventListener chaincodeEventListener) throws JLedgerClientException {
        return super.doRegisterEvent(eventName, chaincodeEventListener);
    }

    private String doInvokeByJson(Function fcn, List<String> args) throws JLedgerClientException {
        final InvokeReturn invokeReturn = ledgerInteractionHelper.invokeChaincode(fcn.name(), args);
        try {
            log.debug("BEFORE -> Store Completable Future at " + System.currentTimeMillis());
            invokeReturn.getCompletableFuture().get(configManager.getConfiguration().getTimeout(), TimeUnit.MILLISECONDS);
            log.debug("AFTER -> Store Completable Future at " + System.currentTimeMillis());
            final String payload = invokeReturn.getPayload();
            return payload;
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error(fcn.name().toUpperCase() + " " + e.getMessage());
            throw new JLedgerClientException(fcn.name() + " " + e.getMessage());
        }
    }
    private String getItemsByGate(Function fcn, List<String> args) throws JLedgerClientException {
        String data = "";
        try {
            final List<QueryReturn> queryReturns = ledgerInteractionHelper.queryChainCode(fcn.name(), args, null);
            for (QueryReturn queryReturn : queryReturns) {
                data += queryReturn.getPayload();
            }
            return data;
        } catch (Exception e) {
            log.error(fcn.name() + " " + e.getMessage());
            throw new JLedgerClientException(fcn.name() + " " + e.getMessage());
        }
    }

    @Override
    public void Init() throws JLedgerClientException {

        List<String> args = new ArrayList<>();
        args.add("");
        final String payload = doInvokeByJson(Function.Init, args);
        log.debug("Payload retrieved: " + payload);
    }
    @Override
    public void storeItem(Item item) throws JLedgerClientException {
        if (item == null) {
            throw new JLedgerClientException(Function.storeItem.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(JsonConverter.convertToJsonNode(item));
        final String payload = doInvokeByJson(Function.storeItem, args);
        log.debug("Payload retrieved: " + payload);
    }
    @Override
    public void storeBay(Gate gate) throws JLedgerClientException {
        if (gate == null) {
            throw new JLedgerClientException(Function.storeBay.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(JsonConverter.convertToJsonNode(gate));
        final String payload = doInvokeByJson(Function.storeBay, args);
        log.debug("Payload retrieved: " + payload);
    }
    @Override
    public void updateBay(Gate gate) throws JLedgerClientException {
        if (gate == null) {
            throw new JLedgerClientException(Function.updateBay.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(JsonConverter.convertToJsonNode(gate));
        final String payload = doInvokeByJson(Function.updateBay, args);
        log.debug("Payload retrieved: " + payload);
    }
    @Override
    public void removeBay(Gate gate) throws JLedgerClientException {
        if (gate == null) {
            throw new JLedgerClientException(Function.removeBay.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(JsonConverter.convertToJsonNode(gate));
        final String payload = doInvokeByJson(Function.removeBay, args);
        log.debug("Payload retrieved: " + payload);
    }
    @Override
    public void editGate(Gate gate) throws JLedgerClientException {
        if (gate == null) {
            throw new JLedgerClientException(Function.editGate.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(JsonConverter.convertToJsonNode(gate));
        final String payload = doInvokeByJson(Function.editGate, args);
        log.debug("Payload retrieved: " + payload);
    }
    @Override
    public void editItemType(ItemType itemType) throws JLedgerClientException {
        if (itemType == null) {
            throw new JLedgerClientException(Function.editItemType.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(JsonConverter.convertToJsonNode(itemType));
        final String payload = doInvokeByJson(Function.editItemType, args);
        log.debug("Payload retrieved: " + payload);
    }
    @Override
    public void grabItemIntoGate(Item item) throws JLedgerClientException {
        if (item == null) {
            throw new JLedgerClientException(Function.grabItemIntoGate.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(JsonConverter.convertToJsonNode(item));
        final String payload = doInvokeByJson(Function.grabItemIntoGate, args);
        log.debug("Payload retrieved: " + payload);
    }
    @Override
    public Gate getGateById(String id) throws JLedgerClientException {
        if (id == null) {
            throw new JLedgerClientException(Function.getGateById.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(id);
        final String payload = doInvokeByJson(Function.getGateById, args);
        log.debug("Payload retrieved: " + payload);
        final Gate gate = (Gate) JsonConverter.convertFromJson(payload, Gate.class, false);
        return gate;
    }
    @Override

    public Item getItemById(String id) throws JLedgerClientException {
        if (id == null) {
            throw new JLedgerClientException(Function.getItemById.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(id);
        final String payload = doInvokeByJson(Function.getItemById, args);
        log.debug("Payload retrieved: " + payload);
        final Item item = (Item) JsonConverter.convertFromJson(payload, Item.class, false);
        return item;
    }

    @Override

    public ItemType getItemTypeById(String id) throws JLedgerClientException {
        if (id == null) {
            throw new JLedgerClientException(Function.getItemTypeById.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(id);
        final String payload = doInvokeByJson(Function.getItemTypeById, args);
        log.debug("Payload retrieved: " + payload);
        final ItemType itemType = (ItemType) JsonConverter.convertFromJson(payload, ItemType.class, false);
        return itemType;
    }

    @Override
    public List<Gate> getGates() throws JLedgerClientException {
        List<String> args = new ArrayList<>();
        args.add("");
        final String payload = doInvokeByJson(Function.getGates,args);
        log.debug("Payload retrieved: " + payload);
        final ArrayList<Gate> gates = (ArrayList<Gate>) JsonConverter.convertFromJson(payload, Gate.class, true);
        return gates;
    }
    @Override
    public List<Item> getItems() throws JLedgerClientException {
        List<String> args = new ArrayList<>();
        args.add("");
        final String payload = doInvokeByJson(Function.getItems,args);
        log.debug("Payload retrieved: " + payload);
        final ArrayList<Item> items = (ArrayList<Item>) JsonConverter.convertFromJson(payload, Item.class, true);
        return items;
    }
    @Override
    public List<ItemType> getItemsType() throws JLedgerClientException {
        List<String> args = new ArrayList<>();
        args.add("");
        final String payload = doInvokeByJson(Function.getItemsType,args);
        log.debug("Payload retrieved: " + payload);
        final ArrayList<ItemType> itemsType = (ArrayList<ItemType>) JsonConverter.convertFromJson(payload, ItemType.class, true);
        return itemsType;
    }
    @Override
    public List<Item> getItemsByGate(String id) throws JLedgerClientException {
        if (id == null) {
            throw new JLedgerClientException(Function.getItemsByGate.name() + " is in error, No input data!");
        }
        List<String> args = new ArrayList<>();
        args.add(id);
        final String payload = doInvokeByJson(Function.getItemsByGate,args);
        log.debug("Payload retrieved: " + payload);
        final ArrayList<Item> items = (ArrayList<Item>) JsonConverter.convertFromJson(payload, Item.class, true);
        return items;
    }

}

import it.eng.jledgerclient.exception.JLedgerClientException;
import model.Gate;
import model.Item;
import model.ItemType;
import model.Payload;
import model.Event;
import model.EventContainer;
import org.hyperledger.fabric.sdk.BlockEvent;
import org.hyperledger.fabric.sdk.ChaincodeEvent;
import org.hyperledger.fabric.sdk.ChaincodeEventListener;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Date;
import java.util.Random;

import static org.junit.Assert.*;

public class End2EndTest {
    static FabricCollaborativeSortingLedgerClient fabricCollaborativeSortingLedgerClient;

    @BeforeClass
    public static void begin() {
        try {
            fabricCollaborativeSortingLedgerClient = new FabricCollaborativeSortingLedgerClient();
        } catch (JLedgerClientException e) {
            assertFalse(e.getMessage(), true);
        }
    }

    @AfterClass
    public static void end() {
        fabricCollaborativeSortingLedgerClient = null;
    }

    @Test
    public void testStoreItem() {
        final Item itemTest = buildItem();
        try {
            fabricCollaborativeSortingLedgerClient.storeItem(itemTest);
            Item itemLedger = fabricCollaborativeSortingLedgerClient.getItemById(itemTest.getId());
            assertEquals(itemTest, itemLedger);
        } catch (JLedgerClientException e) {
            assertFalse(e.getMessage(), true);
        }
    }

    @Test
    public void testStoreGate() {
        final Gate gateTest = buildGate();
        try {
            fabricCollaborativeSortingLedgerClient.editGate(gateTest);
            Gate gateLedger = fabricCollaborativeSortingLedgerClient.getGateById(gateTest.getId());
            assertEquals(gateTest, gateLedger);
        } catch (JLedgerClientException e) {
            assertFalse(e.getMessage(), true);
        }
    }

    @Test
    public void testStoreBay() {
        final Gate gateTest = buildGate();
        try {
            gateTest.setId("gamma" + getNextInt());
            gateTest.setIdConnectedBay("5");
            gateTest.setPosition("55");
            Payload pl = gateTest.getPayload();
            pl.setAcceptedProduct("LOL");
            gateTest.setPayload(pl);
            fabricCollaborativeSortingLedgerClient.storeBay(gateTest);
            Gate gateLedger = fabricCollaborativeSortingLedgerClient.getGateById(gateTest.getId());
            ItemType it = new ItemType(pl.getAcceptedProduct(), "");
            ItemType itL = fabricCollaborativeSortingLedgerClient.getItemTypeById(pl.getAcceptedProduct());
            // assertEquals(gateTest, gateLedger);
            assertEquals(it.getId(), itL.getId());

        } catch (JLedgerClientException e) {
            assertFalse(e.getMessage(), true);
        }
    }

    @Test
    public void testUpdateBay() {
        //    final Gate gateTest = buildGate();
        try {
            ArrayList<Gate> gates = (ArrayList<Gate>) fabricCollaborativeSortingLedgerClient.getGates();
            Gate gateTest = gates.get(0);
            gateTest.setIdConnectedBay("9");
            gateTest.setPosition("69");
            Payload pl = gateTest.getPayload();
            pl.setAcceptedProduct("LOLLIPOP");
            gateTest.setPayload(pl);
            fabricCollaborativeSortingLedgerClient.updateBay(gateTest);
            Gate gateLedger = fabricCollaborativeSortingLedgerClient.getGateById(gateTest.getId());
            // ItemType it = new ItemType(pl.getAcceptedProduct(),"");
            // ItemType itL = fabricCollaborativeSortingLedgerClient.getItemTypeById(pl.getAcceptedProduct());
            assertEquals(gateTest, gateLedger);
            // assertEquals(it.getId(), itL.getId());

        } catch (JLedgerClientException e) {
            assertFalse(e.getMessage(), true);
        }
    }

    @Test
    public void testEditItemType() {

        try {
            ItemType itt = new ItemType();
            itt.setId("12345");
            itt.setDescription("Test EditItemType");
            fabricCollaborativeSortingLedgerClient.editItemType(itt);
            ItemType itemTypeLedger = fabricCollaborativeSortingLedgerClient.getItemTypeById(itt.getId());
            assertEquals(itemTypeLedger, itt);

        } catch (JLedgerClientException e) {
            assertFalse(e.getMessage(), true);
        }
    }

    @Test
    public void testRemoveBay() {
        final Gate gateTest = buildGate();
        try {
            gateTest.setIdConnectedBay("99");
            gateTest.setPosition("19");
            Payload pl = gateTest.getPayload();
            pl.setAcceptedProduct("POP");
            gateTest.setPayload(pl);
            fabricCollaborativeSortingLedgerClient.updateBay(gateTest);
            Gate gateLedger = fabricCollaborativeSortingLedgerClient.getGateById(gateTest.getId());
            fabricCollaborativeSortingLedgerClient.removeBay(gateLedger);
            Gate gateUpdated = fabricCollaborativeSortingLedgerClient.getGateById(gateLedger.getId());
            assertNull(gateUpdated.getIdConnectedBay());
        } catch (JLedgerClientException e) {
            assertFalse(e.getMessage(), true);
        }
    }


    @Test
    public void testGrabItem() {
        try {
            final Item itemTest = buildItem();
            itemTest.setId("alpha14");
            fabricCollaborativeSortingLedgerClient.storeItem(itemTest);
            ArrayList<Item> items = (ArrayList<Item>) fabricCollaborativeSortingLedgerClient.getItems();
            System.out.println("Number of Item in the Ledger: " + items.size());

            if (items.size() != 0) {
                Item item = items.get(0);
                String ide = item.getId();
                fabricCollaborativeSortingLedgerClient.grabItemIntoGate(item);
                fabricCollaborativeSortingLedgerClient.getItemById(ide);
                assertFalse("getItemById return one item", true);
            } else {
                assertFalse("getItems return array empty", true);
            }

        } catch (JLedgerClientException e) {
            assertEquals("it.eng.jledgerclient.exception.JLedgerClientException: Json data is EMPTY", e.getMessage());

        }
    }


    @Test
    public void testGetItemsByGate() {
        try {
            final Item itemTestOne = buildItem();
            final Item itemTestTwo = buildItem();
            final Item itemTestThree = fabricCollaborativeSortingLedgerClient.getItemById("alpha17");
            final Gate gateTest = buildGate();

            ArrayList<Item> items = new ArrayList<Item>();
            items.add(itemTestOne);
            items.add(itemTestTwo);
            items.add(itemTestThree);

            gateTest.setItems(items);
            fabricCollaborativeSortingLedgerClient.updateBay(gateTest);
            Gate gate = (Gate) fabricCollaborativeSortingLedgerClient.getGateById(gateTest.getId());
            ArrayList<Item> itemsLedger = (ArrayList<Item>) fabricCollaborativeSortingLedgerClient.getItemsByGate(gateTest.getId());

            assertArrayEquals(itemsLedger.toArray(), items.toArray());

        } catch (JLedgerClientException e) {
            assertEquals("it.eng.jledgerclient.exception.JLedgerClientException: Json data is EMPTY", e.getMessage());

        }
    }

    @Test
    public void testEvent() {
        final Gate gateTest = buildGate();
        try {
            gateTest.setId("gamma" + getNextInt());
            gateTest.setIdConnectedBay("7");
            gateTest.setPosition("77");
            Payload pl = gateTest.getPayload();
            pl.setAcceptedProduct("LOL");
            gateTest.setPayload(pl);
            fabricCollaborativeSortingLedgerClient.storeBay(gateTest);
            ChaincodeEventListener chaincodeEventListener = new ChaincodeEventListener() {
                @Override
                public void received(String handle, BlockEvent blockEvent, ChaincodeEvent chaincodeEvent) {
                    String payload = new String(chaincodeEvent.getPayload());
                    System.out.println("Event from chaincode: " + chaincodeEvent.getEventName() + " " + payload);

                }
            };
            fabricCollaborativeSortingLedgerClient.doRegisterEvent("STORE BAY", chaincodeEventListener);


            // assertEquals(it.getId(), itL.getId());

        } catch (JLedgerClientException e) {
            assertFalse(e.getMessage(), true);
        }
    }


    private Item buildItem() {
        ItemType itemTypeA = new ItemType("11111111111", "TypeTest");
        Item item = new Item();
        item.setId("alpha" + getNextInt());
        item.setInLoop(false);
        item.setPosition(0);
        item.setType(itemTypeA);
        return item;
    }

    private Gate buildGate() {
        ItemType itemTypeA = new ItemType("11111111111", "TypeTest");
        ArrayList<ItemType> itemTypes = new ArrayList<ItemType>();
        itemTypes.add(itemTypeA);
        Payload payloadDefault = new Payload("Interroll", "NST21550", "5", "1", "22", "500", "300", "60", "230", "");
        Gate gate = new Gate();
        gate.setId("beta" + getNextInt());
        gate.setLoad(0.0);
        gate.setDatetime(new Date());
        gate.setEnable(true);
        gate.setIdConnectedBay(null);
        gate.setPosition("50");
        gate.setPayload(payloadDefault);
        gate.setPreference(itemTypes);
        return gate;
    }

    private int getNextInt() {
        Random rand = new Random();
        return rand.nextInt(100);
    }

    /*

    @Test
    public void integrationTest() {
        ItemType itemTypeA = new ItemType("869990965260", "Type0");
        ItemType itemTypeB = new ItemType("869990965261", "Type00");

        System.out.println("DOPO creazione itemType");
        Item itemA = new Item("0", false, itemTypeB);
        Item itemB = new Item("1", false, itemTypeA);
        System.out.println("DOPO creazione itemA e itemB");
        try {
            System.out.println("PRIMA della INIT");
            fabricCollaborativeSortingLedgerClient.Init();
            System.out.println("DOPO la INIT e PRIMA del primo store Item");
            fabricCollaborativeSortingLedgerClient.storeItem(itemA);
            System.out.println("DOPO primo store Item e PRIMA del secondo store Item");
            fabricCollaborativeSortingLedgerClient.storeItem(itemB);
            System.out.println("DOPO secondo store Item");
            ArrayList<Item> items = new ArrayList<Item>();
            System.out.println("DOPO creazione Array items");
            items =(ArrayList<Item>) fabricCollaborativeSortingLedgerClient.getItems();
            System.out.println("DOPO getItems");
            ArrayList<Gate> gates = new ArrayList<Gate>();
            System.out.println("DOPO creazione Array gates");
            gates = (ArrayList<Gate>) fabricCollaborativeSortingLedgerClient.getGates();
            System.out.println("DOPO getGates");
            Boolean isFoundItemA = false;
            Boolean isFoundItemB = false;
            System.out.println("PRIMA del ciclo for each");
            for (Gate gt : gates) {
                System.out.println("DENTRO ciclo for each");
                if (gt.getItems().contains(itemA)) {
                    isFoundItemA = true;
                    System.out.println("PRIMA di editGate: " + gt.getId());
                    gt.setLoad(gt.getLoad() + 0.125);
                    fabricCollaborativeSortingLedgerClient.editGate(gt);
                }

                if (gt.getItems().contains(itemB)) {
                    isFoundItemB = true;
                    System.out.println("PRIMA di editGate: " + gt.getId());
                    gt.setLoad(gt.getLoad() + 0.125);
                    fabricCollaborativeSortingLedgerClient.editGate(gt);
                }


            }
            System.out.println("GET GATE PUNTUALI");
            Gate gate = fabricCollaborativeSortingLedgerClient.getGateById("0");
            System.out.println("GATE 0: " + gate.toString());
            gate = fabricCollaborativeSortingLedgerClient.getGateById("1");
            System.out.println("GATE 1: " + gate.toString());

            System.out.println("GET ITEM PUNTUALI");
            Item item = fabricCollaborativeSortingLedgerClient.getItemById("0");
            System.out.println("ITEM 0: " + item.toString());
            item = fabricCollaborativeSortingLedgerClient.getItemById("1");
            System.out.println("ITEM 1: " + item.toString());

            items = (ArrayList<Item>) fabricCollaborativeSortingLedgerClient.getItemsByGate("0");
            for (Item it: items) {
                System.out.println("ITEMs trovati in GATE 0 itemId: " + it.getId());
                fabricCollaborativeSortingLedgerClient.grabItemIntoGate(it);
                System.out.println("ITEMs grabbato in GATE 0: " + it.getId());
            }
            items = (ArrayList<Item>) fabricCollaborativeSortingLedgerClient.getItemsByGate("0");
            if (items != null) {
                System.out.println("ERRORE: Non siamo riusciti a togliere l'item");
            }

            items = (ArrayList<Item>) fabricCollaborativeSortingLedgerClient.getItemsByGate("1");
            for (Item it: items
                    ) {
                System.out.println("ITEMs trovati in GATE 1: " + it.getId());
            }
            ItemType itemTypeC = new ItemType("869990965262", "Type0C");
            ItemType itemTypeD = new ItemType("869990965263", "Type0D");
            itemTypeA.setDescription("Type0A");
            fabricCollaborativeSortingLedgerClient.editItemType(itemTypeC);
            fabricCollaborativeSortingLedgerClient.editItemType(itemTypeD);
            fabricCollaborativeSortingLedgerClient.editItemType(itemTypeA);
            ArrayList<ItemType> itemsType = (ArrayList<ItemType>) fabricCollaborativeSortingLedgerClient.getItemsType();
            System.out.println("ITEMsType (ALL): " + itemsType);

            System.out.println("*** New version with EVENT ***");

            Gate gateOfBay = fabricCollaborativeSortingLedgerClient.getGateById("9");
            System.out.println("GATE 9: " + gateOfBay.toString());
            gateOfBay.setId("10");
            fabricCollaborativeSortingLedgerClient.storeBay(gateOfBay);
            System.out.println("DOPO store Bay (10)");
            gateOfBay = fabricCollaborativeSortingLedgerClient.getGateById("10");
            System.out.println("GATE 10: " + gateOfBay.toString());
            fabricCollaborativeSortingLedgerClient.removeBay(gateOfBay);
            System.out.println("DOPO remove Bay");
            gateOfBay = fabricCollaborativeSortingLedgerClient.getGateById("10");
            System.out.println("GATE 10 (removed): " + gateOfBay.toString());

        } catch (JLedgerClientException e) {
            assertFalse(e.getMessage(), true);
        }
    } */
}




## Entity Model:

# Class Item
`public class Item {private String   typeObject = "ITEM";    
                    private String   id;
                    private Boolean  inLoop;
                    private ItemType type;
                    private Integer  position;
                    }
`
# Class Gate
`ublic class Gate {private String         typeObject = "GATE";
                   private String         id;
                   private String         idConnectedBay;
                   private Double         load;
                   private List<ItemType> preference;
                   private Boolean        enable;
                   private String         position;
                   private List<Item>     items;
                   private Date           datetime;
                   private Payload        payload;
                   }
`
# Class ItemType
`public class ItemType {private String id;
                        private String description;
                        }
`
# Class Event
`public class Event {private String idBay;
                     private String position;
                     private String payload;
                     }
`
# Class EventContainer
`public class EventContainer {private String eventType;
                              private Event event;
                              }
`
# Class Payload
`public class Payload {private String producer;
                       private String type;
                       private String pushQuantity;
                       private String speed;
                       private String temperature;
                       private String length;
                       private String width;
                       private String motorFrequency;
                       private String motorVoltage;
                       private String acceptedProduct;
                       }
`
 
## POST Methods: 
# storeItem   
- public async storeItem(stub: Stub, itemStr: string)    
_The storeItem method is called to insert a Item in the Conveyor Loop 
A exit Gate will be assigned to new Item_    


# storeBay   
- public async storeBay(stub: Stub, gateStr: string)    
_The storeBay method is called to insert a new Bay in a Gate_


#updateBay    
- public async updateBay(stub: Stub, gateStr: string)
_The updateGate method is called to change the data of a Bay in a Gate_ 


#removeBay  
- public async removeBay(stub: Stub, gateStr: string)   
_The removeGate method is called to remove a Bay from a Gate_



# editGate    
- public async editGate(stub: Stub, gateStr: string)
_The editGate method is called to update a Gate_
 

#editItemType    
- public async editItemType(stub: Stub, itemTypeStr: string)
_The editItemType method is called to update a ItemType_  


# grabItemIntoGate   
- grabItemIntoGate(stub: Stub, itemStr: string)
_The grabItemIntoGate method is called to delete a item from grab list of Gate._ 
_When the Gate "captures" a Item from the Conveyor Loop, it is removed from the Map (GrabList - Routing Table)_  


## GET Methods: 

#getItemsByGate
- getItemsByGate(stub: Stub, gateId: string)
_The getItemsByGate method is called to GET a subset of "Map" with all items INTO CONVEYOR LOOP assigned at this Gate_  

# getGateById
- getGateById(stub: Stub, id: string)
_The getGateById method is called to GET the gate with this id_


# getGates  
- getGates(stub: Stub)
_The getGates method is called to GET all Gates_


# getItems
- getItems(stub: Stub)
_The getItems method is called to GET all Items_  


# getItemById
- getItemById(stub: Stub, id: string)
_The getItemById method is called to GET the Item with this id_  

# getItemTypeById
- getItemTypeById(stub: Stub, id: string)
_The getItemTypeById method is called to GET the ItemType with this id_ 

# getItemsType
- getItemsType(stub: Stub)
_The getItemsType method is called to GET all ItemsType_  














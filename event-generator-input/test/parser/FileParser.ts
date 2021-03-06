import { ConveyorItem } from "../model/ConveyorItem";
import { ConveyorItemType } from "../model/ConveyorItemType";
import { eventGeneratorInput } from "../EventGeneratorInput";
import * as log from "../Logger";
import * as moment from 'moment'
//const colors = require('colors');
const readSync = require('read-file-relative').readSync;
const fileName = process.env.FILENAME || 'logger_input.txt';

class FileParser {
  private item: ConveyorItem;
  private itemType: ConveyorItemType;
  private lines: any;
  private index: number;

  constructor() {
    this.index = 0;
    this.lines = readSync('../../data/' + fileName).split("\n");
  }

  public parseData() {
    try {
      log.logger.debug("Line read: " + this.lines[this.index]);
      const arrayRead = this.lines[this.index].split(";");
      let timestamp = arrayRead[2];
      setTimeout(() => {
        const arrayItem = this.lines[this.index].split(";");
        log.logger.debug("ItemIN : " + arrayItem);
        this.item = {
          id: arrayItem[0],
          typeObject: 'ITEM',
          type: this.itemType,
          state: null,
          conveyorBay: null
        };
        this.itemType = {
          id: arrayItem[3],
          description: 'null'
        };
        if(arrayItem[3] == '869990965260'){
          this.itemType.description = 'oven';
        }
        if(arrayItem[3] == '869990965261'){
          this.itemType.description = 'fridge';
        }
        if(arrayItem[3] == '869990965262'){
          this.itemType.description = 'washingmachine';
        }
        if(arrayItem[3] == '869990965263'){
          this.itemType.description = 'dishwasher';
        }
        if(arrayItem[3] == '869990965264'){
          this.itemType.description = 'dryer';
        }
        log.logger.debug(this.item);
        log.logger.debug(this.itemType);
        log.logger.debug("Query chaincode...");
        eventGeneratorInput.storeConveyorItem(this.item);
        log.logger.info("Query done at " + moment().format('MMMM Do YYYY, h:mm:ss a'));
      this.index++;
      this.parseData();
    }, +timestamp);
  } catch(e) {
    log.logger.error(e);
  }
}
}

export { FileParser };

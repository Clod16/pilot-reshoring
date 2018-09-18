/* tslint:disable */

import { ChaincodeMockStub } from '@theledger/fabric-mock-stub';
import { ChaincodeReponse } from 'fabric-shim';
import { Transform } from '../src/utils/datatransform';
import * as mocha from 'mocha';
import { expect } from 'chai';
import { CollaborativeSorting } from '../src';
import { Item } from '../src/Item';
import { Gate } from '../src/Gate';

const chaincode = new CollaborativeSorting();

describe('Test Mockstub', () => {
    it('Should be able to init', async () => {

        const stub = new ChaincodeMockStub('mock', chaincode);
        const args = ['arg1', 'arg2'];
        const response: ChaincodeReponse = await stub.mockInit('uudif', args);
        expect(response.status).to.deep.equal(200);
    });
    it('Should be able to control bays', async () => {
        const stub = new ChaincodeMockStub('mock', chaincode);
        const args = ['arg1', 'arg2'];
        await stub.mockInit('test', args);

        const response: ChaincodeReponse = await stub.mockInvoke('test', ['controlBays']);
        expect(response.status).to.deep.equal(200);
    });
    it('Should be able to store conveyor item', async () => {
        const stub = new ChaincodeMockStub('mock', chaincode);
        const args = ['arg1', 'arg2'];
        await stub.mockInit('test', args);

    //    let typeOven = new ItemType('1', 'Oven');
    //    let typeFridge = new ItemType('2', 'Fridge');
    //    let typeWashingMachine = new ItemType('3', 'WashingMachine');
    //    let typeDishwasher = new ItemType('4', 'Dishwasher');
    //    let typedryer = new ItemType('5', 'Dryer');

    //    const Gate: Gate = new Gate('1', 10, 0, true, 1, new Date());
        const item: Item = {
            typeObject: 'ITEM',
            id: '7784199',
            inLoop: null,
            type: {
                id: '869990965260',
                description: 'oven'
            },
            position: 0
        };

        const response: ChaincodeReponse = await stub.mockInvoke('test', ['storeItem', JSON.stringify(item)]);
        expect(response.status).to.deep.equal(200);
    });
    it('Should be able to edit conveyor bay', async () => {
        const stub = new ChaincodeMockStub('mock', chaincode);
        const args = ['arg1', 'arg2'];
        await stub.mockInit('test', args);
                          
        const bay: Gate = new Gate('1', '10', 0, true, 1, new Date());

        const response: ChaincodeReponse = await stub.mockInvoke('test', ['editGate', JSON.stringify(bay)]);
        expect(response.status).to.deep.equal(200);
    });
    it('Should be able to get all bays', async () => {
        const stub = new ChaincodeMockStub('mock', chaincode);
        const args = ['arg1', 'arg2'];
        await stub.mockInit('test', args);

        // const bay: Gate = new Gate('1', 10, 0, true, 1, new Date());
      
        const response: ChaincodeReponse = await stub.mockInvoke('test', ['getBays']);
        expect(response.status).to.deep.equal(200);
    });
});

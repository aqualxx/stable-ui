import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { ImageData } from '@/stores/outputs';
import { useUIStore } from '@/stores/ui';

export class OutputsDexie extends Dexie {
    outputs!: Table<ImageData>; 

    constructor() {
        super('stableui');

        // https://github.com/dexie/Dexie.js/issues/781
        // For migrating from the old outputs format

        this.version(0.2).stores({
            outputs: ''
        });
  
        this.version(0.3).stores({
            outputs: null,
            outputsTemp: '++id'
        }).upgrade(async tx => {
            const outputs = await tx.table('outputs').get("outputs");
            await tx.table('outputsTemp').bulkPut(JSON.parse(outputs));
        });
        
        this.version(0.4).stores({
            outputsTemp: null,
            outputs: `++id`
        }).upgrade(async tx => {
            const outputs = await tx.table('outputsTemp').toArray();
            await tx.table('outputs').bulkPut(outputs);
        });

        this.version(0.5).stores({
            outputs: `++id,starred,rated`,
        }).upgrade(async tx => {
            return await tx.table("outputs").toCollection().modify(output => {
                output.starred = Number(output.starred);
                output.rated = Number(output.rated);
            });
        });
    }
}

export const db = new OutputsDexie();

db.open()
    .catch(() => {
        useUIStore().raiseError("The image database failed to open! This usually happens when using Firefox in Private Browsing mode. Try disabling Private Browsing or using another browser.", true)
    })
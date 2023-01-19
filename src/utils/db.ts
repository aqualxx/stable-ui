import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { ImageData } from '@/stores/outputs';

export class OutputsDexie extends Dexie {
    outputs!: Table<ImageData>; 

    constructor() {
        super('stableui');

        // https://github.com/dexie/Dexie.js/issues/781
        // For migrating from the old outputs format

        // 1. Keep initial version:
        this.version(0.2).stores({
            outputs: ''
        });
  
        // 2. Add intermediate version and copy table to temp table, deleting origin version.
        this.version(0.3).stores({
            outputs: null, // Delete friends table
            outputsTemp: '++id' // Create temp table
        }).upgrade(async tx => {
            const outputs = await tx.table('outputs').get("outputs");
            await tx.table('outputsTemp').bulkAdd(JSON.parse(outputs));
        });
        
        // 3. Copy table to new friends table, deleting temp table:
        this.version(0.4).stores({
            outputsTemp: null,
            outputs: `++id`
        }).upgrade(async tx => {
            const outputs = await tx.table('outputsTemp').toArray();
            await tx.table('outputs').bulkAdd(outputs);
        });
    }
}

export const db = new OutputsDexie();

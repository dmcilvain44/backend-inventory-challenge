import {
  findDeltas,
  getDeltas,
  makeWarehouseRecordsForSkuBatchRecord
} from "./sync";
import {RecordWithWMS, SkuBatchData, SkuBatchToSkuId, skuBatchUpdate} from "./interfaces.util";
import {appData, appSkuBatchData, appSkuBatchDataForSkuBatchIds} from "./db/data";
import {InventoryAggregateEndpoint, InventoryEndpoint, makeApiRequest} from "./http/api.util";

const logger = console;

/**
 * Converts a list of skuBatchIds from the app db into an insert to inventory.
 * @param skuBatchIdsToInsert
 */
export async function skuBatchToRecords(skuBatchIdsToInsert: string[]): Promise<RecordWithWMS[]> {
  const badSkuBatchCounter = { count: 0 };

  // create our inserts
  const records: RecordWithWMS[] = skuBatchIdsToInsert
    .reduce((arr: RecordWithWMS[], skuBatchId: string): RecordWithWMS[] => {
      const skuBatchRecordFromAppDb: SkuBatchToSkuId | undefined = appData.find(
        (skuBatchToSkuId: SkuBatchToSkuId): boolean => skuBatchToSkuId.skuBatchId === skuBatchId,
      );

      if (!skuBatchRecordFromAppDb) {
        logger.error(`no records found in app SkuBatch [skuBatchId=${skuBatchId}}]`);
        badSkuBatchCounter.count += 1;
        return arr;
      }

      arr.push(...makeWarehouseRecordsForSkuBatchRecord(skuBatchRecordFromAppDb));
      return arr;
    }, []);

  logger.log(`created inserts [count=${records.length}, badSkuBatchRecordCount=${badSkuBatchCounter.count}]`);

  return records;
}

/**
 * Finds changes in data between the app SkuBatch+Sku and inventory tables
 */
export async function findChangesBetweenDatasets(): Promise<skuBatchUpdate[]> {
  logger.log('finding app SkuBatch data that has changed and <> the inventory data');

  const updates: skuBatchUpdate[] = await [appSkuBatchData].reduce(
    async (accumPromise: Promise<skuBatchUpdate[]>, inventorySkuBatchData: SkuBatchData[]) => {
      const accum: skuBatchUpdate[] = await accumPromise;
      const skuBatchIds: string[] = inventorySkuBatchData.map((sbd: SkuBatchData) => sbd.skuBatchId);

      logger.log(`querying Logistics.SkuBatch for data [skuBatchIdCount=${skuBatchIds.length}]`);
      // fetch SkuBatch+Sku data from the app database
      const appSkuBatchData: SkuBatchData[] = appSkuBatchDataForSkuBatchIds;

      // if we have a count mismatch, something is wrong, and we should log out a warning
      if (appSkuBatchData.length != inventorySkuBatchData.length) {
        // implement the logic to log a message with the IDs missing from app
        // data that exist in the inventory data
        const missingIDsFromAppData: string[] = inventorySkuBatchData
          .map((data: SkuBatchData) => data.skuBatchId)
          .reduce((missing: string[], skuBatchId) => {
            const b: SkuBatchData | undefined = appSkuBatchData
              .find((val: SkuBatchData) => val.skuBatchId === skuBatchId);

            if (!b) {
              missing.push(skuBatchId);
            }

            return missing;
          }, [] as string[]);
        // For very large datasets this could cause a massive amount of text to be logged.
        logger.warn(`SkuBatchData found in inventory but missing in app data: [${missingIDsFromAppData.join(',')}]`);
      }

      // push our new sql updates into the accumulator list
      const ds: skuBatchUpdate[] = findDeltas(appSkuBatchData, inventorySkuBatchData);

      accum.push(...ds);
      return accum;
    },
    Promise.resolve([] as skuBatchUpdate[]),
  );

  logger.log(`built updates [count=${updates.length}]`);

  return updates;
}

/**
 * Updates inventory data from app SkuBatch and Sku
 */
export async function copyMissingInventoryRecordsFromSkuBatch(): Promise<void | Error> {
  logger.log('copying missing inventory records from app Sku/SkuBatch');

  // find out what skuBatchIds don't exist in inventory
  const skuBatchIdsToInsert: string[] = await getDeltas();
  logger.log(`copying new skuBatch records... [skuBatchCount=${skuBatchIdsToInsert.length}]`);
  try {
    const records = await skuBatchToRecords(skuBatchIdsToInsert);
    await Promise.all(records
      .map(async (record) => makeApiRequest(InventoryEndpoint, 'POST', record))
    );
  } catch (err) {
    logger.error(err);
    throw err;
  }

  logger.log('done updating additive data to inventory from app db');
}

/**
 * Pulls inventory and SkuBatch data and finds changes in SkuBatch data
 * that are not in the inventory data.
 */
export async function updateInventoryDeltasFromSkuBatch(): Promise<void> {
  logger.log('updating inventory from deltas in "SkuBatch" data');

  try {
    const sqlUpdates: skuBatchUpdate[] = await findChangesBetweenDatasets();

    // These put requests don't really match what is specified in the readme but there are some inconsistencies with
    //  the requirements outlined in the readme based on how records were being updated in the database version.  I
    //  would typically want to clear these things up before implementing but due to the nature of this project, it
    //  wasn't really possible.  We can discuss later if necessary.
    await Promise.all(sqlUpdates.map((update) => {
      const updateValues = update.updates.reduce((acc, field) => {
        return {
          ...acc,
          [field.field]: field.newValue,
        }
      }, {skuBatchId: update.skuBatchId});
      makeApiRequest(InventoryEndpoint, 'PUT', updateValues);
      makeApiRequest(InventoryAggregateEndpoint, 'PUT', updateValues);
    }));
  } catch (err) {
    logger.error(err);
    throw err;
  }

  logger.log('done updating inventory from deltas from app db');
}

/**
 * Primary entry point to sync SkuBatch data from the app
 * database over to the inventory database
 */
export async function sync(): Promise<void | Error> {
  try {
    await copyMissingInventoryRecordsFromSkuBatch();
    await updateInventoryDeltasFromSkuBatch();
  } catch (err) {
    logger.error('error syncing skuBatch data');
    return Promise.reject(err);
  }
}
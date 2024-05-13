import {InventoryAggregateEndpoint, InventoryEndpoint, makeApiRequest} from "../http/api.util";
import {
  copyMissingInventoryRecordsFromSkuBatch,
  findChangesBetweenDatasets,
  skuBatchToRecords,
  updateInventoryDeltasFromSkuBatch
} from "../sync-api";

jest.mock('../http/api.util', () => ({
  ...(jest.requireActual('../http/api.util')),
  makeApiRequest: jest.fn(),
}));

describe('sync-api', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('updates', () => {
    it('should calculate deltas', async () => {
      const deltas = await findChangesBetweenDatasets();
      await expect(
        findChangesBetweenDatasets(),
      ).resolves.toStrictEqual([
        {
          skuBatchId: 'sku-batch-id-5',
          updates: [
            {
              field: 'isDeleted',
              newValue: true,
            }
          ]
        },
        {
          skuBatchId: 'sku-batch-id-6',
          updates: [
            {
              field: 'isArchived',
              newValue: true,
            }
          ]
        },
      ]);
    });

    it('should make api requests', async () => {
      await updateInventoryDeltasFromSkuBatch();
      expect(makeApiRequest).toHaveBeenCalledTimes(4);
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'PUT', {isDeleted: true, skuBatchId: 'sku-batch-id-5'});
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryAggregateEndpoint, 'PUT', {isDeleted: true, skuBatchId: 'sku-batch-id-5'});
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'PUT', {isArchived: true, skuBatchId: 'sku-batch-id-6'});
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryAggregateEndpoint, 'PUT', {isArchived: true, skuBatchId: 'sku-batch-id-6'});
    });
  });

  describe('inserts', () => {
    it('should calculate new records to be inserted', async () => {
      const data = [
        {
          skuBatchId: 'sku-batch-id-1',
          skuId: 'sku-id-1',
          quantityPerUnitOfMeasure: 25,
        },
        {
          skuBatchId: 'sku-batch-id-2',
          skuId: 'sku-id-1',
          quantityPerUnitOfMeasure: 25,
        },
        {
          skuBatchId: 'sku-batch-id-3',
          skuId: 'sku-id-2',
          quantityPerUnitOfMeasure: 1,
        },
      ];

      await expect(
        skuBatchToRecords(
          data.map((d) => d.skuBatchId),
        ),
      ).resolves.toStrictEqual([
        {
          skuBatchId: 'sku-batch-id-1',
          skuId: 'sku-id-1',
          wmsId: 1234,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-1',
        },
        {
          skuBatchId: 'sku-batch-id-1',
          skuId: 'sku-id-1',
          wmsId: 1234,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-2',
        },
        {
          skuBatchId: 'sku-batch-id-1',
          skuId: 'sku-id-1',
          wmsId: 1234,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-3',
        },
        {
          skuBatchId: 'sku-batch-id-1',
          skuId: 'sku-id-1',
          wmsId: 1234,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-4',
        },
        {
          skuBatchId: 'sku-batch-id-2',
          skuId: 'sku-id-1',
          wmsId: 1235,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-1',
        },
        {
          skuBatchId: 'sku-batch-id-2',
          skuId: 'sku-id-1',
          wmsId: 1235,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-2',
        },
        {
          skuBatchId: 'sku-batch-id-2',
          skuId: 'sku-id-1',
          wmsId: 1235,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-3',
        },
        {
          skuBatchId: 'sku-batch-id-2',
          skuId: 'sku-id-1',
          wmsId: 1235,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-4',
        },
        {
          skuBatchId: 'sku-batch-id-3',
          skuId: 'sku-id-1',
          wmsId: 1236,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-1',
        },
        {
          skuBatchId: 'sku-batch-id-3',
          skuId: 'sku-id-1',
          wmsId: 1236,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-2',
        },
        {
          skuBatchId: 'sku-batch-id-3',
          skuId: 'sku-id-1',
          wmsId: 1236,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-3',
        },
        {
          skuBatchId: 'sku-batch-id-3',
          skuId: 'sku-id-1',
          wmsId: 1236,
          quantityPerUnitOfMeasure: 1,
          isArchived: false,
          isDeleted: false,
          warehouseId: 'warehouse-4',
        },
      ]);
    });

    it('should make api requests', async () => {
      await copyMissingInventoryRecordsFromSkuBatch();
      expect(makeApiRequest).toHaveBeenCalledTimes(8);
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'POST', {
        skuBatchId: 'sku-batch-id-5',
        skuId: 'sku-id-2',
        wmsId: 1238,
        quantityPerUnitOfMeasure: 1,
        isArchived: false,
        isDeleted: false,
        warehouseId: 'warehouse-1',
      });
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'POST', {
        skuBatchId: 'sku-batch-id-5',
        skuId: 'sku-id-2',
        wmsId: 1238,
        quantityPerUnitOfMeasure: 1,
        isArchived: false,
        isDeleted: false,
        warehouseId: 'warehouse-2',
      });
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'POST', {
        skuBatchId: 'sku-batch-id-5',
        skuId: 'sku-id-2',
        wmsId: 1238,
        quantityPerUnitOfMeasure: 1,
        isArchived: false,
        isDeleted: false,
        warehouseId: 'warehouse-3',
      });
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'POST', {
        skuBatchId: 'sku-batch-id-5',
        skuId: 'sku-id-2',
        wmsId: 1238,
        quantityPerUnitOfMeasure: 1,
        isArchived: false,
        isDeleted: false,
        warehouseId: 'warehouse-4',
      });
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'POST', {
        skuBatchId: 'sku-batch-id-6',
        skuId: 'sku-id-3',
        wmsId: 1239,
        quantityPerUnitOfMeasure: 1,
        isArchived: false,
        isDeleted: false,
        warehouseId: 'warehouse-1',
      });
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'POST', {
        skuBatchId: 'sku-batch-id-6',
        skuId: 'sku-id-3',
        wmsId: 1239,
        quantityPerUnitOfMeasure: 1,
        isArchived: false,
        isDeleted: false,
        warehouseId: 'warehouse-2',
      });
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'POST', {
        skuBatchId: 'sku-batch-id-6',
        skuId: 'sku-id-3',
        wmsId: 1239,
        quantityPerUnitOfMeasure: 1,
        isArchived: false,
        isDeleted: false,
        warehouseId: 'warehouse-3',
      });
      expect(makeApiRequest).toHaveBeenCalledWith(InventoryEndpoint, 'POST', {
        skuBatchId: 'sku-batch-id-6',
        skuId: 'sku-id-3',
        wmsId: 1239,
        quantityPerUnitOfMeasure: 1,
        isArchived: false,
        isDeleted: false,
        warehouseId: 'warehouse-4',
      });
    });
  });
});
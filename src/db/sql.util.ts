import {RecordWithWMS} from "../interfaces.util";

export const insertify = (record: RecordWithWMS): string => {
    const fieldsAndValues = Object.keys(record).reduce((memo, field) => {
        return {
            fields: [...memo.fields, field],
            values: [...memo.values, formatSqlValue(record[field])],
        };
    }, {fields: [] as string[], values: [] as any[]});
    return `insert into inventory (${fieldsAndValues.fields.join(', ')}) values (${fieldsAndValues.values.join(', ')})`;
}

export const getUpdateForSkuBatchRecord = (table: string, updates: string, skuBatchId: string) =>
  `update ${table} set ${updates} where sku_batch_id = '${skuBatchId}'`;

// no op that would take our db connection and execute the list of sql statements
export const queryExec = (db: any, sql: string[]): Promise<void> => Promise.resolve();

export const formatSqlValue = (v: string | number | boolean | null) => {
    if (typeof v === 'string') {
        return `'${v}'`;
    }

    return v;
};
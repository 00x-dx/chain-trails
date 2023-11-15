/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('blocks', function(table) {
        table.bigInteger('block_number').primary();
        table.string('hash', 100).notNullable().index();
        table.integer('transactions_count').notNullable();
        table.bigInteger('base_fee_per_gas');
        table.bigInteger('gas_limit').notNullable();
        table.bigInteger('gas_used').notNullable();
        table.bigInteger('size').notNullable();
        table.bigInteger('timestamp').notNullable();
        table.dateTime('time').notNullable().index();
        table.integer('month').notNullable().index();
        table.integer('year').notNullable().index();
        table.integer('day').notNullable().index();
        table.integer('hour').notNullable().index();
        table.integer('minute').notNullable().index();
        table.integer('tx_count').notNullable();
        table.bigInteger('calldata_total').notNullable();
        table.bigInteger('calldata_avg').notNullable();
        table.bigInteger('gas_total').notNullable();
        table.bigInteger('gas_avg').notNullable();
        table.bigInteger('gas_median').notNullable();
        table.integer('withdrawals_count').notNullable();
        table.decimal('withdrawals_total').notNullable();
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('blocks');
};


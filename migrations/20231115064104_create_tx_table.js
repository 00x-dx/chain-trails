/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('txs', function(table) {
        table.string('hash').primary(); // Using hash as the primary key
        table.string('block_hash').notNullable();
        table.bigInteger('block_number').notNullable().index(); // Indexed for faster queries based on block number
        table.string('from').notNullable().index();
        table.string('to').notNullable().index();
        table.bigInteger('gas').notNullable();
        table.bigInteger('gas_price').notNullable();
        table.bigInteger('nonce').notNullable();
        table.bigInteger('calldata_size');
        table.bigInteger('timestamp').notNullable();
        table.dateTime('time').notNullable().index();
        table.decimal('value');
        table.text('input', 'mediumtext');
        table.string('method_id').notNullable().index()
        table.integer('month').notNullable().index();
        table.integer('year').notNullable().index();
        table.integer('day').notNullable().index();
        table.integer('hour').notNullable().index();
        table.integer('minute').notNullable().index();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('txs');
};

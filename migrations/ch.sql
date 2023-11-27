CREATE TABLE blocks
(
    block_number UInt64,
    hash String,
    transactions_count UInt32,
    base_fee_per_gas Nullable(UInt64),
    gas_limit UInt64,
    gas_used UInt64,
    size UInt64,
    timestamp UInt64,
    time DateTime,
    month UInt8,
    year UInt16,
    day UInt8,
    hour UInt8,
    minute UInt8,
    tx_count UInt32,
    calldata_total UInt64,
    calldata_avg Float64,
    gas_total UInt64,
    gas_avg Float64,
    gas_median Float64,
    withdrawals_count UInt32,
    withdrawals_total Float64
)
ENGINE = MergeTree
ORDER BY (block_number, hash);

CREATE TABLE txs
(
    hash String,
    block_hash String,
    block_number UInt64,
    from String,
    to Nullable(String),
    gas UInt64,
    gas_price UInt64,
    nonce UInt64,
    calldata_size UInt64,
    timestamp UInt64,
    time DateTime,
    value Float64,
    input String,
    method_id String,
    year UInt16,
    month UInt8,
    day UInt8,
    hour UInt8,
    minute UInt8
)
ENGINE = MergeTree
ORDER BY (block_number, hash);
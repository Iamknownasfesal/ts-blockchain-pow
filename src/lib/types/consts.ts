// The maximum number of zeros that the hash of a block must have at the beginning in order for it to be valid
export const DIFFICULTY = 5 as const;

// The maximum number of blocks that can be stored in the chain
export const MAX_BLOCKS = 200000 as const;

// The minimum amount of time, in milliseconds, that must pass before a new block can be added to the chain
export const BLOCK_TIME = 10000 as const;

// The maximum number of transactions that can be included in a block
export const MAX_TRANSACTIONS = 10 as const;

// The reward that is given to the miner of a block
export const BLOCK_REWARD = 100 as const;

// The fee that is charged for each transaction
export const TRANSACTION_FEE = 10 as const;

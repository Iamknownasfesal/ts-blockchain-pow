import * as crypto from "crypto";
import * as fs from "fs";
import * as net from "net";
import { randomBytes } from "crypto";
import * as secp256k1 from "secp256k1";

// The maximum number of zeros that the hash of a block must have at the beginning in order for it to be valid
const DIFFICULTY = 4;

// The maximum number of blocks that can be stored in the chain
const MAX_BLOCKS = 20;

// The maximum number of nodes that can be in the network
const MAX_NODES = 5;

// The minimum amount of time, in milliseconds, that must pass before a new block can be added to the chain
const BLOCK_TIME = 30000;

// The maximum number of transactions that can be included in a block
const MAX_TRANSACTIONS = 10;

// The maximum amount of money that a user can have
const MAX_MONEY = 100;

// The fee that is charged for each transaction
const TRANSACTION_FEE = 1;

// The data structure that represents a block in the chain
class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public proof: number;
  public previousHash: string;
  public hash: string;

  constructor(
    index: number,
    transactions: Transaction[],
    proof: number,
    previousHash: string
  ) {
    this.index = index;
    this.timestamp = Date.now();
    this.transactions = transactions;
    this.proof = proof;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  // Calculates the hash of the block
  public calculateHash(): string {
    const data =
      JSON.stringify(this.transactions) +
      this.index +
      this.timestamp +
      this.proof +
      this.previousHash;
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}

// The data structure that represents a transaction in the chain
class Transaction {
  public sender: string;
  public recipient: string;
  public amount: number;

  constructor(sender: string, recipient: string, amount: number) {
    this.sender = sender;
    this.recipient = recipient;
    this.amount = amount;
  }
}

// The data structure that represents a node in the network
class Node {
  public address: string;
  public publicKey: string;

  constructor(address: string, publicKey: string) {
    this.address = address;
    this.publicKey = publicKey;
  }
}

// The data structure that represents a user in the network
export class User {
  public address: string;
  public privateKey: string;
  public publicKey: string;
  public money: number;

  constructor(
    address: string,
    privateKey: string,
    publicKey: string,
    money: number
  ) {
    this.address = address;
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.money = money;
  }

  // Sends a specified amount of money to a recipient
  public sendMoney(recipient: User, amount: number): boolean {
    if (this.money < amount + TRANSACTION_FEE) {
      return false;
    }
    this.money -= amount + TRANSACTION_FEE;

    // If recipient is not in the network, add them
    try {
      recipient.money += amount;
    } catch (e) {
      recipient.money = amount;
    }
    return true;
  }
}

// The data structure that represents a Merkle tree
class MerkleTree {
  public root: MerkleNode;

  constructor(leaves: string[]) {
    this.root = this.buildTree(leaves);
  }

  // Builds a Merkle tree from a list of leaves
  private buildTree(leaves: string[]): MerkleNode {
    if (leaves.length === 1) {
      return new MerkleNode(leaves[0]);
    }

    if (leaves.length === 0) {
      return new MerkleNode("");
    }

    const half = Math.ceil(leaves.length / 2);

    const left = this.buildTree(leaves.slice(0, half));
    const right = this.buildTree(leaves.slice(half));
    return new MerkleNode(
      crypto
        .createHash("sha256")
        .update(left.hash + right.hash)
        .digest("hex"),
      left,
      right
    );
  }

  // Verifies that a given leaf is present in the tree
  public verify(leaf: string): boolean {
    let node = this.root;
    while (node.left !== undefined && node.right !== undefined) {
      const hash = crypto
        .createHash("sha256")
        .update(node.left.hash + node.right.hash)
        .digest("hex");
      if (hash === node.hash) {
        if (node.left.hash === leaf) {
          return true;
        }
        node = node.right;
      } else {
        if (node.right.hash === leaf) {
          return true;
        }
        node = node.left;
      }
    }
    return node.hash === leaf;
  }
}

// The data structure that represents a node in a Merkle tree
class MerkleNode {
  public hash: string;
  public left: MerkleNode | undefined;
  public right: MerkleNode | undefined;

  constructor(hash: string, left?: MerkleNode, right?: MerkleNode) {
    this.hash = hash;
    this.left = left;
    this.right = right;
  }
}

// The main class that represents the blockchain
export class Blockchain {
  public chain: Block[];
  public nodes: Node[];
  public users: User[];
  public transactions: Transaction[];
  public timer: NodeJS.Timer | undefined;

  constructor() {
    this.chain = [];
    this.nodes = [];
    this.users = [];
    this.transactions = [];
  }

  // Initializes the blockchain and sets up the timer for adding blocks
  public async init(): Promise<void> {
    this.createGenesisBlock();
    this.timer = setInterval(() => this.createBlock(), BLOCK_TIME);
  }

  // Creates the first block in the chain (the genesis block)
  private createGenesisBlock(): void {
    const block = new Block(0, [], 0, "");
    block.hash = block.calculateHash();
    this.chain.push(block);
  }

  // Creates a new block and adds it to the chain
  private async createBlock(): Promise<void> {
    if (this.chain.length >= MAX_BLOCKS) {
      clearInterval(this.timer);
      return;
    }
    const proof = this.proofOfWork();
    const transactions = this.transactions.splice(0, MAX_TRANSACTIONS);
    const merkleTree = new MerkleTree(
      transactions.map((t) => JSON.stringify(t))
    );
    const previousHash = this.chain[this.chain.length - 1].hash;
    const block = new Block(
      this.chain.length,
      transactions,
      proof,
      previousHash
    );
    block.hash = block.calculateHash();
    this.chain.push(block);
    this.writeBlockToFile(block);
    this.broadcastBlock(block);
    this.consensus();
  }

  // Performs the proof of work algorithm to find a valid proof
  private proofOfWork(): number {
    let proof = 0;
    while (!this.validateProof(proof)) {
      proof++;
    }
    return proof;
  }

  // Validates a proof by checking if the hash of the block has the required number of leading zeros
  private validateProof(proof: number): boolean {
    const block = this.chain[this.chain.length - 1];
    const data =
      JSON.stringify(block.transactions) +
      block.index +
      block.timestamp +
      proof +
      block.previousHash;
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    return hash.slice(0, DIFFICULTY) === "0".repeat(DIFFICULTY);
  }

  // Sends a block to all nodes in the network
  private async broadcastBlock(block: Block): Promise<void> {
    for (const node of this.nodes) {
      const client = net.createConnection(
        { host: node.address, port: 9090 },
        () => {
          client.write(JSON.stringify({ type: "block", block }));
          client.end();
        }
      );
    }
  }

  // Verifies that a block is valid and adds it to the chain if it is
  private async verifyBlock(block: Block): Promise<void> {
    if (block.index !== this.chain.length) {
      return;
    }
    if (block.previousHash !== this.chain[this.chain.length - 1].hash) {
      return;
    }
    if (!this.validateProof(block.proof)) {
      return;
    }
    const merkleTree = new MerkleTree(
      block.transactions.map((t) => JSON.stringify(t))
    );
    if (block.hash !== block.calculateHash()) {
      return;
    }
    this.chain.push(block);
    this.writeBlockToFile(block);
  }

  // Performs the BFT consensus algorithm to determine the longest valid chain
  private async consensus(): Promise<void> {
    const chains = await this.getChainsFromNodes();
    chains.push(this.chain);
    chains.sort((a, b) => b.length - a.length);
    const longestChain = chains[0];
    if (longestChain.length > this.chain.length) {
      this.chain = longestChain;
      this.writeChainToFile(this.chain);
    }
  }

  // Retrieves the chains of all nodes in the network
  private async getChainsFromNodes(): Promise<Block[][]> {
    const chains: Block[][] = [];
    for (const node of this.nodes) {
      const client = net.createConnection(
        { host: node.address, port: 9090 },
        () => {
          client.write(JSON.stringify({ type: "get_chain" }));
        }
      );
      client.on("data", (data: Buffer) => {
        const response = JSON.parse(data.toString());
        if (response.type === "chain") {
          chains.push(response.chain);
        }
        client.end();
      });
    }
    return chains;
  }

  // Writes a block to a file in the "blocks" folder
  private writeBlockToFile(block: Block): void {
    if (!fs.existsSync("blocks")) fs.mkdirSync("blocks");
    fs.writeFileSync(`blocks/${block.index}.json`, JSON.stringify(block));
  }

  // Writes a chain to a file in the "chain" folder
  private writeChainToFile(chain: Block[]): void {
    if (!fs.existsSync("chain")) fs.mkdirSync("blocks");
    fs.writeFileSync(`chain/chain.json`, JSON.stringify(chain));
  }

  // Creates a new user and adds them to the network
  public createUser(address: string): void {
    const privateKey = randomBytes(32).toString("hex");
    const publicKey = secp256k1.publicKeyCreate(Buffer.from(privateKey, "hex"));
    this.users.push(
      new User(address, privateKey, publicKey.toString(), MAX_MONEY)
    );
  }

  // Creates a new transaction and adds it to the list of transactions
  public createTransaction(
    sender: User,
    recipient: User,
    amount: number
  ): boolean {
    if (!sender.sendMoney(recipient, amount)) {
      return false;
    }
    this.transactions.push(
      new Transaction(sender.publicKey, recipient.publicKey, amount)
    );
    return true;
  }
}

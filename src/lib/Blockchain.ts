import * as crypto from "crypto";
import * as fs from "fs";
import * as net from "net";
import { randomBytes } from "crypto";
import * as secp256k1 from "secp256k1";

// The maximum number of zeros that the hash of a block must have at the beginning in order for it to be valid
const DIFFICULTY = 5;

// The maximum number of blocks that can be stored in the chain
const MAX_BLOCKS = 200000;

// The minimum amount of time, in milliseconds, that must pass before a new block can be added to the chain
const BLOCK_TIME = 10000;

// The maximum number of transactions that can be included in a block
const MAX_TRANSACTIONS = 10;

// The reward that is given to the miner of a block
const BLOCK_REWARD = 100;

// The fee that is charged for each transaction
const TRANSACTION_FEE = 10;

// The data structure that represents a block in the chain
class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public proof: number;
  public previousHash: string;
  public hash: string;
  public minerAddress: string;
  public merkleRoot: string;

  constructor(
    index: number,
    transactions: Transaction[],
    proof: number,
    previousHash: string,
    minerAddress: string,
    timestamp: number = Date.now()
  ) {
    this.timestamp = timestamp;
    this.index = index;
    this.transactions = transactions;
    this.proof = proof;
    this.previousHash = previousHash;
    this.minerAddress = minerAddress;
    this.transactions.push(new Transaction("", minerAddress, BLOCK_REWARD));
    // Hash each transaction and use the resulting hashes as leaves of the Merkle tree
    const leaves = transactions.map((tx) => this.hashTransaction(tx));
    const tree = new MerkleTree(leaves);
    this.merkleRoot = tree.root;
    this.hash = this.calculateHash();
  }

  public hashTransaction(transaction: Transaction): string {
    const data =
      transaction.sender + transaction.recipient + transaction.amount;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  // Calculates the hash of the block
  public calculateHash(): string {
    const data =
      this.merkleRoot +
      this.index +
      this.proof +
      this.previousHash +
      this.minerAddress +
      this.timestamp;
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

class MerkleTree {
  public leaves: string[];
  public root: string;

  constructor(leaves: string[]) {
    this.leaves = leaves;
    this.root = this.calculateRoot();
  }

  // Calculates the root hash of the Merkle tree
  public calculateRoot(): string {
    if (this.leaves.length === 0) {
      return "";
    }

    let nodes: string[] = this.leaves;

    while (nodes.length > 1) {
      const newNodes: string[] = [];
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = i + 1 < nodes.length ? nodes[i + 1] : nodes[i];
        newNodes.push(this.hashPair(left, right));
      }
      nodes = newNodes;
    }

    return nodes[0];
  }

  // Hashes a pair of nodes together
  public hashPair(left: string, right: string): string {
    const data = left + right;
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}

// The main class that represents the blockchain
export class Blockchain {
  public chain: Block[];
  public nodes: Node[];
  public users: User[];
  public transactions: Transaction[];
  public timer: NodeJS.Timer | undefined;
  public minerAddress: string;

  constructor(minerAddress: string) {
    this.chain = [];
    this.nodes = [];
    this.users = [];
    this.transactions = [];
    this.minerAddress = minerAddress;
  }

  // Initializes the blockchain and sets up the timer for adding blocks
  public async init(): Promise<void> {
    this.createGenesisBlock();
    // If there is blocks folder, load the blocks from there
    if (fs.existsSync("blocks")) {
      const files = fs.readdirSync("blocks");
      // sort files by file names
      files.sort((a, b) => {
        const aIndex = parseInt(a.split(".")[0]);
        const bIndex = parseInt(b.split(".")[0]);
        return aIndex - bIndex;
      });
      for (const file of files) {
        const data = fs.readFileSync("blocks/" + file, "utf8");
        const block: Block = JSON.parse(data);
        const verify = this.verifyBlock(block);

        if (!verify) {
          console.log("Block " + block.index + " is invalid");
          break;
        }

        for (const transaction of block.transactions) {
          this.createUser(transaction.sender);
          this.createUser(transaction.recipient);

          if (transaction.sender !== "")
            this.users.find(
              (user) => user.address === transaction.sender
            )!.money -= transaction.amount;

          this.users.find(
            (user) => user.address === transaction.recipient
          )!.money += transaction.amount;
        }

        console.log("Loaded block " + block.index);
      }
    }
    this.timer = setInterval(() => this.createBlock(), BLOCK_TIME);
  }

  // Creates the first block in the chain (the genesis block)
  private createGenesisBlock(): void {
    const block = new Block(0, [], 0, "", "Genesis", 0);
    block.hash = block.calculateHash();
    this.chain.push(block);
  }

  // Creates a new block and adds it to the chain
  private async createBlock(): Promise<void> {
    if (this.chain.length >= MAX_BLOCKS) {
      clearInterval(this.timer!);
      return;
    }
    const proof = this.proofOfWork(
      this.chain[this.chain.length - 1].proof,
      this.chain[this.chain.length - 1].hash,
      this.minerAddress
    );
    const transactions = this.transactions.splice(0, MAX_TRANSACTIONS);
    const previousHash = this.chain[this.chain.length - 1].hash;
    const block = new Block(
      this.chain.length,
      transactions,
      proof,
      previousHash,
      this.minerAddress
    );
    block.hash = block.calculateHash();
    this.chain.push(block);
    this.writeBlockToFile(block);
    this.broadcastBlock(block);
    this.consensus();

    console.log(this.chain.length);

    let miner = this.users.find((user) => user.address === this.minerAddress);

    if (miner === undefined) this.createUser(this.minerAddress);

    miner = this.users.find((user) => user.address === this.minerAddress);
    if (miner !== undefined) miner.money += BLOCK_REWARD;

    this.users = [
      ...this.users.filter((user) => user.address !== this.minerAddress),
      miner as User,
    ];
  }

  public proofOfWork(
    lastProof: number,
    lastHash: string,
    minerAddress: string
  ): number {
    let proof = 0;
    let hash = "";

    while (hash.substring(0, DIFFICULTY) !== Array(DIFFICULTY + 1).join("0")) {
      proof++;
      hash = crypto
        .createHash("sha256")
        .update(lastProof + lastHash + proof + minerAddress)
        .digest("hex");
    }

    return proof;
  }

  // Validates a proof by checking if the hash of the block has the required number of leading zeros
  private validateProof(block: Block): boolean {
    const hash = crypto
      .createHash("sha256")
      .update(
        this.chain[this.chain.length - 1].proof +
          this.chain[this.chain.length - 1].hash +
          block.proof +
          block.minerAddress
      )
      .digest("hex");

    console.log(hash);
    return hash.substring(0, DIFFICULTY) === Array(DIFFICULTY + 1).join("0");
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
  private verifyBlock(block: Block): boolean {
    if (block.index !== this.chain.length) {
      console.log("Index is not correct");
      return false;
    }
    if (block.previousHash !== this.chain[this.chain.length - 1].hash) {
      console.log(block.previousHash, this.chain[this.chain.length - 1].hash);
      console.log("Previous hash is not correct");
      return false;
    }
    if (!this.validateProof(block)) {
      console.log("Proof is not correct");
      return false;
    }
    if (
      block.hash !==
      crypto
        .createHash("sha256")
        .update(
          block.merkleRoot +
            block.index +
            block.proof +
            block.previousHash +
            block.minerAddress +
            block.timestamp
        )
        .digest("hex")
    ) {
      console.log("Hash is not correct");
      return false;
    }
    this.chain.push(block);
    this.writeBlockToFile(block);

    return true;
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

    if (this.users.find((user) => user.address === address) !== undefined)
      return;

    this.users.push(new User(address, privateKey, publicKey.toString(), 0));
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

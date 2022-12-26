import { Block } from "./Block";
import { AccountManager } from "./AccountManager";
import { Transaction } from "./Transaction";
import * as ellip from "elliptic";
import * as crypto from "crypto";
import * as fs from "fs";
import { BLOCK_REWARD, BLOCK_TIME, DIFFICULTY } from "./consts";

export class Blockchain {
  public accountManager: AccountManager;
  public minerPubKey: string;
  public minerPrivKey: string;
  public chain: Block[] = [];
  public txPool: Transaction[] = [];
  private currentlyMining: boolean = false;
  private lastMineTime: number = 0;

  constructor(minerPubKey: string, minerPrivKey: string) {
    this.accountManager = new AccountManager();
    this.minerPubKey = minerPubKey;
    this.minerPrivKey = minerPrivKey;
  }

  public async init(): Promise<void> {
    this.createGenesisBlock();

    // If there is blocks folder, load the blocks from there
    if (fs.existsSync("./blocks")) {
      const files = fs.readdirSync("./blocks");
      // sort files
      files.sort((a, b) => {
        const aNum = parseInt(a.split(".")[0]);
        const bNum = parseInt(b.split(".")[0]);
        return aNum - bNum;
      });
      files.forEach((file) => {
        const block: Block = JSON.parse(
          fs.readFileSync(`./blocks/${file}`, "utf8")
        );
        const blockClass = new Block(
          [
            ...block.transactions.map(
              (transaction: Transaction) =>
                new Transaction(
                  transaction.senderPubKey,
                  transaction.receiverPubKey,
                  transaction.volume,
                  transaction.gas,
                  transaction.timestamp,
                  transaction.signature
                )
            ),
          ],
          block.timestamp,
          block.prevHash,
          block.miner,
          block.proof,
          block.difficulty,
          block.height,
          block.signature
        );
        const verified = this.verifyBlock(blockClass);
        if (verified) {
          console.log("Adding block to chain -> " + blockClass.height);
          this.chain.push(blockClass);
          this.executeBlockTransactions(blockClass);
        }

        // If the block is not verified, delete it and all the blocks after it
        else {
          process.exit(1);
        }
      });
    } else {
      fs.mkdirSync("./blocks");
    }

    console.log(this.accountManager.accounts);

    // Start the timer
    setInterval(() => {
      this.createBlock();
    }, BLOCK_TIME);
  }

  public addTransaction(transaction: Transaction): boolean {
    var EC = new ellip.ec("p256");
    const key = EC.keyFromPublic(transaction.senderPubKey, "hex");
    if (
      !key.verify(
        transaction.hashTransaction(),
        transaction.signature as string
      )
    ) {
      console.log("Transaction is not valid");
      return false;
    } else {
      if (transaction.volume <= 0) {
        console.log("Transaction volume is not valid");
        return false;
      }
      this.txPool.push(transaction);
      return true;
    }
  }

  public getBalance(address: string) {
    if (this.accountManager.getBalance(address)) {
      return this.accountManager.getBalance(address);
    } else {
      return 0;
    }
  }

  private async createBlock(): Promise<void> {
    if (this.currentlyMining) return;
    if (this.lastMineTime + BLOCK_TIME > Date.now()) return;

    this.currentlyMining = true;
    this.lastMineTime = Date.now();

    const proof = this.proofOfWork(
      this.chain[this.chain.length - 1].proof,
      this.chain[this.chain.length - 1].hashBlock(),
      this.minerPubKey
    );
    this.txPool.push(
      new Transaction("Genesis", this.minerPubKey, BLOCK_REWARD, 0)
    );
    const block = new Block(
      this.txPool,
      Date.now(),
      this.chain[this.chain.length - 1].hashBlock(),
      this.minerPubKey,
      proof,
      DIFFICULTY,
      this.chain.length
    );
    block.sign(this.minerPrivKey);
    this.chain.push(block);
    this.writeBlockToDisk(block);
    this.executeBlockTransactions(block);
    this.txPool = [];
    this.currentlyMining = false;
  }

  private proofOfWork(
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

  private validateProof(block: Block): boolean {
    const hash = crypto
      .createHash("sha256")
      .update(
        this.chain[this.chain.length - 1].proof +
          this.chain[this.chain.length - 1].currentHash +
          block.proof +
          block.miner
      )
      .digest("hex");

    return hash.substring(0, DIFFICULTY) === Array(DIFFICULTY + 1).join("0");
  }

  private executeBlockTransactions(block: Block) {
    block.transactions.forEach((transaction) => {
      this.accountManager.executeTransaction(transaction);
    });
  }

  private writeBlockToDisk(block: Block) {
    const blockExists = this.checkIfBlockExists(block);
    if (!blockExists) {
      fs.writeFileSync(`./blocks/${block.height}.json`, JSON.stringify(block));

      console.log("Block written to disk -> ", block.height);
      return;
    }

    console.log("Block already exists -> ", block.currentHash);
  }

  private checkIfBlockExists(block: Block) {
    const blockExists = fs.existsSync
      ? fs.existsSync(`./blocks/${block.height}.json`)
      : fs.existsSync(`./blocks/${block.height}.json`);
    return blockExists;
  }

  private verifyBlock(block: Block): boolean {
    var EC = new ellip.ec("p256");
    const key = EC.keyFromPublic(block.miner, "hex");
    console.log("Verifying block -> " + block.height);
    if (!key.verify(block.hashBlock(), block.signature as string)) {
      console.log("Block is not valid");
      return false;
    }

    // Check if the proof of work is valid
    if (!this.validateProof(block)) {
      console.log("Block proof of work is not valid");
      return false;
    }

    // Check if the block is valid
    if (block.prevHash !== this.chain[this.chain.length - 1].currentHash) {
      console.log("Block is not valid");
      return false;
    }

    // Check if the transactions are valid
    for (let i = 0; i < block.transactions.length; i++) {
      const transaction = block.transactions[i];
      const EC = new ellip.ec("p256");
      if (
        transaction.senderPubKey === "Genesis" &&
        transaction.volume === BLOCK_REWARD
      )
        continue;

      const key = EC.keyFromPublic(transaction.senderPubKey, "hex");
      if (
        !key.verify(
          transaction.hashTransaction(),
          transaction.signature as string
        )
      ) {
        console.log("Transaction is not valid");
        return false;
      }
    }

    return true;
  }

  private createGenesisBlock(): void {
    const genesisBlock = new Block(
      [],
      0,
      "0",
      "Genesis",
      0,
      DIFFICULTY,
      0,
      "Genesis"
    );
    this.chain.push(genesisBlock);
  }
}

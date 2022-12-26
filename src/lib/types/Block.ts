import * as crypto from "crypto";
import { Transaction } from "./Transaction";
import { MerkleTree } from "./MerkleTree";
import * as ellip from "elliptic";

export class Block {
  public signature: string | undefined;
  public transactions: Transaction[];
  public timestamp: number;
  public prevHash: string;
  public currentHash: string;
  public miner: string;
  public merkleTree: string;
  public proof: number;
  public difficulty: number;
  public height: number;

  constructor(
    transactions: Transaction[],
    timestamp: number,
    prevHash: string,
    miner: string,
    proof: number,
    difficulty: number,
    height: number,
    signature: string | undefined = undefined
  ) {
    this.transactions = transactions;
    this.timestamp = timestamp;
    this.prevHash = prevHash;
    this.miner = miner;
    const leaves = transactions.map((transaction) =>
      transaction.hashTransaction()
    );
    const merkleTreeInstance = new MerkleTree(leaves);
    this.merkleTree = merkleTreeInstance.root;
    this.proof = proof;
    this.difficulty = difficulty;
    this.height = height;
    this.currentHash = this.hashBlock();
    this.signature = signature;
  }

  private bytesToHex(bytes: Uint8Array) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
      var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
      hex.push((current >>> 4).toString(16));
      hex.push((current & 0xf).toString(16));
    }
    return hex.join("");
  }

  public hashBlock(): string {
    return crypto
      .createHash("sha256")
      .update(
        this.transactions.toString() +
          this.timestamp.toString() +
          this.prevHash +
          this.miner +
          this.merkleTree +
          this.proof.toString() +
          this.difficulty.toString() +
          this.height.toString()
      )
      .digest("hex");
  }

  public sign(privateKey: string) {
    var EC = ellip.ec;
    var ec = new EC("p256");
    var key = ec.keyFromPrivate(privateKey, "hex");
    var signature = key.sign(this.currentHash);
    this.signature = this.bytesToHex(Buffer.from(signature.toDER()));

    return this.signature;
  }
}

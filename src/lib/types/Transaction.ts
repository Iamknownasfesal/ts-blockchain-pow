import * as ellip from "elliptic";
import * as crypto from "crypto";
import { TRANSACTION_FEE } from "./consts";

export class Transaction {
  public senderPubKey: string;
  public receiverPubKey: string;
  public volume: number;
  public gas: number;
  public signature: string | undefined;
  public timestamp: number;

  constructor(
    senderPubKey: string,
    receiverPubKey: string,
    volume: number,
    gas: number = TRANSACTION_FEE,
    timestamp: number = Date.now(),
    signature: string | undefined = undefined
  ) {
    this.senderPubKey = senderPubKey;
    this.receiverPubKey = receiverPubKey;
    this.volume = volume;
    this.gas = gas;
    this.timestamp = timestamp;
    this.signature = signature;
  }

  private toHexFromUint8Array(arr: Uint8Array): string {
    return Buffer.from(arr).toString("hex");
  }

  public hashTransaction(): string {
    return crypto
      .createHash("sha256")
      .update(
        this.senderPubKey +
          this.receiverPubKey +
          this.volume.toString() +
          this.gas.toString() +
          this.timestamp.toString()
      )
      .digest("hex");
  }

  public sign(privateKey: string) {
    const hash = this.hashTransaction();

    const EC = new ellip.ec("p256");
    const key = EC.keyFromPrivate(privateKey, "hex");
    const signature = key.sign(hash);
    this.signature = this.toHexFromUint8Array(Buffer.from(signature.toDER()));
    return this;
  }
}

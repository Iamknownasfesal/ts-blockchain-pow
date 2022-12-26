import { Transaction } from "./Transaction";

export class WalletOut {
  public privKey: string;
  public pubKey: string;

  constructor(privKey: string, pubKey: string) {
    this.privKey = privKey;
    this.pubKey = pubKey;
  }

  public TryToSend(volume: number, receiverPubKey: string) {
    const transaction = new Transaction(this.pubKey, receiverPubKey, volume);
    const signedTransaction = transaction.sign(this.privKey);
    return signedTransaction;
  }
}

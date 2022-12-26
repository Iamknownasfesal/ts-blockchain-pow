export class WalletIn {
  public money: number;
  public publicKey: string;

  constructor(money: number, publicKey: string) {
    this.money = money;
    this.publicKey = publicKey;
  }
}

import { Transaction } from "./Transaction";
import { WalletIn } from "./WalletIn";

export class AccountManager {
  public accounts: WalletIn[];

  constructor(accounts: WalletIn[] = []) {
    this.accounts = accounts;
  }

  public checkIfAccountExists(publicKey: string) {
    for (let i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i].publicKey === publicKey) {
        return true;
      }
    }
    return false;
  }

  public addAccount(account: WalletIn) {
    this.accounts.push(account);
  }

  public getBalance(publicKey: string) {
    for (let i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i].publicKey === publicKey) {
        return this.accounts[i].money;
      }
    }
    return null;
  }

  public checkIfAccountHasEnoughMoney(publicKey: string, amount: number) {
    for (let i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i].publicKey === publicKey) {
        if (this.accounts[i].money >= amount) {
          return true;
        }
      }
    }
    return false;
  }

  public executeTransaction(transaction: Transaction) {
    // Check if sender has enough money or sender exists or receiver exists if not create receiver

    if (this.checkIfAccountExists(transaction.senderPubKey)) {
      if (
        this.checkIfAccountHasEnoughMoney(
          transaction.senderPubKey,
          transaction.volume
        )
      ) {
        if (this.checkIfAccountExists(transaction.receiverPubKey)) {
          this.accounts.forEach((account) => {
            if (account.publicKey === transaction.senderPubKey) {
              account.money -= transaction.volume;
            }
            if (account.publicKey === transaction.receiverPubKey) {
              account.money += transaction.volume;
            }
          });
        } else {
          this.accounts.push(
            new WalletIn(transaction.volume, transaction.receiverPubKey)
          );
        }
      } else {
        throw new Error("Sender does not have enough money");
      }
    } else {
      if (transaction.senderPubKey === "Genesis") {
        // if receiver exists add money to receiver
        if (this.checkIfAccountExists(transaction.receiverPubKey)) {
          this.accounts.forEach((account) => {
            if (account.publicKey === transaction.receiverPubKey) {
              account.money += transaction.volume;
            }
          });
        } else {
          // if receiver does not exist create receiver
          this.accounts.push(
            new WalletIn(transaction.volume, transaction.receiverPubKey)
          );
        }
      } else {
        console.log("Sender does not exist");
      }
    }
  }
}

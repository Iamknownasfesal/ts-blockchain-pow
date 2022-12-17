import { Blockchain, User } from "./lib/Blockchain";
import { RPCManager } from "./lib/RPCManager";

const blockchain = new Blockchain("Miner023402356348623406234862346420");
blockchain.init();

const rpcManager = new RPCManager();
rpcManager.start();

rpcManager.on(
  "createTransaction",
  (params: any[], callback: (result: any) => void) => {
    const senderAddress = params[0];
    const recipientAddress = params[1];
    const amount = params[2];
    const sender = blockchain.users.find((u) => u.address === senderAddress);
    let recipient = blockchain.users.find(
      (u) => u.address === recipientAddress
    );

    if (!sender) {
      callback(new Error("User not found"));
      return;
    }

    if (!recipient) {
      // Create user
      blockchain.createUser(recipientAddress);
      recipient = blockchain.users.find((u) => u.address === recipientAddress);
    }

    if (
      blockchain.createTransaction(sender as User, recipient as User, amount)
    ) {
      callback(null);
    } else {
      callback(new Error("Transaction failed"));
    }
  }
);

rpcManager.on("getChain", (params: any[], callback: (result: any) => void) => {
  callback(blockchain.chain);
});

rpcManager.on(
  "getBalance",
  (params: any[], callback: (result: any) => void) => {
    const address = params[0];
    const user = blockchain.users.find((u) => u.address === address);
    if (!user) {
      callback(new Error("User not found"));
      return;
    }
    callback(user.money);
  }
);

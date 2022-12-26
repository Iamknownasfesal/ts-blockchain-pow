import { Blockchain } from "./lib/types/Blockchain";
import { RPCManager } from "./lib/RPCManager";
import { Transaction } from "./lib/types/Transaction";

const publicKey =
  "0471bffa8e38855631ea0647cbc1aa3f2dbdb560435a17602031f0c854cd3b2e5cecd6d791feb91ab3f6980ec3b599e4fe70488e848b4fb179c45117ab2fd85792";
const privateKey =
  "6b987d00630ef44e24da291c2431be800faa31ef325290c094e03e4474d1768b";

console.log("Private key: ", privateKey);
console.log("Public key: ", publicKey);

const blockchain = new Blockchain(publicKey, privateKey);
blockchain.init();
console.log("Blockchain initialized successfully");

const rpcManager = new RPCManager();
rpcManager.start();
console.log("RPC server started successfully");

rpcManager.on(
  "addTransaction",
  (params: any[], callback: (result: any) => void) => {
    const transaction = new Transaction(
      params[0].senderPubKey,
      params[0].receiverPubKey,
      params[0].volume,
      undefined,
      params[0].timestamp,
      params[0].signature
    );
    if (blockchain.addTransaction(transaction)) {
      callback("Transaction created successfully");
    } else {
      callback("Transaction failed");
    }
  }
);

rpcManager.on(
  "getBalance",
  (params: any[], callback: (result: any) => void) => {
    callback(blockchain.getBalance(params[0]));
  }
);

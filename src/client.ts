import { RPCClient as rpcClient } from "./lib/RPCClient";
import { WalletOut } from "./lib/types/WalletOut";

async function testRpc() {
  const publicKey =
    "0471bffa8e38855631ea0647cbc1aa3f2dbdb560435a17602031f0c854cd3b2e5cecd6d791feb91ab3f6980ec3b599e4fe70488e848b4fb179c45117ab2fd85792";
  const privateKey =
    "6b987d00630ef44e24da291c2431be800faa31ef325290c094e03e4474d1768b";
  const account = new WalletOut(privateKey, publicKey);

  await rpcClient.request(
    "getBalance",
    [account.pubKey],
    (error: Error | null, result: any) => {
      if (error) {
        console.error(error.message);
      } else {
        console.log(result);
      }
    }
  );

  await rpcClient.request(
    "addTransaction",
    [account.TryToSend(150, "0")],
    (error: Error | null, result: any) => {
      if (error) {
        console.error(error.message);
      } else {
        console.log(result);
      }
    }
  );
}

testRpc();

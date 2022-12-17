import { RPCClient as rpcClient } from "./lib/RPCClient";
// Create a new user

async function testRpc() {
  await rpcClient.request(
    "createTransaction",
    ["Miner023402356348623406234862346420", "Bob", 10],
    (error: Error | null) => {
      if (error) {
        console.error(error.message);
      } else {
        console.log("Transaction created successfully");
      }
    }
  );

  await rpcClient.request(
    "getBalance",
    ["Bob"],
    (error: Error | null, result: any) => {
      if (error) {
        console.error(error.message);
      } else {
        console.log(result);
      }
    }
  );

  /*
  await rpcClient.request(
    "getChain",
    [],
    (error: Error | null, result: any) => {
      if (error) {
        console.error(error.message);
      } else {
        console.log(result);
      }
    }
  );
  */
}

testRpc();

import { RPCClient } from "./lib/RPCClient";

const rpcClient = new RPCClient();

// Create a new user

async function testRpc() {
  /*
  await rpcClient.request("createUser", ["Alice"], (error: Error | null) => {
    if (error) {
      console.error(error.message);
    } else {
      console.log("User created successfully");
    }
  });
  */
  await rpcClient.request(
    "createTransaction",
    ["Alice", "Bob", 10],
    (error: Error | null) => {
      if (error) {
        console.error(error.message);
      } else {
        console.log("Transaction created successfully");
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

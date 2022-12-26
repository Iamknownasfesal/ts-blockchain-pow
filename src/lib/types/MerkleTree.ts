import * as crypto from "crypto";

export class MerkleTree {
  public leaves: string[];
  public root: string;

  constructor(leaves: string[]) {
    this.leaves = leaves;
    this.root = this.calculateRoot();
  }

  // Calculates the root hash of the Merkle tree
  public calculateRoot(): string {
    if (this.leaves.length === 0) {
      return "";
    }

    let nodes: string[] = this.leaves;

    while (nodes.length > 1) {
      const newNodes: string[] = [];
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = i + 1 < nodes.length ? nodes[i + 1] : nodes[i];
        newNodes.push(this.hashPair(left, right));
      }
      nodes = newNodes;
    }

    return nodes[0];
  }

  // Hashes a pair of nodes together
  public hashPair(left: string, right: string): string {
    const data = left + right;
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}

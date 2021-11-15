import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import base58 from "bs58";
require("dotenv").config();

const cluster = process.env.CLUSTER_ENDPOINT || "localhost:8899";
const mintAccount = process.env.MINT_ACCOUNT || "";
const connection = new Connection(cluster);

const main = () => {
  const subscriptionId = connection.onProgramAccountChange(
    TOKEN_PROGRAM_ID,
    (keyedAccountInfo, context) => {
      const accountId = keyedAccountInfo.accountId.toBase58();
      const accountInfo = AccountLayout.decode(
        keyedAccountInfo.accountInfo.data
      );
      console.log({
        subscriptionId,
        accountId,
        accountInfo,
        owner: base58.encode(accountInfo.owner),
        mint: base58.encode(accountInfo.mint),
      });
      console.log({ context });
    },
    "finalized",
    [
      { dataSize: AccountLayout.span },
      {
        memcmp: {
          offset: 0,
          bytes: mintAccount,
        },
      },
    ]
  );
};

main();

import { Connection, Context, KeyedAccountInfo } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout, u64 } from "@solana/spl-token";
import base58 from "bs58";
import * as amqp from "amqplib";
require("dotenv").config();

const main = async () => {
  const cluster = process.env.CLUSTER_ENDPOINT || "localhost:8899";
  const mintAccount = process.env.MINT_ACCOUNT || "";
  const mqEndpoint = process.env.MQ_ENDPOINT || "amqp://127.0.0.1";
  const connection = new Connection(cluster);

  const accountFilter = [
    { dataSize: AccountLayout.span },
    {
      memcmp: {
        offset: 0,
        bytes: mintAccount,
      },
    },
  ];
  const queueConnection = await amqp.connect(mqEndpoint);
  const channel = await queueConnection.createChannel();
  const exchange = "Account_Changed";

  channel.assertExchange(exchange, "direct", { durable: true });
  const sendMessage = (accountInfo: KeyedAccountInfo, ctx: Context): void => {
    const decodedData = AccountLayout.decode(accountInfo.accountInfo.data);
    const messageBufferArray = [
      decodedData.owner,
      decodedData.amount,
      Buffer.from(`${ctx.slot}`),
    ];
    const message = Buffer.concat(messageBufferArray);
    channel.publish(exchange, mintAccount, message);
  };

  const subscriptionId = connection.onProgramAccountChange(
    TOKEN_PROGRAM_ID,
    sendMessage,
    "finalized",
    accountFilter
  );
};

main();

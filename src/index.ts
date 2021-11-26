import {
  Connection,
  Context,
  KeyedAccountInfo,
  PublicKey,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { publicKey, struct, u64, str } from "@project-serum/borsh";
import * as amqp from "amqplib";
import { amountDecoder, publickeyDecoder } from "./utils/decode";
import { serialize, BinaryReader, BinaryWriter } from "borsh";
import base58 from "bs58";

require("dotenv").config();

class NewMessage {
  owner;
  amount;
  slot;
  constructor(data: { owner: string; amount: string; slot: number }) {
    this.owner = data.owner;
    this.amount = data.amount;
    this.slot = data.slot;
  }
}

const MSG_SCHEMA = new Map([
  [
    NewMessage,
    {
      kind: "struct",
      fields: [
        ["owner", "string"],
        ["amount", "string"],
        ["slot", "u32"],
      ],
    },
  ],
]);

const main = async () => {
  const cluster = process.env.CLUSTER_ENDPOINT || "localhost:8899";
  const mintAccount = process.env.MINT_ACCOUNT || "";
  const mqEndpoint = process.env.MQ_ENDPOINT || "amqp://127.0.0.1";
  const connection = new Connection(cluster);

  console.log(mqEndpoint);

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
    const decoded = AccountLayout.decode(accountInfo.accountInfo.data);
    const data = {
      owner: publickeyDecoder(decoded.owner),
      amount: amountDecoder(decoded.amount),
      slot: ctx.slot,
    };
    console.log(data);

    const msg = Buffer.from(serialize(MSG_SCHEMA, new NewMessage(data)));

    channel.publish(exchange, mintAccount, msg);
  };

  console.log(`connected to ${mqEndpoint}`);
  console.log(`Subscribe to mint account ${mintAccount}`);

  const subscriptionId = connection.onProgramAccountChange(
    TOKEN_PROGRAM_ID,
    sendMessage,
    "finalized",
    accountFilter
  );
};

main();

import base58 from "bs58";
import { u64 } from "@solana/spl-token";

export const publickeyDecoder = (publickey: Buffer): string => {
  return base58.encode(publickey);
};

export const amountDecoder = (amount: Buffer): string => {
  return u64.fromBuffer(amount).toString();
};

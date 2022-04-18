import { struct, u8, seq, u16, offset } from '@solana/buffer-layout';
import { AccountMeta, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants';
import {
  TokenInvalidInstructionDataError,
  TokenInvalidInstructionKeysError,
  TokenInvalidInstructionProgramError,
  TokenInvalidInstructionTypeError
} from '../errors';
import { TokenInstruction  } from './types';
import { ExtensionType, TYPE_SIZE } from '../extensions';

export interface ReallocateInstructionData {
  instruction: TokenInstruction.Reallocate;
  extensionTypes: number[];
}


export const reallocateInstructionData = struct<ReallocateInstructionData>([
  u8('instruction'),
  seq(u16(), offset(u8('instruction'), -1), 'extensionTypes'),
]);

/**
 * Construct a reallocate instruction
 * 
 * @param account,
 * @param payer,
 * @param owner,
 * @param signers,
 * @param extensionTypes,
 * @param programId,
 * 
 * @return Instruction to add to a transaction
 */
export function createReallocateInstruction(
  account: PublicKey,
  payer: PublicKey,
  owner: PublicKey,
  signers: PublicKey[],
  extensionTypes:  ExtensionType[],
  programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
  const keys = [
    { pubkey: account, isSigner: false, isWritable: true },
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
  ];
  for (const signer of signers) {
    keys.push({ pubkey: signer, isSigner: false, isWritable: false });
  }

  const data = Buffer.alloc(1 + TYPE_SIZE * extensionTypes.length);
  reallocateInstructionData.encode(
    {
      instruction: TokenInstruction.Reallocate,
      extensionTypes: extensionTypes.map((extensionType) => {
        const uint16 = extensionType & 0xFFFF;
        return uint16;
      }),
    },
    data
  )
  
  return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid Reallocate instruction */
export interface DecodedReallocateInstruction {
  programId: PublicKey;
  keys: {
    account: AccountMeta;
    payer: AccountMeta;
    owner: AccountMeta;
    signers: AccountMeta[];
  };
  data: {
    instruction: TokenInstruction.Reallocate;
    extensionTypes: ExtensionType[];
  };
}

/**
 * Decode a Reallocate instruction and validate it
 * 
 * @param instruction Transaction instruction to decode
 * @param programId SPL Token program account
 * 
 * @return Decoded, valid instruction
 */
export function decodeReallocateInstruction(
  instruction: TransactionInstruction,
  programId: PublicKey
): DecodedReallocateInstruction {
  if(!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
  if(instruction.data.length !== reallocateInstructionData.span)
    throw new TokenInvalidInstructionDataError();

  const {
    keys: { account, payer, owner, signers },
    data,
  } = decodeReallocateInstructionUnchecked(instruction);
  if (data.instruction !== TokenInstruction.Reallocate)
    throw new TokenInvalidInstructionTypeError();
  if (!account) throw new TokenInvalidInstructionKeysError();
  if (!payer) throw new TokenInvalidInstructionKeysError();
  if (!owner) throw new TokenInvalidInstructionKeysError();
  if (!signers) throw new TokenInvalidInstructionKeysError();

  return {
    programId,
    keys: {
      account,
      payer,
      owner,
      signers
    },
    data,
  }
}

/** A decoded, non-validated Reallocate instruction */
export interface DecodedReallocateInstructionUnchecked {
  programId: PublicKey;
  keys: {
    account: AccountMeta | undefined;
    payer: AccountMeta | undefined;
    owner: AccountMeta | undefined;
    signers: AccountMeta[];
  };
  data: {
    instruction: number;
    extensionTypes: ExtensionType[];
  };
}

/**
 * Decode a Reallocate instruction without validating it
 * 
 * @param instruction Transaction instruction to decode
 * 
 * @return Decoded, non-validated instruction
 */
export function decodeReallocateInstructionUnchecked({
  programId,
  keys: [account, payer, owner, ...signers],
  data,
}: TransactionInstruction): DecodedReallocateInstructionUnchecked {
  const { instruction, extensionTypes } = reallocateInstructionData.decode(data);

  return {
    programId,
    keys: {
      account,
      payer,
      owner,
      signers,
    },
    data: {
      instruction,
      extensionTypes
    }
  };
}
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import {
  sendAndConfirmTransaction,
  Connection,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction
} from '@solana/web3.js';
import {
  createAccount,
  createReallocateInstruction,
  createInitializeMintInstruction,
  createInitializeMintCloseAuthorityInstruction,
  ExtensionType,
  getMintLen,
} from '../../src';
import { TEST_PROGRAM_ID, newAccountWithLamports, getConnection } from "../common";

const TEST_TOKEN_DECIMALS = 2;
describe('reallocate', () => {
  let connection: Connection;
  let payer: Signer;
  let mint: PublicKey;
  let mintAuthority: Keypair;
  let closeAuthority: Keypair;
  let account: PublicKey;
  let owner: PublicKey;
  before(async () => {
    connection = await getConnection();
    payer = await newAccountWithLamports(connection, 1000000000);
    owner = payer.publicKey;
    mintAuthority = Keypair.generate();
    closeAuthority = Keypair.generate();
  });
  beforeEach(async () => {
    const mintKeypair = Keypair.generate();
    mint = mintKeypair.publicKey;
    const extensions = [ExtensionType.MintCloseAuthority];
    const mintLen = getMintLen(extensions);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports,
        programId: TEST_PROGRAM_ID,
      }),
      createInitializeMintCloseAuthorityInstruction(mint, closeAuthority.publicKey, TEST_PROGRAM_ID),
      createInitializeMintInstruction(mint, TEST_TOKEN_DECIMALS, mintAuthority.publicKey, null, TEST_PROGRAM_ID)
    );

    await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair], undefined);
  });
  it('failsWithWrongAccountType', async () => {
    const EXTENSIONS = [ExtensionType.MintCloseAuthority, ExtensionType.ConfidentialTransferMint];
    account = await createAccount(connection, payer, mint, owner, undefined, undefined, TEST_PROGRAM_ID);
    const transaction = new Transaction().add(
      createReallocateInstruction(account, payer.publicKey, owner, [], EXTENSIONS)
    );
    await sendAndConfirmTransaction(connection, transaction, [payer], undefined);
    const mintLen = getMintLen(EXTENSIONS);
    const accountInfo = await connection.getAccountInfo(account);
    expect(accountInfo?.data.length).to.be.eql(mintLen);
  })
})
import { Keypair } from '@solana/web3.js';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { createInitializeMintCloseAuthorityInstruction, TOKEN_2022_PROGRAM_ID, createReallocateInstruction, ExtensionType } from '../../src';

chai.use(chaiAsPromised);

describe('spl-token-2022 instructions', () => {
    it('InitializeMintCloseAuthority', () => {
        const ix = createInitializeMintCloseAuthorityInstruction(
            Keypair.generate().publicKey,
            Keypair.generate().publicKey,
            TOKEN_2022_PROGRAM_ID
        );
        expect(ix.programId).to.eql(TOKEN_2022_PROGRAM_ID);
        expect(ix.keys).to.have.length(1);
    });

    it('Reallocate', () => {
        const ix = createReallocateInstruction(
            Keypair.generate().publicKey,
            Keypair.generate().publicKey,
            Keypair.generate().publicKey,
            [Keypair.generate().publicKey, Keypair.generate().publicKey],
            [ExtensionType.MintCloseAuthority],
            TOKEN_2022_PROGRAM_ID
        );
        expect(ix.programId).to.eql(TOKEN_2022_PROGRAM_ID);
        expect(ix.keys).to.have.length(7);
    });
});

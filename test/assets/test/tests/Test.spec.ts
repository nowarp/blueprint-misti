import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Test } from '../wrappers/Test';
import '@ton/test-utils';

describe('Test', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let test: SandboxContract<Test>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        test = blockchain.openContract(await Test.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await test.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: test.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and test are ready to use
    });
});

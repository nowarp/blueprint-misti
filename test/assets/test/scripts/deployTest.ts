import { toNano } from '@ton/core';
import { Test } from '../wrappers/Test';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const test = provider.open(await Test.fromInit());

    await test.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(test.address);

    // run methods on `test`
}

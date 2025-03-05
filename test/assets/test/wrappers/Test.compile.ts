import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/test.tact',
    options: {
        debug: true,
    },
};

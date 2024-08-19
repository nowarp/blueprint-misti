# blueprint-misti

A plugin for the [Blueprint Framework](https://github.com/ton-org/blueprint/) that simplifies your workflow with the [Misti](https://nowarp.github.io/tools/misti/) static analyzer.

## Getting Started

Add this plugin to the `package.json` of your Blueprint project by running:
```bash
yarn add misti
yarn add blueprint-misti
```

Then, add this configuration to `blueprint.config.ts`:
```ts
import { MistiPlugin } from 'blueprint-misti';
export const config = {
  plugins: [
    new MistiPlugin(),
  ],
};
```

Now, try to run Misti:
```bash
yarn blueprint misti
```

## Resources
* [Misti: GitHub](https://github.com/nowarp/misti)
* [Misti: Documentation](https://nowarp.github.io/tools/misti/)
* [Blueprint: GitHub](https://github.com/ton-org/blueprint)

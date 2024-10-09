## Building and testing locally
1. Build this plugin:
```
yarn build
```
2. Create a new Blueprint Tact project:
```
npm create ton@latest
cd <project name>
```
3. Add this plugin from the project's directory:
```
yarn add file:/path/to/blueprint-misti
```
4. Add the Blueprint configuration to the project:
```bash
echo "import { MistiPlugin } from '@nowarp/blueprint-misti';
export const config = {
  plugins: [
    new MistiPlugin(),
  ],
};" > blueprint.config.ts
```
5. Test the plugin calling the following command in the project directory:
```bash
yarn blueprint misti <options if needed>
```

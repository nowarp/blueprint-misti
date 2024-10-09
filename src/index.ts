import { Plugin, PluginRunner } from "@ton/blueprint";
import { misti } from "./misti";

export class MistiPlugin implements Plugin {
  runners(): PluginRunner[] {
    return [
      {
        name: "misti",
        runner: misti,
        help: `Usage: blueprint misti [flags]

Runs the Misti static analyzer to find security flaws in the project.
See more: https://nowarp.io/tools/misti/docs/tutorial/blueprint`,
      },
    ];
  }
}

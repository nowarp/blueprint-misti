import path from "path";
import fs from "fs";
import { extractProjectInfo, TactProjectInfo } from "../src/blueprint";

describe("extractProjectInfo", () => {
  const tempDir = path.join(__dirname, "../wrappers");

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return project info when lang is "tact"', async () => {
    const projectName = "TestContract";
    const compileFilePath = path.join(tempDir, `${projectName}.compile.ts`);
    const compileFileContent = `
      import { CompilerConfig } from '@ton/blueprint';
      export const compile: CompilerConfig = {
          lang: 'tact',
          target: 'contracts/test1.tact',
          options: {
              debug: true,
          },
      };
    `;
    fs.writeFileSync(compileFilePath, compileFileContent);
    const result: TactProjectInfo = await extractProjectInfo(projectName);
    expect(result).toEqual({
      projectName,
      target: "contracts/test1.tact",
      options: {
        debug: true,
      },
    });
  });

  it('should throw error when lang is "func"', async () => {
    const projectName = "FuncContract";
    const compileFilePath = path.join(tempDir, `${projectName}.compile.ts`);
    const compileFileContent = `
      import { CompilerConfig } from '@ton/blueprint';
      export const compile: CompilerConfig = {
          lang: 'func',
          targets: ['contracts/test2.func'],
      };
    `;
    fs.writeFileSync(compileFilePath, compileFileContent);
    await expect(extractProjectInfo(projectName)).rejects.toThrow(
      "FunC projects are not currently supported: https://github.com/nowarp/misti/issues/56",
    );
  });
});

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Skip these tests during regular test runs
// Only run when explicitly requested with `yarn blueprint-test`
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === "true";

(runIntegrationTests ? describe : describe.skip)(
  "Blueprint Misti Integration",
  () => {
    let tempDir: string;
    const cwd = process.cwd();

    beforeAll(() => {
      // Create temporary directory for testing
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "blueprint-misti-test-"));
      console.log(`Created temporary directory: ${tempDir}`);
    });

    afterAll(() => {
      // Clean up temporary directory
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`Removed temporary directory: ${tempDir}`);
      }
    });

    it("should work with a new TON project", () => {
      // Change to temp directory
      process.chdir(tempDir);

      try {
        console.log("Copying test project template...");
        fs.cpSync(
          path.join(cwd, "test", "assets", "test"),
          path.join(tempDir, "test-project"),
          { recursive: true },
        );

        // Move into the project directory
        process.chdir(path.join(tempDir, "test-project"));

        // Build blueprint-misti
        console.log("Building blueprint-misti package...");
        execSync(`yarn build`, {
          stdio: "inherit",
        });

        // Add our local package
        console.log("Adding local blueprint-misti package...");
        execSync(`yarn add ${cwd}`, {
          stdio: "inherit",
        });

        // Create blueprint.config.ts
        console.log("Creating blueprint.config.ts...");
        fs.writeFileSync(
          path.join(tempDir, "test-project", "blueprint.config.ts"),
          `import { MistiPlugin } from '@nowarp/blueprint-misti';\nexport const config = {\n  plugins: [\n    new MistiPlugin(),\n  ],\n};\n`,
        );

        // Run blueprint misti
        console.log("Running blueprint misti...");
        const result = execSync("yarn blueprint misti", {
          encoding: "utf-8",
        });

        // Check if the command executed successfully
        expect(result).toContain("Misti analysis completed");
      } catch (error) {
        console.error("Integration test failed:", error);
        throw error;
      } finally {
        // Return to original directory
        process.chdir(cwd);
      }
    }, 1200000); // 20 minute timeout for the entire test
  },
);

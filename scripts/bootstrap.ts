#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";

interface BootstrapOptions {
  name: string;
  description: string;
  packageManager: PackageManager;
  interactive: boolean;
}

const DEFAULTS: BootstrapOptions = {
  name: "topheman/vite-react-ts-template",
  description: "A starter template for frontend projects.",
  packageManager: "npm",
  interactive: true,
};

const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm"] as const;
type PackageManager = (typeof PACKAGE_MANAGERS)[number];

// Collect multi-word argument value until the next flag is encountered
function collectFlagValue(
  args: string[],
  startIndex: number,
): { value: string; nextIndex: number } {
  const parts: string[] = [];
  let i = startIndex;
  while (i < args.length && !args[i].startsWith("--")) {
    parts.push(args[i++]);
  }
  return {
    value: parts.join(" "),
    nextIndex: i - 1, // Adjust because the loop will increment
  };
}

// Parse command-line arguments
function parseArgs(): Partial<BootstrapOptions> {
  const args = process.argv.slice(2);
  const options: Partial<BootstrapOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--name") {
      const result = collectFlagValue(args, i + 1);
      if (result.value) {
        options.name = result.value;
      }
      i = result.nextIndex;
    } else if (arg === "--description") {
      const result = collectFlagValue(args, i + 1);
      if (result.value) {
        options.description = result.value;
      }
      i = result.nextIndex;
    } else if (arg === "--packageManager" && args[i + 1]) {
      const pm = args[++i];
      if (PACKAGE_MANAGERS.includes(pm as (typeof PACKAGE_MANAGERS)[number])) {
        options.packageManager = pm as PackageManager;
      } else {
        console.error(
          `Invalid package manager: ${pm}. Must be one of: ${PACKAGE_MANAGERS.join(", ")}`,
        );
        process.exit(1);
      }
    } else if (arg === "--interactive") {
      if (args[i + 1] === "false" || args[i + 1] === "0") {
        options.interactive = false;
        i++;
      } else {
        options.interactive = true;
      }
    } else if (arg === "--no-interactive") {
      options.interactive = false;
    }
  }

  return options;
}

// Create readline interface for interactive prompts
function createRLI() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Prompt for user input
function question(
  rli: ReturnType<typeof createInterface>,
  query: string,
): Promise<string> {
  return new Promise((resolve) => {
    rli.question(query, resolve);
  });
}

// Get current values from package.json using npm pkg
function getCurrentPackageJsonValues(): { name: string; description: string } {
  try {
    const name = execSync("npm pkg get name", { encoding: "utf-8" })
      .trim()
      // 'npm pkg get name' outputs the value as a quoted JSON string, e.g. '"project-name"'.
      // This regex removes the leading and trailing double quotes, so we get just: project-name
      .replace(/^"|"$/g, "");
    const description = execSync("npm pkg get description", {
      encoding: "utf-8",
    })
      .trim()
      .replace(/^"|"$/g, "");
    return { name, description };
  } catch (error) {
    console.error("Error reading package.json:", error);
    return { name: DEFAULTS.name, description: DEFAULTS.description };
  }
}

// Read .env file
function readEnvFile(): Record<string, string> {
  const envPath = join(process.cwd(), ".env");
  const env: Record<string, string> = {};

  if (existsSync(envPath)) {
    try {
      const content = readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key) {
            env[key.trim()] = valueParts.join("=").trim();
          }
        }
      });
    } catch (error) {
      console.warn("Warning: Could not read .env file:", error);
    }
  }

  return env;
}

// Write .env file
function writeEnvFile(env: Record<string, string>) {
  const envPath = join(process.cwd(), ".env");

  // Read original file to preserve comments and formatting
  let originalContent = "";
  if (existsSync(envPath)) {
    originalContent = readFileSync(envPath, "utf-8");
  }

  const lines: string[] = [];
  const existingKeys = new Set<string>();

  // Parse existing content to preserve structure
  if (originalContent) {
    originalContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key] = trimmed.split("=");
        if (key) {
          const keyTrimmed = key.trim();
          existingKeys.add(keyTrimmed);
          // Skip VITE_TITLE and VITE_DESCRIPTION as we'll update them
          if (
            keyTrimmed !== "VITE_TITLE" &&
            keyTrimmed !== "VITE_DESCRIPTION"
          ) {
            lines.push(line);
          }
        } else {
          lines.push(line);
        }
      } else {
        // Preserve comments and empty lines
        lines.push(line);
      }
    });
  }

  // Helper function to update or add an env variable
  const updateOrAddEnvVar = (key: string, value: string) => {
    const index = lines.findIndex((line) => line.trim().startsWith(`${key}=`));
    if (index >= 0) {
      lines[index] = `${key}=${value || ""}`;
    } else {
      // Only add newline if file has content and last line is not empty
      if (lines.length > 0 && lines[lines.length - 1].trim() !== "") {
        lines.push("");
      }
      lines.push(`${key}=${value || ""}`);
    }
  };

  // Update or add VITE_TITLE and VITE_DESCRIPTION
  updateOrAddEnvVar("VITE_TITLE", env.VITE_TITLE || "");
  updateOrAddEnvVar("VITE_DESCRIPTION", env.VITE_DESCRIPTION || "");

  writeFileSync(
    envPath,
    lines.join("\n") +
    (lines.length > 0 && !lines[lines.length - 1] ? "\n" : ""), // eslint-disable-line prettier/prettier
    "utf-8",
  );
}

// Update package.json using npm pkg
function updatePackageJson(name: string, description: string) {
  try {
    execSync(`npm pkg set name="${name}"`, { stdio: "inherit" });
    execSync(`npm pkg set description="${description}"`, { stdio: "inherit" });
  } catch (error) {
    console.error("Error updating package.json:", error);
    throw error;
  }
}

// Update README.md
function updateReadme(name: string) {
  const readmePath = join(process.cwd(), "README.md");
  let content = readFileSync(readmePath, "utf-8");

  // Update title in first line
  const lines = content.split("\n");
  if (lines[0].startsWith("#")) {
    lines[0] = `# ${name}`;
  } else {
    lines[0] = `# ${name}\n${lines[0]}`;
  }
  content = lines.join("\n");

  // Append Resources section if not present
  const resourcesSection = `## Resources

This project is based on the [topheman/vite-react-ts-template](https://github.com/topheman/vite-react-ts-template) template.
`;

  if (!content.includes("## Resources")) {
    // Ensure there's a newline before adding the section
    if (!content.endsWith("\n")) {
      content += "\n";
    }
    content += "\n" + resourcesSection;
  }

  writeFileSync(readmePath, content, "utf-8");
}

// Update .cursor/worktrees.json
function updateWorktreesJson(packageManager: PackageManager) {
  const worktreesPath = join(process.cwd(), ".cursor", "worktrees.json");
  const commands: Record<string, string> = {
    npm: "npm install",
    pnpm: "pnpm install",
    yarn: "yarn",
  };

  const worktrees = {
    "setup-worktree": [commands[packageManager]],
  };

  writeFileSync(
    worktreesPath,
    JSON.stringify(worktrees, null, 2) + "\n",
    "utf-8",
  );
}

// Update .github/workflows/deploy.yml
function updateDeployYml(packageManager: PackageManager) {
  const deployPath = join(process.cwd(), ".github", "workflows", "deploy.yml");
  let content = readFileSync(deployPath, "utf-8");

  const commands: Record<string, string> = {
    npm: "npm ci",
    pnpm: "pnpm install",
    yarn: "yarn install --frozen-lockfile",
  };

  // Replace the Install dependencies step
  const installPattern = /(\s+- name: Install dependencies\s+run: )(.+)/;
  const replacement = `$1${commands[packageManager]}`;

  if (installPattern.test(content)) {
    content = content.replace(installPattern, replacement);
  } else {
    // If pattern not found, try to find the line and replace it
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("Install dependencies") && i + 1 < lines.length) {
        if (lines[i + 1].includes("run:")) {
          lines[i + 1] = lines[i + 1].replace(
            /run: .+/,
            `run: ${commands[packageManager]}`,
          );
          break;
        }
      }
    }
    content = lines.join("\n");
  }

  writeFileSync(deployPath, content, "utf-8");
}

// Interactive prompt for options
async function promptForOptions(
  rli: ReturnType<typeof createInterface>,
  current: Partial<BootstrapOptions>,
): Promise<BootstrapOptions> {
  const currentPackageJson = getCurrentPackageJsonValues();

  const options: BootstrapOptions = {
    name: current.name || currentPackageJson.name || DEFAULTS.name,
    description:
      current.description ||
      currentPackageJson.description ||
      DEFAULTS.description,
    packageManager: current.packageManager || DEFAULTS.packageManager,
    interactive:
      current.interactive !== undefined
        ? current.interactive
        : DEFAULTS.interactive,
  };

  if (!current.interactive && current.interactive !== false) {
    // If interactive is explicitly set to false via flag, skip prompts
    if (
      process.argv.includes("--no-interactive") ||
      process.argv.includes("--interactive=false")
    ) {
      return options;
    }
  }

  if (options.interactive) {
    console.log("\n📦 Bootstrap Configuration\n");

    // Prompt for name
    const nameAnswer = await question(rli, `Project name [${options.name}]: `);
    if (nameAnswer.trim()) {
      options.name = nameAnswer.trim();
    }

    // Prompt for description
    const descAnswer = await question(
      rli,
      `Project description [${options.description}]: `,
    );
    if (descAnswer.trim()) {
      options.description = descAnswer.trim();
    }

    // Prompt for package manager
    console.log(`\nPackage manager options: ${PACKAGE_MANAGERS.join(", ")}`);
    const pmAnswer = await question(
      rli,
      `Package manager [${options.packageManager}]: `,
    );
    if (
      pmAnswer.trim() &&
      PACKAGE_MANAGERS.includes(pmAnswer.trim() as PackageManager)
    ) {
      options.packageManager = pmAnswer.trim() as PackageManager;
    } else if (pmAnswer.trim()) {
      console.warn(
        `Invalid package manager "${pmAnswer.trim()}", using ${options.packageManager}`,
      );
    }
  }

  return options;
}

// Show summary of changes
function showSummary(
  options: BootstrapOptions,
  currentPackageJson: { name: string; description: string },
) {
  console.log("\n📋 Summary of changes:\n");
  console.log(`  • package.json:`);
  console.log(`    - name: "${currentPackageJson.name}" → "${options.name}"`);
  console.log(
    `    - description: "${currentPackageJson.description}" → "${options.description}"`,
  );
  console.log(`  • README.md:`);
  console.log(`    - title: "${currentPackageJson.name}" → "${options.name}"`);
  console.log(`    - Resources section will be added (if not present)`);
  console.log(`  • .env:`);
  console.log(`    - VITE_TITLE: "${options.name}"`);
  console.log(`  • .cursor/worktrees.json:`);
  console.log(`    - setup-worktree: "${options.packageManager} install"`);
  console.log(`  • .github/workflows/deploy.yml:`);
  const installCommands: Record<string, string> = {
    npm: "npm ci",
    pnpm: "pnpm install",
    yarn: "yarn install --frozen-lockfile",
  };
  console.log(
    `    - Install dependencies: "${installCommands[options.packageManager]}"`,
  );
}

// Main function
async function main() {
  const args = parseArgs();
  const rli = createRLI();

  try {
    const currentPackageJson = getCurrentPackageJsonValues();
    const options = await promptForOptions(rli, args);

    if (options.interactive) {
      showSummary(options, currentPackageJson);

      const confirm = await question(rli, "\n❓ Apply these changes? (Y/n): ");
      if (confirm.toLowerCase() === "n" || confirm.toLowerCase() === "no") {
        console.log("\n❌ Cancelled.");
        rli.close();
        process.exit(0);
      }
    }

    console.log("\n🚀 Applying changes...\n");

    // Update package.json
    console.log("  ✓ Updating package.json...");
    updatePackageJson(options.name, options.description);

    // Update README.md
    console.log("  ✓ Updating README.md...");
    updateReadme(options.name);

    // Update .env
    console.log("  ✓ Updating .env...");
    const env = readEnvFile();
    env.VITE_TITLE = options.name;
    env.VITE_DESCRIPTION = options.description;
    writeEnvFile(env);

    // Update .cursor/worktrees.json
    console.log("  ✓ Updating .cursor/worktrees.json...");
    updateWorktreesJson(options.packageManager);

    // Update .github/workflows/deploy.yml
    console.log("  ✓ Updating .github/workflows/deploy.yml...");
    updateDeployYml(options.packageManager);

    console.log("\n✅ Bootstrap complete!\n");
  } catch (error) {
    console.error("\n❌ Error during bootstrap:", error);
    rli.close();
    process.exit(1);
  } finally {
    rli.close();
  }
}

// Run the CLI
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

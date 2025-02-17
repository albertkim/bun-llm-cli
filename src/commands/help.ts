import chalk from "chalk"

console.log("Printing help")

export const help = () => {
  console.log(chalk.green("bun-llm-cli"))
  console.log(chalk.green("Usage: bun-llm-cli [options]"))
  console.log(chalk.green("Options:"))
  console.log(chalk.green("  -h, --help     Show help"))
  console.log(chalk.green("  -v, --version  Show version"))
}

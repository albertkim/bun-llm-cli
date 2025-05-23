# bun-llm-cli

## Introduction

This is a Bun-based CLI application to use LLMs, developed for my personal interests and use cases in running LLMs in the terminal with total control over their behaviour.

It is also a fun way for me to explore Bun's capabilities.

## Setup

```
bun install
bun link
bun link bun-llm-cli
```

Reference: https://balamurugan16.hashnode.dev/blazingly-fast-cli-with-bun

## Run

In your terminal, run:

```
llm
```

If you have no API keys set up, it will prompt you for a setup. API keys will be stored in a local-only config JSON file.

Once configured, you can run `llm` again, which will put you into an interactive CLI mode. Previous chats will be stored in a local-only database.

## Single-file executables

Bun supports [single-file executables](https://bun.sh/docs/bundler/executables), which is really cool.

In order to compile this CLI application as a single-file executable, run the following:

`bun run build`

If you want to run the scripts for individual platforms, you can see them in `package.json`. The platforms supported are:

```
linux-x64
linux-arm64
macos-x64
macos-arm64
windows-x64
```

The file outputs will appear in the `/dist` folder. Pick, run, or distribute the appropriate file for your platform of choice. The file sizes are too big to include in the repo, ranging from 50mb - 100mb because they have to package the entire JS runtime engine. One can hope that this will improve in the future.

If bundled file sizes matter, it would be best to use a lower-level language like Go or Rust.

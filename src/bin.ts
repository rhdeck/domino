#!/usr/bin/env node

import { program } from "commander";
import { clear, push, wait, defaultFile } from "./";
import { spawnSync } from "child_process";
program.option(
  "-f --file <logfile>",
  "log file to record signals (default is " + defaultFile + ")",
  defaultFile
);
program
  .command("push <signal>")
  .description("Send signal that will trigger following dominoes")
  .option("-n --noti", "Send noti notification with the signal")
  .action((signal, { noti }) => {
    push(signal, program.file);
    if (noti) {
      spawnSync("noti", ["-m", signal]);
    }
  });
program
  .command("await <signal> [signal2] [signal3] [signal4] [signal5]")
  .description(
    "Listen for up to 5 signals to return, allowing next process to run"
  )
  .option(
    "-l --lookback <time>",
    "Time to look back ex: 10s or 5m, otherwise starts now"
  )
  .option("-f --flush", "Flush the cache first and ignore the lookback")
  .action(
    (
      signal: string,
      signal2?: string,
      signal3?: string,
      signal4?: string,
      signal5?: string
    ) => {
      if (program.flush) clear(program.file);
      wait(
        [signal, signal2, signal3, signal4, signal5],
        program.file,
        program.flush ? "1000 days" : program.lookback
      );
    }
  );
program
  .command("clear")
  .description("flush the event log")
  .action(() => clear(program.file));
program.parse(process.argv);

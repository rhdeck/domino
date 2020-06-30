import {
  writeFileSync,
  watch,
  appendFileSync,
  readFileSync,
  existsSync,
} from "fs";
import ms from "ms";
import { join } from "path";
const defaultFile = join(process.env.HOME, ".domino");
function clear(logFile = defaultFile): void {
  writeFileSync(logFile, "");
}
function push(signal: string, logFile = defaultFile): void {
  appendFileSync(logFile, JSON.stringify([Date.now(), signal]) + "\n");
}

function wait(signal: string[], logFile = defaultFile, lookback = "0"): void {
  if (!existsSync(logFile)) {
    writeFileSync(logFile, "");
  }
  let stopped = false;
  const lookbackms = Math.abs(ms(lookback + ""));
  const now = Date.now() - lookbackms;
  watch(logFile, () => {
    if (stopped) return;
    //load contents quickly
    const contents = readFileSync(logFile, { encoding: "utf8" });
    const lines = contents.split("\n");
    signal.forEach((sign) =>
      lines.some((line) => {
        try {
          const [timestamp, s] = JSON.parse(line);
          if (s === sign && timestamp > now) {
            signal = signal.filter((i) => i !== s).filter(Boolean);
            return true;
          }
        } catch (e) {}
        return false;
      })
    );
    if (signal.length === 0) {
      stopped = true;

      //remove all lines before 10 seconds ago
      const maxTime = Date.now() - 10000;
      const newLines = lines.filter((line) => {
        try {
          const [timestamp, s] = JSON.parse(line);
          if (timestamp > maxTime) return true;
        } catch (e) {}
      });
      if (newLines.length !== lines.length) {
        writeFileSync(
          logFile,
          newLines.length ? newLines.join("\n") + "\n" : ""
        );
      }
      process.exit(0);
    }
  });
}

export { clear, push, wait, defaultFile };

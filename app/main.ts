import { createInterface } from "readline";
import path from "node:path";
import { access, constants } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import utils from "util";
import fs from "node:fs";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function checkIfFileIsAccessible(
  curr_dir: string,
  curr_command: string,
  isRedirectStdout: boolean,
  isRedirectStdout_path: string,
  file_execution_output: string
) {
  try {
    await access(`${curr_dir}`, constants.X_OK);
    if (isRedirectStdout) {
      file_execution_output = `${curr_command} is ${curr_dir}`;
      writeFile(isRedirectStdout_path, file_execution_output);
      isRedirectStdout = false;
    } else console.log(`${curr_command} is ${curr_dir}`);
    return true;
  } catch (e) {
    return false;
  }
}

async function checkIfFileIsAccessible_notPrint(
  curr_dir: string,
  curr_command: string
) {
  try {
    await access(`${curr_dir}`, constants.X_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function getArguments(str: string) {
  const result = [];
  let current = "";
  let inSingleQuote = false;
  let isDoubleQuote = false;
  let toStoreEscapeSequence = "";
  let special_char_double_quote_escape = ["\\", '"'];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === "'" && !isDoubleQuote) {
      inSingleQuote = !inSingleQuote; // toggle quote state
      continue; // do not include quote
    }

    if (char === '"' && !inSingleQuote) {
      isDoubleQuote = !isDoubleQuote;
      continue;
    }

    if (char === "\\" && !isDoubleQuote && !inSingleQuote) {
      current += str[i + 1];
      i++; // skip next character
      continue;
    }

    if (char === "\\" && !inSingleQuote) {
      if (special_char_double_quote_escape.indexOf(str[i + 1]) != -1) {
        current += str[i + 1];
        i++; // skip next character
        continue;
      }
    }

    if (char === " " && !inSingleQuote && !isDoubleQuote) {
      if (current.length > 0) {
        result.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    result.push(current);
  }

  return result;
}

function writeFile(file_name: string, content: string) {
  try {
    fs.writeFileSync(file_name, content);
    // file written successfully
  } catch (err) {
    console.error(err);
  }
}

// TODO: Uncomment the code below to pass the first stage
//CHILD_PROCESS IS USED TO RUN PROGRAMS WHILE fs IS USED FOR FILE HANDLING SUCH AS READ, WRITE

let commands: String[] = ["echo", "exit", "type", "pwd", "cd"];
let curr_path = process.env.PATH?.split(path.delimiter);

async function askPrompt() {
  let callback = async (answer) => {
    let curr_command = getArguments(answer)[0];
    let file_execution_output = "";
    let isRedirectStdout = false;
    let isRedirectStdout_path = "";
    if (answer.indexOf("1>") != -1 || answer.indexOf(">") != -1) {
      isRedirectStdout = true;
      let argv = getArguments(answer);
      isRedirectStdout_path = argv[argv.length - 1];
    }

    if (answer === "exit") {
      rl.close();
      return;
    }

    if (answer.indexOf("echo") === 0) {
      const removeList = ["echo", "1>", ">", isRedirectStdout_path];
      let argvProp = answer;
      for (const item of removeList) {
        argvProp = argvProp.replace(item, "");
      }
      let argv = getArguments(argvProp);

      if (isRedirectStdout) {
        for (let i of argv) {
          file_execution_output += i;
        }
        writeFile(isRedirectStdout_path, file_execution_output);
        isRedirectStdout = false;
      } else {
        console.log(...argv);
      }
    } else if (answer.indexOf("pwd") === 0 && answer.length === 3) {
      if (isRedirectStdout) {
        file_execution_output = process.cwd();
        writeFile(isRedirectStdout_path, file_execution_output);
        isRedirectStdout = false;
      } else console.log(process.cwd());
    } else if (answer.indexOf("cd") === 0) {
      let argv = answer.split(" ")[1];

      if (argv == "~" && answer.split(" ").length == 2) {
        try {
          process.chdir(process.env.HOME);
        } catch (err) {}
      } else if (path.isAbsolute(argv)) {
        try {
          process.chdir(argv);
        } catch (err) {
          if (!isRedirectStdout)
            console.log(`cd: ${argv}: No such file or directory`);
        }
      } else if (!path.isAbsolute(argv)) {
        try {
          process.chdir(argv);
        } catch (err) {
          if (!isRedirectStdout)
            console.log(`cd: ${argv}: No such file or directory`);
        }
      }
    }

    //when type of ---start
    else if (answer.indexOf("type") === 0) {
      let curr_command = answer.split(" ")[1];

      if (commands.includes(curr_command)) {
        if (isRedirectStdout) {
          file_execution_output = `${curr_command} is a shell builtin`;
          writeFile(isRedirectStdout_path, file_execution_output);
          isRedirectStdout = false;
        } else console.log(`${curr_command} is a shell builtin`);
      } else {
        let isExecutable: boolean = false;

        for (let i of curr_path) {
          if (isExecutable) break;
          isExecutable = await checkIfFileIsAccessible(
            path.join(i, curr_command),
            curr_command,
            isRedirectStdout,
            isRedirectStdout_path,
            file_execution_output
          );
        }

        if (
          !isExecutable &&
          !commands.includes(curr_command) &&
          !isRedirectStdout
        ) {
          console.log(`${curr_command}: not found`);
        }
      }
    }

    //when you execute other files
    else if (!commands.includes(curr_command)) {
      const removeList = [curr_command, "1>", ">", isRedirectStdout_path];
      let argvProp = answer;
      for (const item of removeList) {
        argvProp = argvProp.replace(item, "");
      }
      let argument = getArguments(argvProp);

      // let argument: String[] = getArguments(answer.replace(curr_command, ""));
      let isExecuted;
      let result;

      for (let i = 0; i <= curr_path?.length - 1; i++) {
        isExecuted = await checkIfFileIsAccessible_notPrint(
          path.join(curr_path[i], curr_command),
          curr_command
        );

        if (isExecuted) {
          // let execFilePromise = utils.promisify(spawn);

          try {
            result = spawnSync(curr_command, argument);
            if(result.status===1) {
              process.stdout.write(result.stderr.toString());
            }

            if (isRedirectStdout && result.stdout) {
              file_execution_output = result.stdout;
              writeFile(isRedirectStdout_path, file_execution_output);
              isRedirectStdout = false;
              break;
            } else {
              process.stdout.write(result.stdout);
              console.log("");
              break;
            }


            // if (result) {
            //   break;
            // }
          } catch (e) {}
        }
      }


      if (!isExecuted && !result?.stdout && !isRedirectStdout) {
        console.log(`${curr_command}: command not found`);
      }
    }

    // else if(){
    //   console.log(`${answer}: command not found`);
    // }
    askPrompt();
  };

  return rl.question("$ ", callback);
}

askPrompt();

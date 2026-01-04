import { createInterface } from "readline";
import path from "node:path";
import { access, constants } from "node:fs/promises";
import { execFile } from "node:child_process";
import utils from "util";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function checkIfFileIsAccessible(curr_dir: string, curr_command: string) {
  try {
    await access(`${curr_dir}`, constants.X_OK);
    console.log(`${curr_command} is ${curr_dir}`);
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
  let toStoreEscapeSequence='';

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
      current+=str[i+1];
      i++; // skip next character
      continue;
    }

    if (char === " " && !inSingleQuote && !isDoubleQuote) {
      if (current.length > 0) {
        result.push(current);
        current = "";
      }

    } else {
      // if three or more backslash
      // if(char==="/" && str[i+1]==="/" && str[i+2]==="/" ) {
      //    for(let j=i; j<str.length ;j++) {
      //     if(str[j]==='/') {
      //      current+=' ';
      //       i++;
      //     }
      //     else{
      //       i--;
      //       break;
      //       };
      //    }
      // }
      //  if(char==='\\' && str[i+1]===' ' ) {
      //   current+=' ';
      //    i++;

      // }else if(char==='\\' && ((str[i+1].charCodeAt(0)>=65 && str[i+1].charCodeAt(0)<=90) || (str[i+1].charCodeAt(0)>=97 && str[i+1].charCodeAt(0)<=122   ))) {

      // }
      // else if (char==="\\" && str[i+1]==="\\" ) {
      //   current+='/';
      //   i++;
      // }
      // else if(char==="/" && str[i+1]==="'" ) {
      //   current+="'";
      //   i++;
      // }
      //  else {
      current += char;
      // }
    }
  }

  if (current.length > 0) {
    result.push(current);
  }

  return result;
}

// TODO: Uncomment the code below to pass the first stage
//CHILD_PROCESS IS USED TO RUN PROGRAMS WHILE fs IS USED FOR FILE HANDLING SUCH AS READ, WRITE

let commands: String[] = ["echo", "exit", "type", "pwd", "cd"];
let curr_path = process.env.PATH?.split(path.delimiter);

async function askPrompt() {
  let callback = async (answer) => {
    let curr_command = answer.split(" ")[0];

    if (answer === "exit") {
      rl.close();
      return;
    }

    if (answer.indexOf("echo") === 0) {
      let argv = getArguments(answer.replace("echo", ""));
      console.log(...argv);
    } else if (answer.indexOf("pwd") === 0 && answer.length === 3) {
      console.log(process.cwd());
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
          console.log(`cd: ${argv}: No such file or directory`);
        }
      } else if (!path.isAbsolute(argv)) {
        try {
          process.chdir(argv);
        } catch (err) {
          console.log(`cd: ${argv}: No such file or directory`);
        }
      }
    }

    //when type of ---start
    else if (answer.indexOf("type") === 0) {
      let curr_command = answer.split(" ")[1];

      if (commands.includes(curr_command)) {
        console.log(`${curr_command} is a shell builtin`);
      } else {
        let isExecutable: boolean = false;

        for (let i of curr_path) {
          if (isExecutable) break;
          isExecutable = await checkIfFileIsAccessible(
            path.join(i, curr_command),
            curr_command
          );
        }

        if (!isExecutable && !commands.includes(curr_command)) {
          console.log(`${curr_command}: not found`);
        }
      }
    }

    //when you execute other files
    else if (!commands.includes(curr_command)) {
      let argument: String[] = getArguments(answer.replace(curr_command, ""));
      let isExecuted;

      for (let i of curr_path) {
        isExecuted = await checkIfFileIsAccessible_notPrint(
          path.join(i, curr_command),
          curr_command
        );

        if (isExecuted) {
          let execFilePromise = utils.promisify(execFile);

          try {
            let result = await execFilePromise(curr_command, argument);
            process.stdout.write(result?.stdout);
            break;
          } catch (e) {}
        }
      }

      if (!isExecuted) {
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

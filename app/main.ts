import { createInterface } from "readline";
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// TODO: Uncomment the code below to pass the first stage

let commands:String[]= ['echo', 'exit', 'type'];
let curr_path= dirname(fileURLToPath(import.meta.url));

 async function askPrompt() {

    let callback= (answer)=>{

        if(answer==='exit') {
          rl.close();
          return;
        }

        if(answer.indexOf('echo')===0) {
          console.log(answer.slice(5));
        }

        else if(answer.indexOf('type')===0) {
          console.log(curr_path);
           let curr_command= answer.split(" ")[1];
           if(commands.includes(curr_command)) {
            console.log(`${curr_command} is a shell builtin`);
           }
           else if(curr_path?.includes(curr_command)) {
            console.log(`${curr_command} is ${curr_command}`);
           }
            else{
          console.log(`${curr_command}: not found`);
        }
        }
        else{
          console.log(`${answer}: command not found`);
        }
        askPrompt();
    }
   
    return  rl.question('$ ', callback);

 }

 askPrompt();


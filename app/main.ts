import { createInterface } from "readline";
import path from "node:path";
import { access, constants } from 'node:fs/promises';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function checkIfFileIsAccessible(curr_dir:string, curr_command:string) {
  
  try {
    await access(`${curr_dir}`, constants.X_OK);
    console.log(`${curr_command} is ${curr_dir}`);
    return true;
  }catch(e) {
    return false;
  }

}

// TODO: Uncomment the code below to pass the first stage

let commands:String[]= ['echo', 'exit', 'type'];
let curr_path= process.env.PATH?.split(path.delimiter);

 async function askPrompt() {

    let callback= async(answer)=>{

        if(answer==='exit') {
          rl.close();
          return;
        }

        if(answer.indexOf('echo')===0) {
          console.log(answer.slice(5));
        }

        else if(answer.indexOf('type')===0) {
           let curr_command= answer.split(" ")[1];
           if(commands.includes(curr_command)) {
            console.log(`${curr_command} is a shell builtin`);
           }else{
 let isExecutable:boolean=false;

           for(let i of curr_path) {
                if(isExecutable) break;
                isExecutable=await checkIfFileIsAccessible(path.join(i, curr_command), curr_command);
           }
           
          if(!isExecutable && !commands.includes(curr_command)) {
          console.log(`${curr_command}: not found`);
        }
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


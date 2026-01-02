import { createInterface } from "readline";
import path from "node:path";
import { access, constants } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import utils from 'util';

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

async function checkIfFileIsAccessible_notPrint(curr_dir:string, curr_command:string) {
  
  try {
    await access(`${curr_dir}`, constants.X_OK);
    return true;
  }catch(e) {
    return false;
  }

}


// TODO: Uncomment the code below to pass the first stage
//CHILD_PROCESS IS USED TO RUN PROGRAMS WHILE fs IS USED FOR FILE HANDLING SUCH AS READ, WRITE

let commands:String[]= ['echo', 'exit', 'type', 'pwd'];
let curr_path= process.env.PATH?.split(path.delimiter);

 async function askPrompt() {

    let callback= async(answer)=>{

       let curr_command= answer.split(" ")[0];

        if(answer==='exit') {
          rl.close();
          return;
        }

        if(answer.indexOf('echo')===0) {
          console.log(answer.slice(5));
        }

        else if(answer.indexOf('pwd')===0 && answer.length===3) {
          console.log(process.cwd());
        }

        //when type of ---start
        else if(answer.indexOf('type')===0) {
           let curr_command= answer.split(" ")[1];

            if(commands.includes(curr_command)) {
              console.log(`${curr_command} is a shell builtin`);
            }
           
            else{
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
        
        //when you execute other files

        else if(!commands.includes(curr_command)) {

          let argument:String[]= answer.split(" ").slice(1);
          let isExecuted;

          for(let i of curr_path) {
      
            isExecuted=await checkIfFileIsAccessible_notPrint(path.join(i, curr_command), curr_command);

            if(isExecuted) {

              let execFilePromise=utils.promisify(execFile);

              try {

                 let result=await execFilePromise(curr_command, argument);
                 process.stdout.write(result?.stdout);
                 break;

              }
              catch(e) {

              }
            
            }

          }

           if(!isExecuted) {

             console.log(`${curr_command}: command not found`);

           }
        }
        
        // else if(){
        //   console.log(`${answer}: command not found`);
        // }
        askPrompt();
    }
   
    return  rl.question('$ ', callback);

 }

 askPrompt();


import { createInterface } from "readline";
import { access, constants } from "fs";
import path from 'node:path';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// TODO: Uncomment the code below to pass the first stage

let commands:String[]= ['echo', 'exit', 'type'];
let curr_path= process.env.PATH;
let curr_path_directories= curr_path?.split(`${path.delimiter}`);

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
          console.log(process.env.PATH);
           let curr_command= answer.split(" ")[1];
           if(commands.includes(curr_command)) {
            console.log(`${curr_command} is a shell builtin`);
           }
           
           let isExecutableExists=false;
           for(let i of curr_path_directories) {
            if(isExecutableExists) {
              break;
            }
            try {

               await access(`${i}/${curr_command}`, constants.R_OK | constants.W_OK);
               isExecutableExists=true;
               console.log(`${curr_command} is ${curr_path}`);
            } catch {
               
            } 
           }
           
        
           if(!commands.includes(curr_command) && !isExecutableExists) {
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


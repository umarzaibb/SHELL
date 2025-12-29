import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// TODO: Uncomment the code below to pass the first stage

let commands:String[]= ['echo', 'exit', 'type'];

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
           let curr_command= answer.split(" ")[1];
           if(commands.includes(curr_command)) {
            console.log(`${curr_command} is a shell builtin`);
           } else{
          console.log(`${curr_command}: command not found`);
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


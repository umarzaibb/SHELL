import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// TODO: Uncomment the code below to pass the first stage


 async function askPrompt() {

    let callback= (answer)=>{
        console.log(`${answer}: command not found`);
        if(answer==='exit') {
          rl.close();
          return;
        }
        askPrompt();
    }
   
    return  rl.question('$ ', callback);

 }

 askPrompt();


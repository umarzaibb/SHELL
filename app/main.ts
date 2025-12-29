import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// TODO: Uncomment the code below to pass the first stage


 async function askPrompt() {

    let callback= (answer)=>{

        if(answer==='exit') {
          rl.close();
          return;
        }

        if(answer.indexOf('echo')===0) {
          console.log(answer.slice(5));
        }else{
          console.log(`${answer}: command not found`);
        }
        askPrompt();
    }
   
    return  rl.question('$ ', callback);

 }

 askPrompt();


import { DummyCommand } from '../src/commands/dummy-command';
import * as execa from 'execa';

describe('Test sigmentation error oclif',()=>{
  it('test loop command 1 ',async ()=>{
    for (let i=0 ;i<10;i++){
      console.log('In loog '+ i)
      await DummyCommand.run()
      await execa('sleep',['2']);
    }
  },50000)

})

import { Command } from '@oclif/command';

export class DummyCommand extends Command{

  async run() {
    console.log("in run dummy command")
    return Promise.resolve()
  }
}

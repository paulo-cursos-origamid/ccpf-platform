import { Command } from 'commander';

import { CreateHandler } from '../handlers/create.handler.js';

export function createCommand(): Command {
  const command = new Command('create');

  command
    .description('Create project resources and applications')
    .argument('<type>', 'Artifact or project type')
    .argument('<name>', 'Resource or project name')
    .option(
      '-p, --path <path>',
      'Destination path',
      '.',
    )
    .action(
      async (
        type: string,
        name: string,
        options: { path: string },
      ) => {
        const handler = new CreateHandler();

        await handler.execute(
          type,
          name,
          options.path,
        );
      },
    );

  return command;
}
/*!
 * Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved.
 */

import Command from '@oclif/command';
import { OutputFlags } from '@oclif/parser';

type FlagsInput<CommandT extends typeof Command> = CommandT['flags'];

export type Flags<CommandT extends typeof Command> = OutputFlags<NonNullable<FlagsInput<CommandT>>>;
export type RequiredFlagsParam<CommandT extends typeof Command, ParamsT extends keyof Flags<CommandT>> = Pick<Flags<CommandT>, ParamsT>;
export type OptionalFlagsParam<CommandT extends typeof Command, ParamsT extends keyof Flags<CommandT>> = Partial<
  RequiredFlagsParam<CommandT, ParamsT>
>;
export type FlagsParam<
  CommandT extends typeof Command,
  RequiredParamsT extends keyof Flags<CommandT>,
  OptionalParamsT extends keyof Flags<CommandT>
> = RequiredFlagsParam<CommandT, RequiredParamsT> & OptionalFlagsParam<CommandT, OptionalParamsT>;

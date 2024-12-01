/* eslint-disable no-underscore-dangle */

import { EventArgs } from '../event/types'
import { Basecoat } from './basecoat'

export interface IDisablable {
  readonly disabled: boolean
  enable(): void
  disable(): void
}

export abstract class Disablable<A extends EventArgs = any>
  extends Basecoat<A>
  implements IDisablable
{
  private _disabled?: boolean

  public get disabled(): boolean {
    return this._disabled === true
  }

  public enable() {
    delete this._disabled
  }

  public disable() {
    this._disabled = true
  }
}

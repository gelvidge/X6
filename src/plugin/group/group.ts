import { disposable } from '../../common'
import type { Graph } from '../../graph'
import type { Cell, Model } from '../../model'
import { Collection, type CollectionSetOptions } from '../../model/collection'
import { View } from '../../view'

export class GroupImpl extends View<GroupImpl.EventArgs> {
  public readonly options: GroupImpl.Options

  protected readonly collection: Collection

  public get graph() {
    return this.options.graph
  }

  protected get handleOptions() {
    return this.options
  }

  constructor(options: GroupImpl.Options) {
    super()
    this.options = options

    if (this.options.model) {
      this.options.collection = this.options.model.collection
    }

    if (this.options.collection) {
      this.collection = this.options.collection
    } else {
      this.collection = new Collection([], {
        comparator: Private.depthComparator,
      })
      this.options.collection = this.collection
    }
  }

  @disposable()
  dispose() {
    this.remove()
    this.off()
  }
}

export namespace GroupImpl {
  export interface CommonOptions {
    model?: Model
    collection?: Collection
  }

  export interface Options extends CommonOptions {
    graph: Graph
  }

  export interface SetOptions extends CollectionSetOptions {
    batch?: boolean
  }
}

export namespace GroupImpl {
  export interface GroupEventArgs {}

  export type EventArgs = GroupEventArgs
}

namespace Private {
  export function depthComparator(cell: Cell) {
    return cell.getAncestors().length
  }
}

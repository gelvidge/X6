import { Cell, Model, Collection, View, Graph } from '@antv/x6'

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

    // this.startListening()
  }

  //  protected startListening() {
  //    const { graph } = this

  //   graph.on('scale', this.onGraphTransformed, this);
  //  graph.on('translate', this.onGraphTransformed, this);
  //   graph.model.on('updated', this.onModelUpdated, this);
  //  }

  // protected stopListening() {
  //   const { graph } = this

  //   this.undelegateEvents()

  // graph.off('scale', this.onGraphTransformed, this);
  // graph.off('translate', this.onGraphTransformed, this);
  // graph.model.off('updated', this.onModelUpdated, this);
  // }

  @View.dispose()
  dispose() {
    // this.clean();
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

  export interface SetOptions extends Collection.SetOptions {
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

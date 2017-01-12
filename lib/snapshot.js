'use babel';

import SnapshotView from './snapshot-view'
import { CompositeDisposable } from 'atom'

export default {

  snapshotView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.snapshotView = new SnapshotView(state.snapshotViewState)

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'snapshot:toggle': () => this.snapshotView.toggle()
    }))

  },

  deactivate() {
    // this.modalPanel.destroy();
    this.subscriptions.dispose()
    // this.snapshotView.destroy()
  },

  serialize() {
    return {
      snapshotViewState: this.snapshotView.serialize()
    }
  }

}

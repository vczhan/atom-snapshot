'use babel';

import {View, TextEditorView } from 'atom-space-pen-views'

export default class modalView extends View {

  static content() {
    return this.div({
      class: 'modal-view'
    }, () => {
      this.h1('Create a new snapshot')
      this.div({
        class: 'inset-panel padded'
      }, () => {
        this.label('Set a name:', {
          class: 'pv-label'
        })
        this.subview('name', new TextEditorView({
          mini: true,
          placeholderText: '未命名'
        }))
      })
      this.div({
        class: 'inset-panel padded'
      }, () => {
        this.label('Enter the describe:', {
          class: 'pv-label'
        })
        this.subview('desc', new TextEditorView({
          placeholderText: ''
        }))
      })
      this.div({
        class: 'block padded',
        style: 'text-align:right'
      }, () => {
        this.button('新建', {
          class: 'inline-block btn btn-success',
          click: 'create'
        })
        this.button('取消', {
          class: 'inline-block btn',
          click: 'closeModal'
        })
      })
    })
  }

  initialize(snapshot) {
    this.snapshot = snapshot

    if (this.panel == null) {
      this.panel = atom.workspace.addModalPanel({
        item: this
      })
    }

    this.panel.show()

    this.name.on('keyup', e => this.onKeyEvent(e))
    setTimeout( () => this.name.focus(), 0)
  }

  onKeyEvent(e) {
    e.stopPropagation()
    switch (e.keyCode) {
      case 13:
        return this.create(e)
      case 27:
        return this.closeModal(e)
    }
  }

  create(e) {
    e.stopPropagation()
    e.preventDefault()

    this.snapshot.addSnapshotSuccess({
      name: this.name.getText() || '未命名',
      desc: this.desc.getText() || '无'
    })

    this.destroy()
  }

  closeModal(e) {
    e.stopPropagation()
    e.preventDefault()

    this.destroy()
  }

  destroy() {
    atom.workspace.panelForItem(this).destroy()
  }
}

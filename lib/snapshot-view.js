'use babel';

import {$, View} from 'atom-space-pen-views'
import ModalView from './modal-view'

export default class SnapshotView extends View {
  constructor() {
    super()
    this.panel = null
    this.id = null
    this.store = null
  }

  static content() {
    return this.div({
      class: 'snapshot'
    }, () => {
      this.tag('snapshot-viewer', {
        class: 'snapshot-container'
      }, ()=> {
        this.tag('ss-header', {
          class: 'snapshot-remove-all padded',
        }, () => {
          this.span('清空', {
            class: 'btn icon icon-trashcan',
            click: 'removeSnapshotAll'
          })

          this.span({
            class: 'btn icon icon-sign-out text-error',
            style: 'margin-left:6px',
            click: 'quit'
          })

          this.span('添加快照', {
            class: 'btn icon icon-device-camera ss-add',
            click: 'addSnapshot'
          })

          this.span('0', {
            style: 'display:none;',
            outlet: 'snapshotCount'
          })
        })

        this.div({
          class: 'snapshot-list'
        }, ()=> {
          this.ul({
            class: 'snapshot-list-ul list-tree',
            outlet: 'list'
          })
        })

        this.tag('ss-footer', {
          outlet: 'storage'
        })
      })
    })
  }

  initialize() {
    // activePane change
    atom.workspace.onDidChangeActivePaneItem(activeItem => {
      if (activeItem && activeItem.constructor.name === 'TextEditor') {
        this.show()
      } else {
        this.hide()
      }
    })

    // trigger select the snapshot
    this.list.on('click', 'li', e => {
      const index = $(e.currentTarget).index()
      this.selectSnapshot(index)
    })

    // trigger delete snapshot
    this.list.on('click', 'i', e => {
      e.stopPropagation()
      const index = $(e.currentTarget).parent().index()
      this.removeSnapshot(index)
    })

  }

  serialize() {
    return null
  }

  quit() {
    this.panel.hide()
  }

  show() {
    if (this.panel === null) {
      this.panel = atom.workspace.addRightPanel({
        item: this
      })
    }

    this.setPanelStore()
    this.updateView()
    this.panel.show()
  }

  hide() {
    if (this.panel !== null) {
      this.panel.hide()
    }
  }

  toggle() {
    if (this.panel !== null ? this.panel.visible : !1) {
      this.hide()
    } else {
      this.show()
    }
  }

  viewForHeader(count) {
    return `<span class="btn icon icon-trashcan">全部清除</span>：${count}`
  }

  viewForItem(item) {
    return `<li class="snapshot-list-li list-item" title="${item.desc}">
              <div class="name">${item.name}</div>
              <span class="time">${item.date}</span>
              <i class="btn-remove icon-remove-close"></i>
            </li>`
  }

  // update snapshot from sessionStorage
  setPanelStore() {
    // return ( this.store = JSON.parse(sessionStorage.getItem(key)) )
    const _id = this.getSnapshotId()
    const _store = JSON.parse(sessionStorage.getItem(_id))
    this.updatePanelStore(_store)
  }

  updatePanelStore(store) {
    this.store = store
  }

  getPanelStore() {
    return this.store
  }

  getSaveDate() {
    const t = new Date
    return [
             ('0'+(t.getMonth()+1)).slice(-2),
             ('0'+(t.getDate())).slice(-2)
           ].join('-') + ' ' +
           [
             ('0'+(t.getHours())).slice(-2),
             ('0'+(t.getMinutes())).slice(-2),
            ('0'+(t.getSeconds())).slice(-2)
           ].join(':')
  }

  getActiveItem() {
    return atom.workspace.getActivePaneItem()
  }

  getTextEditor() {
    // the save as getActiveItem
    return atom.workspace.getActiveTextEditor()
  }

  getSnapshotId() {
    return this.getTextEditor().buffer.id
  }

  getSpaceInfo() {
    const used = (unescape(
                  encodeURIComponent(
                    JSON.stringify(sessionStorage)
                 )).length /1024 / 1024).toFixed(2)

    if (used > 4) {
      return `<span class="icon icon-alert text-error">used: ${used}M</span>`
    }

    if (used > 3) {
      return `<span class="text-warning">used: ${used}M</span>`
    }

    return `<span class="text-success">storage used: ${used}M</span>`

  }

  // update snapshot list
  updateView() {
    const _store = this.getPanelStore()

    let i = 0,
        itemView = '',
        len, item

    this.list.empty()
    this.snapshotCount.text(0)

    if (_store !== null && _store.list && (len = _store.list.length) > 0) {
      for ( ; item = _store.list[i++]; ) {
        itemView += this.viewForItem(item)
      }

      this.snapshotCount.text(len)
      this.list.append(itemView)
      this.list.scrollTop(this.list[0].scrollHeight)

      // chrome version > 33 sessionStorage's storage limit is unlimited?
      this.storage.html(this.getSpaceInfo())
    } else {
      this.list.html('<div class="text-center">None</div>')
    }
  }

  showModal() {
    new ModalView(this)
  }

  addSnapshotSuccess({ name, desc }) {
    const textEditor = this.getTextEditor()
    const _id = textEditor.buffer.id
    // or get from ·buffer
    const _title = textEditor.getTitle()
    const _path = textEditor.getPath()
    const _text = textEditor.getText()
    const _date = this.getSaveDate()
    const _cursor = textEditor.getCursorBufferPosition()

    let _store = this.getPanelStore()

    const item = {
      name, desc,
      date: _date,
      text: _text,
      cursor: _cursor
    }

    if (_store === null) {
      _store = {
        id: _id,
        path: _path,
        title: _title,
        list: [item]
      }
    } else {
      _store.path = _path
      _store.title = _title
      _store.list.push(item)

    }
    sessionStorage.setItem([_id], JSON.stringify(_store))
    this.updatePanelStore(_store)
    this.updateView()

    // notification
    const notify = atom.notifications.addSuccess(_title + ': add a snapshot success.', {
      dismissable: true
    })

    $('atom-notifications').css('margin-right', atom.document.body.clientWidth - textEditor.getElement().getBoundingClientRect().right)

    setTimeout(() => {
      notify.dismiss()
      $('atom-notifications').css('margin-right', '')
    }, 1000)
  }

  // add a new file's snapshot
  addSnapshot() {
    this.showModal()
  }

  // remove the file's snapshot
  removeSnapshot(index) {
    const _id = this.getSnapshotId()
    const _store = this.getPanelStore()

    _store.list.splice(index, 1)
    sessionStorage.setItem([_id], JSON.stringify(_store))

    this.updatePanelStore(_store)
    this.updateView()
  }

  // remove this file's all  snapshot
  removeSnapshotAll() {
    const _id = this.getSnapshotId()

    sessionStorage.removeItem(_id)

    this.updatePanelStore(null)
    this.updateView()
  }

  selectSnapshot(index) {
    /**##################################
    # ✘ 移动文件或修改文件名没做监听更新store，
    # ✘ 所以path和title不从store取
    ##################################**/
    const textEditor = this.getTextEditor()
    const _title = textEditor.getTitle()
    const _path = textEditor.getPath()
    const _store = this.getPanelStore()
    const _text = _store.list[index].text
    const _cursor = _store.list[index].cursor

    this.updateTextEditorContent({
      textEditor: textEditor,
      title: _title,
      path: _path,
      text: _text,
      cursor: _cursor
    })
  }

  updateTextEditorContent({ textEditor, title, path, text, cursor }) {
    textEditor.setText(text)
    textEditor.setCursorBufferPosition(cursor)

    // fs.writeFile(path, text, err => {})
  }

}

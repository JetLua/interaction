const
  touch = {},
  sp = new PIXI.Point(),
  lp = new PIXI.Point(),
  pointerable = 'onpointerdown' in window,
  touchable = 'ontouchstart' in window

let event = {}

export default class {
  #renderer = null
  #view = null
  #resolution = 1

  constructor(renderer, opt) {
    this.#renderer = renderer
    this.#view = renderer.view
    this.#resolution = renderer.resolution

    this.#view.style.touchAction = 'none'

    this.addEvents()
  }

  mapPositionToPoint(point, x, y) {
    const
      view = this.#view,
      resolution = this.#resolution,
      rect = view.parentElement ? view.getBoundingClientRect() : {x: 0, y: 0, width: 0, height: 0}

    const resolutionMultiplier = 1 / resolution

    point.x = ((x - rect.left) * (view.width / rect.width)) * resolutionMultiplier
    point.y = ((y - rect.top) * (view.height / rect.height)) * resolutionMultiplier
  }

  copyEvent(ev) {
    const
      {changedTouches} = ev,
      renderer = this.#renderer

    if (changedTouches) {
      for (const touch of changedTouches) {
        this.mapPositionToPoint(sp, touch.pageX, touch.pageY)
        event.origin = ev
        event.stopped = ev.cancelBubble
        event.id = touch.identifier
        event.x = sp.x
        event.y = sp.y
        this.handle(event, renderer._lastObjectRendered)
      }
    } else {
      this.mapPositionToPoint(sp, ev.pageX, ev.pageY)
      event.origin = ev
      event.stopped = ev.cancelBubble
      event.id = ev.pointerId
      event.x = sp.x
      event.y = sp.y
      this.handle(event, renderer._lastObjectRendered)
    }
  }

  onDown(ev) {
    event.target = null
    event.type = 'pointerdown'
    this.copyEvent(ev)
  }

  onUp(ev) {
    event.target = null
    event.type = 'pointerup'
    this.copyEvent(ev)
  }

  onMove(ev) {
    event.target = null
    event.type = 'pointermove'
    this.copyEvent(ev)
  }

  onCancel(ev) {
    event.target = null
    event.type = 'pointercancel'
    this.copyEvent(ev)
  }

  /**
   * @param {boolean} hit - 只验证 hitArea
   */
  contains(node, hit) {
    if (node.hitArea) {
      node.worldTransform.applyInverse(sp, lp)
      return node.hitArea.contains(lp.x, lp.y)
    } else if (hit) return true
    else return node.contains?.(sp)
  }

  handle(ev, node) {
    if (!node || !node.visible) return

    let queue = [node]

    if (node.interactiveChildren && node.children) {
      while (queue.length) {
        const child = queue.pop()
        if (!child.visible) continue
        queue = (child.children && child.interactiveChildren) ? queue.concat(child.children) : 0
        const contained = this.contains(child)
        if (contained) {
          if (child.interactive) {
            ev.target = child
            break
          } else break
        }
      }
    }

    const {id, target, type} = ev

    touch[id] = touch[id] || {}

    const last = touch[id][type]

    touch[id][type] = target

    if (type === 'pointermove' && last && last !== target) {
      const ne = {...ev}
      ne.type = 'pointerout'
      ne.target = last
      this.dispatch(ne)
    } else if (type === 'pointerup') {
      const last = touch[id]['pointerdown']

      delete touch[id]

      if (last && last !== target) {
        const ne = {...ev}
        ne.type = 'pointerupoutside'
        ne.target = last
        this.dispatch(ne)
      }
    }

    this.dispatch(ev)
  }

  dispatch(ev) {
    let {
      target,
      x, y
    } = ev

    while(target && target.interactive && !ev.stopped) {
      let hit = this.contains(target, true)
      if (hit) {
        ev.currentTarget = target
        target.emit(ev.type, ev)
      }
      target = target.parent
    }
  }

  addEvents() {
    const view = this.#view
    if (pointerable) {
      view.addEventListener('pointerdown', this.onDown.bind(this))
      view.addEventListener('pointerup', this.onUp.bind(this))
      view.addEventListener('pointermove', this.onMove.bind(this))
      view.addEventListener('pointercancel', this.onCancel.bind(this))
    } else if (touchable) {
      view.addEventListener('touchstart', this.onDown.bind(this))
      view.addEventListener('touchend', this.onUp.bind(this))
      view.addEventListener('touchmove', this.onMove.bind(this))
      view.addEventListener('touchcancel', this.onCancel.bind(this))
    } else {
      view.addEventListener('mousedown', this.onDown.bind(this))
      view.addEventListener('mouseup', this.onUp.bind(this))
      view.addEventListener('mousemove', this.onMove.bind(this))
    }
  }
}
const touch = {}
const event = {}
const sp = new PIXI.Point()
const lp = new PIXI.Point()
const pointerable = 'onpointerdown' in window
const touchable = 'ontouchstart' in window

export default class extends PIXI.utils.EventEmitter {
  #view = null
  #cursor = null
  #resolution = 1
  #renderer = null

  constructor(renderer, opt) {
    super()

    this.#renderer = renderer
    this.#view = renderer.view
    this.#view.style.touchAction = 'none'
    this.#resolution = renderer.resolution
    this.#cursor = renderer.view.style.cursor

    this.addEvents()
  }

  mapPositionToPoint(point, x, y) {
    const view = this.#view
    const resolution = this.#resolution
    const resolutionMultiplier = 1 / resolution
    const rect = view.parentElement ? view.getBoundingClientRect() : {x: 0, y: 0, width: 0, height: 0}

    point.x = ((x - rect.left) * (view.width / rect.width)) * resolutionMultiplier
    point.y = ((y - rect.top) * (view.height / rect.height)) * resolutionMultiplier
  }

  copyEvent(ev) {
    const {changedTouches} = ev
    const renderer = this.#renderer
    const root = renderer._lastObjectRendered

    if (changedTouches) {
      for (const touch of changedTouches) {
        this.mapPositionToPoint(sp, touch.pageX, touch.pageY)
        event.origin = ev
        event.stopped = ev.cancelBubble
        event.id = touch.identifier
        event.x = sp.x
        event.y = sp.y
        event.target = this.hitTest(sp, root)
        this.handle(event, root)
      }
    } else {
      this.mapPositionToPoint(sp, ev.pageX, ev.pageY)
      event.origin = ev
      event.stopped = ev.cancelBubble
      event.id = ev.pointerId
      event.x = sp.x
      event.y = sp.y
      event.target = this.hitTest(sp, root)
      this.handle(event, root)
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
   * @param {boolean} hitOnly - 只验证 hitArea
   */
  contains(point, node, hitOnly) {
    let ok = false

    if (node.isMask || !node.interactive) return ok

    if (hitOnly) {
      if (node.hitArea) {
        node.worldTransform.applyInverse(point, lp)
        return node.hitArea.contains(point)
      } else return true
    }

    if (node.hitArea) {
      node.worldTransform.applyInverse(point, lp)
      ok = node.hitArea.contains(lp.x, lp.y)
    } else if (node.containsPoint) {
      ok = node.containsPoint(point)
    }

    if (ok && node._mask && node._mask.containsPoint) {
      ok = node._mask.containsPoint(point)
    }

    return ok
  }

  hitTest(point, root) {
    let queue = [root || this.renderer._lastObjectRendered]
    let target = null

    while (queue.length) {
      const child = queue.pop()

      if (!child.visible) continue

      child.children &&
      child.children.length &&
      child.interactiveChildren &&
      (queue = queue.concat(child.children))

      const contained = this.contains(point, child) || this.#hit(point, child)

      if (contained) {
        const children = child.children && child.children.length && child.children
        if (child.interactive) {
          target = child
          if (children) queue = children.slice(0)
          else break
        } else if (children) queue = queue.concat(children)
      }
    }

    return target
  }

  // 源于对递归的不信任
  #hit(point, container) {
    let queue = [container]

    while (queue.length) {
      const child = queue.pop()

      if (!child.visible) continue

      child.children &&
      child.children.length &&
      child.interactiveChildren &&
      (queue = queue.concat(child.children))

      const contained = this.contains(point, child)

      if (contained) return true
    }
  }

  handle(ev, node) {
    if (!node || !node.visible) return

    const {id, target, type} = ev

    touch[id] = touch[id] || {}

    const last = touch[id][type]

    touch[id][type] = target

    this.dispatch(ev)

    // set custom cursor
    if (type === 'pointermove' && last !== target) {
      this.#view.style.cursor = target && target.cursor || this.#cursor
    }

    // after normally dispatch
    if (type === 'pointermove' && last !== target) {
      // enter current
      let ne = {...ev}
      ne.type = 'pointerenter'
      this.dispatch(ne)

      if (!last) return

      // out last
      ne = {...ev}
      ne.type = 'pointerout'
      ne.target = last
      this.dispatch(ne)
    }

    if (type === 'pointerup') {
      const last = touch[id]['pointerdown']

      delete touch[id]

      if (last && last !== target) {
        const ne = {...ev}
        ne.type = 'pointerupoutside'
        ne.target = last
        this.dispatch(ne)
      } else if (last === target) {
        const ne = {...ev}
        ne.type = 'tap'
        ne.target = target
        this.dispatch(ne)
      }
    }

  }

  dispatch(ev) {
    let {target, x, y} = ev

    while(target && !ev.stopped) {
      ev.currentTarget = target
      target.interactive &&
      target.emit(ev.type, ev)
      target = target.parent
    }

    this.emit(ev.type, ev)
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

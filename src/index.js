const touchable = 'ontouchstart' in window
const pointerable = 'onpointerdown' in window

export default class extends PIXI.utils.EventEmitter {
  #touch = {}
  #event = {}
  #view = null
  #cursor = null
  #resolution = 1
  #renderer = null
  #point = new PIXI.Point()
  #local = new PIXI.Point()

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

    const point = this.#point
    const event = this.#event
    const renderer = this.#renderer
    const root = renderer._lastObjectRendered

    if (changedTouches) {
      for (const touch of changedTouches) {
        this.mapPositionToPoint(point, touch.pageX, touch.pageY)
        event.origin = ev
        event.stopped = ev.cancelBubble
        event.id = touch.identifier
        event.x = point.x
        event.y = point.y
        event.target = this.hitTest(point, root)
        this.handle(event, root)
      }
    } else {
      this.mapPositionToPoint(point, ev.pageX, ev.pageY)
      event.origin = ev
      event.stopped = ev.cancelBubble
      event.id = ev.pointerId
      event.x = point.x
      event.y = point.y
      event.target = this.hitTest(point, root)
      this.handle(event, root)
    }
  }

  onDown(ev) {
    const event = this.#event
    event.target = null
    event.type = 'pointerdown'
    this.copyEvent(ev)
  }

  onUp(ev) {
    const event = this.#event
    event.target = null
    event.type = 'pointerup'
    this.copyEvent(ev)
  }

  onMove(ev) {
    const event = this.#event
    event.target = null
    event.type = 'pointermove'
    this.copyEvent(ev)
  }

  onCancel(ev) {
    const event = this.#event
    event.target = null
    event.type = 'pointercancel'
    this.copyEvent(ev)
  }

  contains(point, node) {
    let ok = false

    if (node.hitArea) {
      const p = this.#local
      node.worldTransform.applyInverse(point, p)
      ok = node.hitArea.contains(p.x, p.y)
    } else if (node.containsPoint) {
      ok = node.containsPoint(point)
    }

    if (ok && node._mask && node._mask.containsPoint) {
      ok = node._mask.containsPoint(point)
    }

    return ok
  }

  hitTest(point, root) {
    let hit
    let queue = [root || this.#renderer._lastObjectRendered]

    while (queue.length) {
      const node = queue.pop()

      if (!node || !node.visible || node.isMask) continue

      const children = node.interactiveChildren && node.children
      const contained = this.contains(point, node)

      if (contained) {
        hit = node
        if (children) {
          queue = children.slice()
          continue
        }
        break
      }

      if (children) for (const child of children) queue.push(child)
    }

    while (hit) {
      if (hit.interactive) return hit
      hit = hit.parent
    }
  }

  handle(ev, node) {
    if (!node || !node.visible) return

    this.dispatch(ev)

    if (ev.stopped) return

    const {id, target, type} = ev

    const touch = this.#touch

    touch[id] = touch[id] || {}

    const last = touch[id][type]

    touch[id][type] = target

    // set custom cursor
    if (type === 'pointermove' && last !== target) {
      this.#view.style.cursor = target?.cursor || this.#cursor
    }

    // after normally dispatch
    if (type === 'pointermove' && last !== target) {
      // enter current
      let clone = {...ev}
      clone.type = 'pointerenter'
      this.dispatch(clone)

      if (!last) return

      // out last
      clone = {...ev}
      clone.type = 'pointerout'
      clone.target = last
      this.dispatch(clone)
    }

    if (type === 'pointerup') {
      const last = touch[id]['pointerdown']

      delete touch[id]

      if (last && last !== target) {
        const clone = {...ev}
        clone.type = 'pointerupoutside'
        clone.target = last
        this.dispatch(clone)
      } else if (last === target) {
        const clone = {...ev}
        clone.type = 'tap'
        clone.target = target
        this.dispatch(clone)
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

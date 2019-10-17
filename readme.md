# Interaction
The interaction plugin for pixi.js.

## Install

```bash
npm i @iro/interaction
```

## Why Use It
1. Unified event type, `Pointer` event only.
2. `Pointerout` and `Pointerupoutside` have `target` value.

## Usage

```js
import Interaction from '@iro/interaction'

PIXI.Renderer.registerPlugin('interaction', Interaction)
```

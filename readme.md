# Interaction
[![npm version](https://img.shields.io/npm/v/@iro/interaction.svg?style=flat&colorB=brightgreen)](https://www.npmjs.com/package/@iro/interaction)
[![npm downloads](https://img.shields.io/npm/dm/@iro/interaction.svg?style=flat&colorB=brightgreen)](https://www.npmjs.com/package/@iro/interaction)

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
// webpack.config.js
plugins: [
  new webpack.ProvidePlugin({
    PIXI: 'pixi.js'
  })
]
```

```js
import Interaction from '@iro/interaction'

// pixi.js@5
PIXI.Renderer.registerPlugin('interaction', Interaction)

// pixi.js@6
// remove default interaction extensions
for (const x in PIXI.extensions._queue) {
  for (const ext of PIXI.extensions._queue[x]) {
    if (ext.name === 'interaction') {
      PIXI.extensions.remove(ext)
    }
  }
}

// add @iro/interaction
PIXI.extensions.add(
  {
    name: 'interaction',
    ref: Interaction,
    type: [PIXI.ExtensionType.RendererPlugin, PIXI.ExtensionType.CanvasRendererPlugin]
  }
)

renderer.plugins.interaction.on('pointerdown', ev => {})
sprite.on('pointerup', ev => {})

/**
 * - tap
 * - pointerup
 * - pointerout
 * - pointermove
 * - pointerdown
 * - pointerenter
 * - pointerupoutside
*/
```

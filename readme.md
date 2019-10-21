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
import Interaction from '@iro/interaction'

PIXI.Renderer.registerPlugin('interaction', Interaction)
```

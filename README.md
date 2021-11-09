[![npm package](https://img.shields.io/npm/v/svg-to-phaser-path?color=limegreen&label=npm%20package&logo=npm&style=plastic)](https://www.npmjs.com/package/svg-to-phaser-path)

## svgToPhaserPath(d, [quadraticToCubic]) ⇒ <code>Phaser.Types.Curves.JSONPath</code>
Converts SVG `<path>` to `Phaser.Curves.Path` instance and returns it as `JSONPath` object.

**Returns**: <code>Phaser.Types.Curves.JSONPath</code> - Object that is the result of calling `toJSON()` method on the converted `Phaser.Curves.Path` instance.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| d | <code>string</code> |  | "d" attribute content of the SVG `<path>` tag. |
| [quadraticToCubic] | <code>boolean</code> | <code>false</code> | Convert Quadratic curves to Cubic. Use this if you are using Phaser version `<=3.55.2` to work around `Path.fromJSON()` parsing bug. |

## Usage:
```js
import svgToPhaserPath from 'svg-to-phaser-path';

const d = `M600,350 l 50,-25
           a25,25 -30 0,1 50,-25 l 50,-25
           a25,50 -30 0,1 50,-25 l 50,-25`;

const jsonPath = svgToPhaserPath(d);

const path = new Phaser.Curves.Path(jsonPath);
```

## If you have missing Quadratic Bezier curves on Phaser version `<=3.55.2`:
### First solution (converting to Cubic Bezier):
```js
const jsonPath = svgToPhaserPath(d, true);
```
### Second solution (manually fixing JSONPath):
```js
const jsonPath = svgToPhaserPath(d);
jsonPath.curves.forEach((curve) => {
  if (curve.type === 'QuadraticBezier') {
    curve.type = 'QuadraticBezierCurve';
  }
});
```
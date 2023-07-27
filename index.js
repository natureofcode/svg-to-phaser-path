import { Curves } from 'phaser';
import arcToBezier from 'svg-arc-to-cubic-bezier';
import { parseSVG, makeAbsolute } from 'svg-path-parser';

const TWO_THIRDS = 2 / 3;

/**
 * Converts SVG `<path>` to `Phaser.Curves.Path` instance and returns it as `JSONPath` object.
 *
 * @param {string} d - "d" attribute content of the SVG `<path>` tag.
 * @param {boolean} [quadraticToCubic=false] - Convert Quadratic curves to Cubic. Use this if you are using Phaser version `<=3.55.2` to work around `Path.fromJSON()` parsing bug.
 * @return {Phaser.Types.Curves.JSONPath} `JSONPath` object that is the result of calling `toJSON()` method on the converted `Phaser.Curves.Path` instance.
 */
function svgToPhaserPath(d, quadraticToCubic = false) {
  const path = new Curves.Path();

  const parsed = makeAbsolute(parseSVG(d));

  const firstMoveTo = parsed[0];

  if (!firstMoveTo) {
    return path.toJSON();
  }

  path.startPoint.setFromObject(firstMoveTo);

  let computedQuadraticPrevX1;
  let computedQuadraticPrevY1;

  let prev = firstMoveTo;

  for (let i = 1; i < parsed.length; i++) {
    const cmd = parsed[i];
    const { code } = cmd;
    const prevCode = prev.code;

    switch (code) {
      case 'M':
        {
          const { x, y } = cmd;

          path.moveTo(x, y);
        }
        break;

      case 'Z':
        {
          const { x, y } = cmd;

          path.lineTo(x, y);
        }
        break;

      case 'L':
      case 'H':
      case 'V':
        {
          const { x, y } = cmd;

          path.lineTo(x, y);
        }
        break;

      case 'C':
        {
          const { x1, y1, x2, y2, x, y } = cmd;

          path.cubicBezierTo(x, y, x1, y1, x2, y2);
        }
        break;

      case 'S':
        {
          const { x0, y0, x2, y2, x, y } = cmd;
          let x1 = x0;
          let y1 = y0;

          if (prevCode === 'C' || prevCode === 'S') {
            x1 = x0 + (x0 - prev.x2);
            y1 = y0 + (y0 - prev.y2);
          }

          path.cubicBezierTo(x, y, x1, y1, x2, y2);
        }
        break;

      case 'Q':
        {
          const { x0, y0, x1, y1, x, y } = cmd;

          computedQuadraticPrevX1 = x1;
          computedQuadraticPrevY1 = y1;

          if (quadraticToCubic) {
            const cubicX1 = x0 + (x1 - x0) * TWO_THIRDS;
            const cubicY1 = y0 + (y1 - y0) * TWO_THIRDS;
            const cubicX2 = x + (x1 - x) * TWO_THIRDS;
            const cubicY2 = y + (y1 - y) * TWO_THIRDS;

            path.cubicBezierTo(x, y, cubicX1, cubicY1, cubicX2, cubicY2);
          } else {
            path.quadraticBezierTo(x, y, x1, y1);
          }
        }
        break;

      case 'T':
        {
          const { x0, y0, x, y } = cmd;
          let x1 = x0;
          let y1 = y0;

          if (prevCode === 'Q' || prevCode === 'T') {
            x1 = x0 + (x0 - computedQuadraticPrevX1);
            y1 = y0 + (y0 - computedQuadraticPrevY1);
          }

          computedQuadraticPrevX1 = x1;
          computedQuadraticPrevY1 = y1;

          if (quadraticToCubic) {
            const cubicX1 = x0 + (x1 - x0) * TWO_THIRDS;
            const cubicY1 = y0 + (y1 - y0) * TWO_THIRDS;
            const cubicX2 = x + (x1 - x) * TWO_THIRDS;
            const cubicY2 = y + (y1 - y) * TWO_THIRDS;

            path.cubicBezierTo(x, y, cubicX1, cubicY1, cubicX2, cubicY2);
          } else {
            path.quadraticBezierTo(x, y, x1, y1);
          }
        }
        break;

      case 'A':
        {
          const { x0, y0, rx, ry, xAxisRotation, x, y } = cmd;
          const largeArcFlag = cmd.largeArc ? 1 : 0;
          const sweepFlag = cmd.sweep ? 1 : 0;

          if (x0 === x && y0 === y) {
            break;
          }

          if (rx === 0 || ry === 0) {
            path.lineTo(x, y);
            break;
          }

          const curves = arcToBezier({
            px: x0,
            py: y0,
            cx: x,
            cy: y,
            rx,
            ry,
            xAxisRotation,
            largeArcFlag,
            sweepFlag,
          });

          const ending = curves[curves.length - 1];
          ending.x = x;
          ending.y = y;

          for (const cubic of curves) {
            path.cubicBezierTo(
              cubic.x,
              cubic.y,
              cubic.x1,
              cubic.y1,
              cubic.x2,
              cubic.y2
            );
          }
        }
        break;
    }

    prev = cmd;
  }

  const result = path.toJSON();
  result.curves.forEach((curve) => {
    if (curve.type === 'QuadraticBezier') {
      curve.type = 'QuadraticBezierCurve';
    }
  });

  return result;
}

export default svgToPhaserPath;

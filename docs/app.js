import Phaser from 'phaser';
import debounce from 'lodash.debounce';
import svgToPhaserPath from '../index.js';

const FRAME_THICKNESS = 10;

const defaultD = `M0,0 l 50,-25
a25,25 -30 0,1 50,-25 l 50,-25
a25,50 -30 0,1 50,-25 l 50,-25
a25,75 -30 0,1 50,-25 l 50,-25
a25,100 -30 0,1 50,-25 l 50,-25`;

const el = {
  /** @type {HTMLDivElement} */
  parent: document.getElementById('preview'),
  /** @type {HTMLTextAreaElement} */
  inputSVG: document.getElementById('inputSVG'),
  /** @type {HTMLTextAreaElement} */
  outputJSON: document.getElementById('outputJSON'),
  /** @type {HTMLInputElement} */
  toCubicSwitch: document.getElementById('toCubicSwitch'),
};

el.inputSVG.placeholder = defaultD;

class PreviewScene extends Phaser.Scene {
  init() {
    this.graphics = this.add.graphics({
      lineStyle: {
        width: 3,
        color: 0xfff000,
      },
    });

    const inputHandler = debounce(this.onInput.bind(this), 50, {
      leading: true,
    });

    el.inputSVG.oninput = inputHandler;
    el.toCubicSwitch.onchange = inputHandler;

    this.scale.on('resize', this.preview.bind(this));

    this.onInput();
  }

  onInput() {
    const inputStr = el.inputSVG.value.trim();
    let outputStr;

    try {
      const jsonPath = svgToPhaserPath(
        inputStr !== '' ? inputStr : defaultD,
        el.toCubicSwitch.checked
      );
      outputStr = JSON.stringify(jsonPath);
      this.path = new Phaser.Curves.Path(jsonPath);
    } catch (error) {
      outputStr = error.toString();
      this.path = null;
    }

    el.outputJSON.value = outputStr;

    this.preview();
  }

  preview() {
    const { graphics, path } = this;

    graphics.clear();

    if (!path) {
      return;
    }

    const bounds = path.getBounds();

    // https://stackoverflow.com/a/13385021/13260313

    const w1 = this.renderer.width;
    const h1 = this.renderer.height;
    const w2 = bounds.width + FRAME_THICKNESS * 2;
    const h2 = bounds.height + FRAME_THICKNESS * 2;

    const fatness1 = w1 / h1;
    const fatness2 = w2 / h2;

    const scale = fatness2 >= fatness1 ? w1 / w2 : h1 / h2;

    const w3 = w2 * scale;
    const h3 = h2 * scale;

    const x3 = w1 / 2 - w3 / 2;
    const y3 = h1 / 2 - h3 / 2;

    graphics.translateCanvas(
      -bounds.x + FRAME_THICKNESS,
      -bounds.y + FRAME_THICKNESS
    );
    graphics.setScale(scale);
    graphics.setPosition(x3, y3);

    path.draw(graphics);
  }
}

const game = new Phaser.Game({
  title: 'SVG to Phaser Path Preview',
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
    parent: el.parent,
    width: '100%',
    height: '100%',
  },
  audio: {
    noAudio: true,
  },
  input: false,
  powerPreference: 'low-power',
  scene: [PreviewScene],
});

game.canvas.classList.add('rounded-lg');

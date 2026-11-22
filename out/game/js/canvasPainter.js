// Canvas2D implementation of the small drawing vocabulary render.js and ui.js use.
const MONO = '"DejaVu Sans Mono", "Courier New", monospace';
const SANS = '"DejaVu Sans", "Trebuchet MS", sans-serif';

function applyStyle(ctx, style) {
  if (typeof style === 'string') {
    ctx.fillStyle = style;
    ctx.strokeStyle = style;
    return;
  }
  if (style && style.stops) {
    const grad = ctx.createLinearGradient(style.x0, style.y0, style.x1, style.y1);
    for (const [at, color] of style.stops) grad.addColorStop(at, color);
    ctx.fillStyle = grad;
    ctx.strokeStyle = grad;
  }
}

function shape(ctx, opts, fill) {
  ctx.globalAlpha = opts.alpha ?? 1;
  if (fill) {
    applyStyle(ctx, fill);
    ctx.fill();
  }
  if (opts.stroke) {
    applyStyle(ctx, opts.stroke);
    ctx.lineWidth = opts.lw ?? 1;
    ctx.setLineDash(opts.dash ?? []);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;
}

export function createCanvasPainter(ctx) {
  const api = {
    clear(color) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    },
    rect(x, y, w, h, fill, opts = {}) {
      ctx.beginPath();
      if (opts.r) ctx.roundRect(x, y, w, h, opts.r);
      else ctx.rect(x, y, w, h);
      shape(ctx, opts, fill);
    },
    circle(x, y, r, fill, opts = {}) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      shape(ctx, opts, fill);
    },
    ellipse(x, y, rx, ry, fill, opts = {}) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, opts.rotation ?? 0, 0, Math.PI * 2);
      shape(ctx, opts, fill);
    },
    poly(points, fill, opts = {}) {
      if (!points.length) return;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.closePath();
      shape(ctx, opts, fill);
    },
    line(x1, y1, x2, y2, color, width = 1, opts = {}) {
      ctx.globalAlpha = opts.alpha ?? 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(opts.dash ?? []);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    },
    ring(x, y, r, color, width = 1, opts = {}) {
      ctx.globalAlpha = opts.alpha ?? 1;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.1, r), opts.from ?? 0, opts.to ?? Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(opts.dash ?? []);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    },
    text(x, y, content, size, color, opts = {}) {
      ctx.globalAlpha = opts.alpha ?? 1;
      ctx.font = `${opts.weight ?? 400} ${size}px ${opts.font === 'sans' ? SANS : MONO}`;
      ctx.textAlign = opts.align ?? 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      if (opts.letterSpacing !== undefined && 'letterSpacing' in ctx) ctx.letterSpacing = `${opts.letterSpacing}px`;
      ctx.fillText(String(content), x, y);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.globalAlpha = 1;
    },
    glow(x, y, r, color, alpha = 0.4) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    gradientRect(x, y, w, h, stops, vertical = true) {
      const grad = ctx.createLinearGradient(x, y, vertical ? x : x + w, vertical ? y + h : y);
      for (const [at, color] of stops) grad.addColorStop(at, color);
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
    },
  };
  return api;
}

export function createRecordingPainter() {
  const commands = [];
  const api = { commands };
  for (const name of ['clear', 'rect', 'circle', 'ellipse', 'poly', 'line', 'ring', 'text', 'glow', 'gradientRect']) {
    api[name] = (...args) => {
      commands.push({ op: name, args: JSON.parse(JSON.stringify(args)) });
    };
  }
  return api;
}

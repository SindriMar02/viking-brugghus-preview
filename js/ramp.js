/* Night-village colour ramp (DESIGN.md section 6): keep the ink's hue, move saturation and lightness by the deltas measured on the Jólabjór wrap
   (sky #A9212F; cloud and ridge light #C3303E; shadow #8A171A; house face #AD4842; house light #C78068). Estimates for the other hues; check by eye. */
window.VIKING.ramp = function (hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; let h = 0, s = 0;
  if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  const hsl = (ds, dl) => {
    const S = Math.min(1, Math.max(0, s + ds)), L = Math.min(.95, Math.max(.05, l + dl)), C = (1 - Math.abs(2 * L - 1)) * S, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = L - C / 2;
    const [R, G, B] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
    return 'rgb(' + [R + m, G + m, B + m].map(v => Math.round(v * 255)).join(',') + ')';
  };
  return { sky: hex, hi: hsl(-.07, .08), shade: hsl(.04, -.08), house: hsl(-.22, .073), houseHi: hsl(-.21, .198) };
};

/* English labels for the Icelandic style classifications (verified source strings stay in data.js; this only translates them for /en/). */
window.VIKING.styleEn = { 'Léttur lager': 'Light lager', 'Sterkur Lager': 'Strong lager', 'Amber, Vínar, Classic': 'Amber, Vienna, Classic', 'Annar hveitibjór': 'Other wheat beer', 'Kryddbjór': 'Spiced beer' };

// H-bear symbol geometry (viewBox 0 0 512 512)
// White "H" (two legs + muzzle crossbar) cut out of a navy bear head.
export const NAVY = '#17325B';
export function symbolBody({ fg = NAVY, bg = '#FFFFFF', withCode = true } = {}) {
  const head = `<ellipse cx="256" cy="294" rx="222" ry="196"/>`;
  const ears = `<circle cx="120" cy="126" r="76"/><circle cx="392" cy="126" r="76"/>`;
  const legs = `<rect x="96" y="104" width="48" height="320" rx="24"/><rect x="368" y="104" width="48" height="320" rx="24"/>`;
  // muzzle: arched top, rounded bottom
  const muzzle = `<path d="M120 318 Q256 218 392 318 L392 378 Q256 470 120 378 Z"/>`;
  const eyes = `<circle cx="170" cy="244" r="24"/><circle cx="342" cy="244" r="24"/>`;
  const nose = `<rect x="226" y="286" width="60" height="32" rx="16"/>`;
  const code = withCode
    ? `<g fill="none" stroke="${fg}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"><path d="M226 331 L211 344 L226 357"/><path d="M286 331 L301 344 L286 357"/><path d="M264 328 L248 360"/></g>`
    : '';
  return `<g fill="${fg}">${head}${ears}</g><g fill="${bg}">${legs}${muzzle}${eyes}</g><g fill="${fg}">${nose}</g>${code}`;
}
export function symbolSvg(opts = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${symbolBody(opts)}</svg>`;
}

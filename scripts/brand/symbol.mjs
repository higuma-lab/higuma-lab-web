// H-bear symbol geometry (viewBox 0 0 512 512)
export const NAVY = '#17325B';
export function symbolBody({ fg = NAVY, bg = '#FFFFFF', withCode = true } = {}) {
  // navy silhouette: head ellipse + two ears
  const head = `<ellipse cx="256" cy="292" rx="200" ry="182"/>`;
  const ears = `<circle cx="146" cy="138" r="84"/><circle cx="366" cy="138" r="84"/>`;
  // white H: two legs + muzzle crossbar with arched top
  const legL = `<rect x="122" y="118" width="54" height="290" rx="27"/>`;
  const legR = `<rect x="336" y="118" width="54" height="290" rx="27"/>`;
  const bar = `<path d="M166 300 Q256 226 346 300 L346 352 L166 352 Z"/>`;
  const eyes = `<circle cx="214" cy="212" r="18"/><circle cx="298" cy="212" r="18"/>`;
  const nose = `<rect x="232" y="272" width="48" height="25" rx="12.5"/>`;
  const code = withCode
    ? `<g fill="none" stroke="${fg}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
        <path d="M226 309 L211 322 L226 335"/><path d="M286 309 L301 322 L286 335"/><path d="M264 306 L248 338"/></g>`
    : '';
  return `<g fill="${fg}">${head}${ears}</g>
  <g fill="${bg}">${legL}${legR}${bar}${eyes}</g>
  <g fill="${fg}">${nose}</g>${code}`;
}
export function symbolSvg(opts = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${symbolBody(opts)}</svg>`;
}

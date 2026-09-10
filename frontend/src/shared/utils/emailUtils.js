export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return emailRegex.test(email?.trim());
}

export function hasCuerpoContent(html) {
  if (!html || typeof html !== 'string') return false;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  if (tmp.textContent.trim().length > 0) return true;
  return tmp.querySelector('img, video, audio, picture, figure, svg, canvas, iframe, object, embed') !== null;
}

export function toast(message, type = 'info') {
  const event = new CustomEvent('aegis-toast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
}
export default toast;

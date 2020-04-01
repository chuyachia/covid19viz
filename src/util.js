export function addElementUnder(element, props, style, elementId, parentElement) {
  const newElement = document.createElement(element);
  if (elementId && elementId.length > 0) {
    newElement.setAttribute('id',elementId);
  }
  for (let p in props) {
    newElement.setAttribute(p, props[p]);
  }

  for (let s in style) {
    newElement.style[s] = style[s];
  }

  if (!parentElement) {
    parentElement =  document.body;
  }
  parentElement.appendChild(newElement);

  return newElement;
}
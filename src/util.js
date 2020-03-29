export function addElementUnder(element, props, style, elementId, parentId) {
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

  let parent = document.getElementById(parentId);
  if (!parent) {
    parent =  document.body;
  }
  parent.appendChild(newElement);

  return newElement;
}
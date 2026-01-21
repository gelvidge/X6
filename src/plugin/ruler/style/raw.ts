export const content = `
.x6-ruler {
  position: absolute;
  user-select: none;
}

.x6-ruler-horizontal {
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
}

.x6-ruler-vertical {
  top: 0;
  left: 0;
  width: 20px;
  height: 100%;
}

.x6-ruler-mouse-position {
  position: absolute;
  background-color: #ff0000;
  pointer-events: none;
  z-index: 1000;
}

#hMousePosition {
  width: 2px;
  height: 20px;
  top: 0;
}

#vMousePosition {
  width: 20px;
  height: 2px;
  left: 0;
}
`

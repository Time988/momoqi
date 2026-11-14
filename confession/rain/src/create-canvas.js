// Adapted from Lucas Bebber / Codrops RainEffect (2015). See ../NOTICE.txt.
export default function createCanvas(width,height){
  let canvas=document.createElement("canvas");
  canvas.width=width;
  canvas.height=height;
  return canvas;
}

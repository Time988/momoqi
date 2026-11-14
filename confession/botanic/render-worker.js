// Canvas adapter for Lingdong Huang's original Nonflowers renderer.
// Its RNG/prototype changes are confined to this worker, never the gift page.
self.window={btoa:value=>self.btoa(value),location:{href:''}};
self.document={createElement(tag){if(tag==='canvas')return new OffscreenCanvas(1,1);throw new Error('Unsupported renderer element')}};
importScripts('./vendor/nonflowers.js?v=botanic-1');
vizParams=()=>{};
const palettes={
  rose:{min:[343,.32,.91,.98],max:[354,.16,1,.82]},
  ivory:{min:[37,.13,.93,.98],max:[48,.05,1,.88]},
  lilac:{min:[269,.29,.86,.97],max:[287,.16,.99,.85]}
};
async function paint(request){
  Math.seed(request.seed);Noise.noiseSeed(request.seed);
  if(request.type==='paper'){
    const sheet=paper({col:[.994,.981,.949],tex:3,spr:.16});
    const blob=request.cache?await sheet.convertToBlob({type:'image/png'}):null;
    const bitmap=sheet.transferToImageBitmap();postMessage({type:'paper',bitmap,blob},[bitmap]);return;
  }
  const params=genParams();
  if(request.woody){params.flowerChance=.075;params.branchDepth=3;params.branchFork=5;}
  params.flowerColor=palettes[request.palette]||palettes.rose;
  // Shape ranges remain within the original author's parameter space.
  params.stemCount=2+(request.variant%3);
  params.leafChance=.04;
  params.leafPosition=2;
  params.leafLength=32;
  params.leafWidth=10;
  params.flowerLength=44+(request.variant%2)*6;
  params.flowerWidth=22+(request.variant%2)*4;
  params.shootCount=4;
  params.sheathLength=0;
  let result;
  (request.woody?woody:herbal)({ctx:Layer.empty(600,600),xof:300,yof:590,PAR:params,onLayers(stems,petals,bounds){result={stems,petals,bounds}}});
  const b=result.bounds,pad=5;
  const x=Math.max(0,Math.floor(b.xmin)-pad),y=Math.max(0,Math.floor(b.ymin)-pad);
  const width=Math.max(1,Math.min(1200-x,Math.ceil(b.xmax)-x+pad));
  const height=Math.max(1,Math.min(1200-y,Math.ceil(b.ymax)-y+pad));
  const stems=await createImageBitmap(result.stems.canvas,x,y,width,height),petals=await createImageBitmap(result.petals.canvas,x,y,width,height);
  async function encode(bitmap){const layer=new OffscreenCanvas(width,height);layer.getContext('2d').drawImage(bitmap,0,0);return layer.convertToBlob({type:'image/png'})}
  const [stemsBlob,petalsBlob]=request.cache?await Promise.all([encode(stems),encode(petals)]):[null,null];
  postMessage({type:'plant',key:request.key,stems,petals,width,height,stemsBlob,petalsBlob},[stems,petals]);
}
let queue=Promise.resolve();
self.onmessage=event=>{queue=queue.then(()=>paint(event.data)).catch(error=>postMessage({type:'error',message:String(error)}))};

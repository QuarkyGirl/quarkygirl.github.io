const foreground = [191,74,168];
const background = "#51d0de";

const boxName = "Box";
const box = document.getElementById(boxName);

const boxContainerName = "BoxContainer";
const boxContainer = document.getElementById(boxContainerName);
const mouseContainerName = "MouseListener";
const mouseListener = document.getElementById(mouseContainerName);

var width = parseFloat(box.clientWidth);
var height = parseFloat(box.clientHeight);
var ctx = box.getContext('2d');
const dpr = 4;
box.width = dpr *width;
box.height = dpr *height;
ctx.scale(dpr,dpr)
//ctx.imageSmoothingEnabled = true;
var leftOffset = document.getElementById("Name").getBoundingClientRect().left;


const bodyContainer = document.getElementsByClassName("BodyContainer")[0];
var contentwidth = parseFloat(bodyContainer.clientWidth);

const cx = -.5215;
const cy = .522 ;
const maxIter = 500;
const maxAdd = 50;
const maxPoints = 10000;

var voronoi = d3.voronoi();
voronoi.extent([[0,0],[width,height]]);

var colors = [];
var iters = [];
var xyArray = [];

function drawBackground(){
  ctx.fillStyle = background;
  ctx.clearRect(0, 0, width, height);
  ctx.fillRect(0, 0, width, height);
}

function getColor(niter){
  let colorcalc = (1 - 1/((niter/40)**2.0 + 1));
  let r = Math.round(255 - (255-foreground[0])*colorcalc);
  let g = Math.round(255 - (255-foreground[1])*colorcalc);
  let b = Math.round(255 - (255-foreground[2])*colorcalc);
  let opacity = 1 - 1/((niter/10)**2 + 1);
  return "rgba("+ r.toString()+ "," + g.toString() + "," + b.toString() + "," + opacity.toString() +")";
}

function drawPolygon(polygon, color){
  ctx.fillStyle = color;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 0.1;
  ctx.beginPath();
  ctx.moveTo(Math.floor(polygon[0][0]), Math.floor(polygon[0][1]))
  let i;
  for (i = 1; i < polygon.length; i++) {
    ctx.lineTo(Math.floor(polygon[i][0]), Math.floor(polygon[i][1]));
  }
  ctx.lineTo(Math.floor(polygon[0][0]), Math.floor(polygon[0][1]));
  ctx.stroke();
  ctx.fill();
}

function getVoronoi(){
  return voronoi.polygons(xyArray);
}

function updateClient() {
  if ((width != parseFloat(boxContainer.clientWidth))||(height != parseFloat(boxContainer.clientHeight))){
    xyArray=[];
    colors=[];
    width = parseFloat(boxContainer.clientWidth);
    height = parseFloat(boxContainer.clientHeight);
    contentwidth = parseFloat(bodyContainer.clientWidth);
    box.width = dpr*parseFloat(boxContainer.clientWidth);
    box.height = dpr*parseFloat(boxContainer.clientHeight);
    ctx = box.getContext('2d');
    ctx.scale(dpr, dpr);
    voronoi.extent([[0,0],[width,height]]);
    leftOffset = document.getElementById("Name").getBoundingClientRect().left;
    drawBackground();
  }
}

function addPoint(xval,yval){
  let scale = 1.3 * width/contentwidth;
  let zx =  -scale* (xval - 0.5*width)/width;
  let zy = scale*(-yval + 0.5*height)/width;
  let t = -Math.atan2(height,width) +0.78;
  let newzx = Math.cos(t)*zx + Math.sin(t)*zy;
  let newzy = -Math.sin(t)*zx + Math.cos(t)*zy;
  zx = newzx;
  zy = newzy;

  let niter = maxIter;
  //AllColors[id] = 0.5*Math.random();
  let i;
  for (i = 0; i < maxIter; i++){
    newzx = zx*zx - zy*zy + cx;
    newzy = 2 * zx * zy + cy;
    zx = newzx;
    zy = newzy;
    if (zx*zx + zy*zy >= 4){
      niter = i;
      break;
    }
  }
  iters.push(niter);
  colors.push(getColor(niter));
  xyArray.push([xval,yval]);
}


function biasSampler(sigma,mu,min,max){
  let result;
  let u;
  let v
  while (true) {
    u = 0;
    v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    result = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )*sigma + mu;
    if ((result > min) && (result < width)) return result;
  }
}

function addPoints(nPoints) {
  let i;
  let unit;
  let xval;
  for(i = 0; i < nPoints; i++){
    unit = width;
    xval = Math.random()*width;//biasSampler(0.5*unit,0.5*unit,0,width);
    yval = Math.random()*height;
    addPoint(xval,yval);
  }
}

function addPolygons(num){
  addPoints(num);
  let polygons = getVoronoi();
  let i;
  for (i = colors.length-num; i < colors.length; i++){
    drawPolygon(polygons[i], background);
    drawPolygon(polygons[i], colors[i]);
  }
}


function Animate() {
  updateClient();
  //var numpoints = colors.length;
  if(colors.length == 0) addPolygons(1);
  if(colors.length < maxPoints){
    addPolygons(Math.min(Math.ceil(colors.length**0.5),50));
  }
  requestAnimationFrame(Animate);
}

function clickFunc(event){
  xyArray=[];
  colors=[];
  drawBackground();
}

mouseListener.addEventListener("click", function(event){clickFunc(event);});

drawBackground();
Animate();

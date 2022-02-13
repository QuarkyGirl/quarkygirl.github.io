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

var t = 0;
var cx = 0;
var cy = 0;

const maxIter = 500;
const maxAdd = 50;
const maxPoints = 10000;

var voronoi = d3.voronoi();
voronoi.extent([[0,0],[width,height]]);

var colors = [];
var xyArray = [];

function cardioid(t){
  var xval = (2 * Math.cos(t) - Math.cos(2*t))/4;
  var yval = (2 * Math.sin(t) - Math.sin(2*t))/4;
  return [xval,yval];
}

function setC(){
  t =   -Math.PI * (Math.random()+ 0.5);
  cx = 1.03*cardioid(t)[0];
  cy = 1.03*cardioid(t)[1];
  console.log(t,cx,cy);
}

setC();

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
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(Math.floor(polygon[i][0]), Math.floor(polygon[i][1]));
  }
  ctx.lineTo(Math.floor(polygon[0][0]), Math.floor(polygon[0][1]));
  ctx.stroke();
  ctx.fill();
}

function getVoronoi(){
  var polygons = voronoi.polygons(xyArray);
  return polygons;
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
    leftOffset =  document.getElementById("Name").getBoundingClientRect().left;
    drawBackground();
  }
}

function complexPower(a,b,n){
  var resulta = a;
  var resultb = b;
  for (let i = 0; i < n - 1; i++){
    var newa = resulta * a - resultb * b;
    var newb = resulta * b + resultb *a;
    resulta = newa;
    resultb = newb;
  }
  return [resulta,resultb];
}

function addPoint(xval,yval){
  let scale = 1.3 * width/contentwidth;
  let zx =  -scale* (xval - 0.5*width)/width;
  let zy = scale*(-yval + 0.5*height)/width;
  dt = -Math.atan2(height,width);
  let newzx = Math.cos(-t +dt)*zx + Math.sin(-t+dt)*zy;
  let newzy = -Math.sin(-t+dt)*zx + Math.cos(-t+dt)*zy;
  zx = newzx;
  zy = newzy;

  var niter = maxIter;
  //AllColors[id] = 0.5*Math.random();
  for (let i = 0; i < maxIter; i++){
    zpow = complexPower(zx,zy,2)
    newzx = zpow[0] + cx;
    newzy = zpow[1] + cy;
    zx = newzx;
    zy = newzy;
    if (zx*zx + zy*zy >= 4){
      niter = i;
      break;
    }
  }
  colors.push(getColor(niter));
  xyArray.push([xval,yval]);
}

function biasSampler(sigma,mu,min,max){
  while (true) {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    var result = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )*sigma + mu;
    if ((result > min) && (result < width)) return result;
  }
}

function addPoints(nPoints) {
  for(let i = 0; i < nPoints; i++){
    var unit = Math.min(width,height);
    xval = Math.random()*width;//biasSampler(0.5*unit,0.5*unit,0,width);
    yval = Math.random()*height;
    addPoint(xval,yval);
  }
}

function addPolygons(num){
  addPoints(num);
  polygons = getVoronoi();
  for (let i = colors.length-num; i < colors.length; i++){
    var polygon = polygons[i];
    drawPolygon(polygon, background);
    drawPolygon(polygon, colors[i]);
  }
}


function Animate() {
  updateClient();
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
  setC();
}

mouseListener.addEventListener("click", function(event){clickFunc(event);});

drawBackground();
Animate();

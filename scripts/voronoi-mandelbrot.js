  var svgNS = "http://www.w3.org/2000/svg";

const visibleDots = false;
const radius = "2.5";
const strokewidth = "0";
const track = false;
const mouseIndex = -1;

// this variable labels whether any touch events are detected;
// if it is true, it suppresses all mouseenters
var isMobile = false;

var boxName = "Box";
const box = document.getElementById(boxName);

var boxContainerName = "BoxContainer";
var boxContainer = document.getElementById(boxContainerName);
var mouseContainerName = "MouseListener";
var mouseListener = document.getElementById(mouseContainerName);

var width = parseFloat(box.clientWidth);
var height = parseFloat(box.clientHeight);
var ctx = box.getContext('2d');
const dpr = 4;
box.width = dpr *width;
box.height = dpr *height;
ctx.scale(dpr,dpr)
//ctx.imageSmoothingEnabled = true;
box.style.width  = '100%';
box.style.height = '100%';

var leftOffset = document.getElementById("Name").getBoundingClientRect().left;

//cx = -0.4;
//cy = 0.6;

const maxIter = 100;
const maxAdd = 50;
const maxPoints = 5000;

var voronoi = d3.voronoi();
voronoi.extent([[0,0],[width,height]]);

var colors = [];
var xyArray = [];

function drawBackground(){
  ctx.fillStyle = "#82c5d6";
  ctx.clearRect(0, 0, width, height);
  ctx.fillRect(0, 0, width, height);
}

function getColor(niter){
  //var r = 255;
  var g = Math.round(255 - 80*(1 - 1/((niter/20)**2 + 1)));
  var b = Math.round(255 - 56*(1 - 1/((niter/20)**2 + 1)));
  var opacity = 1 - 1/(niter/5 + 1);
  return "rgba(255," + g.toString() + "," + b.toString() + "," + opacity.toString() +")";
}

function drawPolygon(polygon, color){
  ctx.fillStyle = color;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 0.1;
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1])
  for (var i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.lineTo(polygon[0][0], polygon[0][1]);
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
    box.width = dpr*parseFloat(boxContainer.clientWidth);
    box.height = dpr*parseFloat(boxContainer.clientHeight);
    ctx = box.getContext('2d');
    ctx.scale(dpr, dpr);
    voronoi.extent([[0,0],[width,height]]);
    leftOffset = leftOffset = document.getElementById("Name").getBoundingClientRect().left;
    drawBackground();
  }
}

function addPoint(xval,yval){
  var zx = 0;
  var zy = 0;
  var cx =  2*(-xval + leftOffset)/Math.min(width,height)  + 0.5;
  var cy = 2*(-yval + 0.5*height)/Math.min(width,height);
  var niter = maxIter;
  //AllColors[id] = 0.5*Math.random();
  for (var i = 0; i < maxIter; i++){
    var newzx = zx*zx - zy*zy + cx;
    var newzy = 2 * zx * zy + cy;
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

function biasSampler(sigma,mu){
  while (true) {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    var result = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )*sigma + mu;
    if ((result > 0) && (result < 1)) return result;
  }
}

function addPoints(nPoints) {
  for(var i = 0; i < nPoints; i++){
    var unit = Math.min(width,height);
    var xval = biasSampler(0.7*unit/width,leftOffset/width + 0.5*unit/width)*(width);
    var yval = Math.random()*height;
    addPoint(xval,yval);
  }
}

function addPolygons(num){
  addPoints(num);
  polygons = getVoronoi();
  newpolygons = polygons.slice(colors.length-num);
  newcolors = colors.slice(colors.length-num)
  for (var i in newpolygons){
    var polygon = newpolygons[i];
    drawPolygon(polygon, "#82c5d6");
    drawPolygon(polygon, newcolors[i]);
  }
}


function Animate() {
  updateClient();
  var numpoints = colors.length;
  if(numpoints == 0) addPolygons(1);
  if(numpoints < maxPoints){
    addPolygons(Math.min(Math.ceil(numpoints**0.5),20));
  }
  requestAnimationFrame(Animate);
}

function clickFunc(event){
    //removeMousePoint();
    var x0 = boxContainer.offsetLeft;
    var y0 = boxContainer.offsetTop;
    addPoint(event.clientX - x0, event.clientY - y0);
}

//mouseListener.addEventListener("click", function(event){clickFunc(event);});

drawBackground();
Animate();

var width = window.innerWidth;
var height = window.innerHeight;
var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.setClearColor(0xeeeeff);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.zIndex = "0";
document.body.appendChild(renderer.domElement);

var lap=document.createElement("div");
lap.style.position="absolute";
lap.style.zIndex="1";
lap.style.color="white";
document.body.appendChild(lap);

var targetList=[];
var projector = new THREE.Projector();
/*
var ray = new THREE.Raycaster(new THREE.Vector3(camera.position.x, camera.position.y - 0.5 + i, camera.position.z), new THREE.Vector3(vx, 0, vz).normalize());
var obj = ray.intersectObjects(targetList);
if (obj.length > 0) {
}
*/
var ambient=0x114477;
var sun=0xeebb88;
var camera = new THREE.PerspectiveCamera();
camera.aspect=width/height;
camera.updateProjectionMatrix();
camera.position.z = -5;
camera.position.y = 3;
camera.rotation.y=Math.PI;
var scene = new THREE.Scene();
var Car=function(){
    this.cp=0;
    this.lap=1;
    this.mesh=null;
    this.setMesh=function(geo,mat){
        this.mesh=new THREE.Mesh(geo,mat);
        scene.add(this.mesh);
    }
    this.pos={x:0,z:-20};
    this.vel={x:0,z:0};
    this.rot=0;//radian
    this.fric=1;
    this.drag=1;
    this.acc=0;
    this.terminalVelocity=10;
    this.updateMesh=function(){
        this.mesh.position.x=-this.pos.x;
        this.mesh.position.z=this.pos.z;
        this.mesh.rotation.y=this.rot;
    }
    this.physics=function(dt){
        //ma+kv=0
        //k=-ma/vel
        var drag=-1/this.terminalVelocity;
        var a=rotate(0,this.acc,this.rot);
        var v=Math.sqrt(this.vel.x*this.vel.x+this.vel.z*this.vel.z);
        this.vel.x+=dt*a.x;
        this.vel.z+=dt*a.y;
        var v1=rotate(this.vel.x,this.vel.z,-this.rot);
        var relativeSideForce=v1.x;
        var sideforce=rotate(v1.x,0,this.rot);
        this.vel.x-=sideforce.x*dt;
        this.vel.z-=sideforce.y*dt;
        this.vel.x+=this.vel.x*drag*dt;
        this.vel.z+=this.vel.z*drag*dt;
        /*
        {
        var ray = new THREE.Raycaster(new THREE.Vector3(-this.pos.x,0,this.pos.z), new THREE.Vector3(-a.x, 0, a.y).normalize());
        var obj = ray.intersectObjects(targetList);
        if (obj.length > 0) {
            var d=obj[0].distance;
            var dx=this.vel.x*dt;
            var dz=this.vel.z*dt;
            dx+=0.5;
            dz+=0.5;
            if(d*d<dx*dx+dz*dz){
                this.vel.x*=-0.7;
                this.vel.z*=-0.7;
            }
        }
        }*/
        var res=8;
        var collided=false;
        
        for(var i=-res/2;i<res/2;i++){
            if(collided)continue;
            var rv=rotate(this.vel.x/v,this.vel.z/v,Math.PI/2/res*i);
            var ray = new THREE.Raycaster(new THREE.Vector3(-this.pos.x,0,this.pos.z), new THREE.Vector3(-rv.x, 0, rv.y).normalize());
            var obj = ray.intersectObjects(targetList);
            if (obj.length > 0) {
                var d=obj[0].distance;
                if(d<1){
                    this.vel.x=-rv.x*v;
                    this.vel.z=-rv.y*v;
                    collided=true;
                }
            } 
        }
        this.pos.x+=this.vel.x*dt;
        this.pos.z+=this.vel.z*dt;
        var relativevelX;
        var relativevelZ;
    }
}


var carGeo = new THREE.CubeGeometry(2, 2, 2);
var carMat = new THREE.MeshLambertMaterial( { color: 0xff0000} )
var player=new Car();
player.setMesh(carGeo,carMat);

var light = new THREE.DirectionalLight(sun,2);
light.position.set(1, 1, 2).normalize();
scene.add( light );

var l2 = new THREE.AmbientLight(ambient);
scene.add( l2 );
function addcube(x,y,z){
    var geometry = new THREE.CubeGeometry(2, 2, 2);
    var material = new THREE.MeshLambertMaterial( { color: 0xffffff} );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.x=x;
    mesh.position.y=y;
    mesh.position.z=z;
    scene.add( mesh );
    targetList.push(mesh);
}
function addlongcube(x,y,z,sx,sy,sz){
    var geometry = new THREE.CubeGeometry(sx, sy, sz);
    var material = new THREE.MeshLambertMaterial( { color: 0xffffff} );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.x=x;
    mesh.position.y=y;
    mesh.position.z=z;
    scene.add( mesh );
    targetList.push(mesh);
}
for(var i=-10;i<10;i++){
    addcube(2,0,i*4);
}
addlongcube(-5,0,0,2,1,20);
//network
var cid=null;
doget(null,"/newcar",function(e){
    cid=Number.parseInt(e);
    alert("your cid is "+cid);
})


var lasttime=new Date().getTime();
var keysPress=new Array(1000);
var handle=0;
function rotate(x,y,r){
    var cos=Math.cos(r);
    var sin=Math.sin(r);
    var p={x:x*cos-y*sin,y:x*sin+y*cos};
    return p;
}
function timer(){
    var timenow=new Date().getTime();
    var dt=timenow-lasttime;
    dt*=0.001;
    handle=0;
    lap.innerHTML=player.lap;
    if(keysPress[37]==true)handle=1;
    if(keysPress[39]==true)handle=-1;
    player.rot+=handle*dt*1;
    player.acc=1;
    player.physics(dt);
    player.updateMesh();
    camera.position.x=player.mesh.position.x-Math.sin(player.rot)*10;
    camera.position.y=10;
    camera.position.z=player.mesh.position.z-Math.cos(player.rot)*10;
    //camera.rotation.x=Math.PI/4;
    camera.lookAt(player.mesh.position);
    //alert(camera.rotation.x+","+camera.rotation.y+","+camera.rotation.z);
    //camera.rotation.y=0;
    //camera.lookAt(player.mesh);

    //camera.rotation.y=player.rot;
    renderer.render( scene, camera );  
    lasttime=timenow;
    requestAnimationFrame(timer);
}timer();
window.onkeydown = function (ev) {
    keysPress[ev.keyCode] = true;
}
window.onkeyup = function (ev) {
    keysPress[ev.keyCode] = false;
}
// render
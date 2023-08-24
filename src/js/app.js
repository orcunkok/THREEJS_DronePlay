import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GUI } from 'dat.gui'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let scene, renderer;
let camera, light, controls;
let dirLight1, dirLight2, ambientLight;
const gui = new GUI();
const stats = new Stats();
const assetLoader = new GLTFLoader().setPath('./assets/');
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2( );
let clickMeshIntersect;
let intersects;
let top_down = false;
const sky = {
        color: '#b2c4d1'
      };

init();
animate();

function init() {
        document.body.appendChild(stats.dom);
        //RENDERER
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        //SCENE
        scene = new THREE.Scene();
        scene.background = new THREE.Color(sky.color);
        scene.fog = new THREE.Fog(sky.color, 50, 20000);
        var scene_folder = gui.addFolder('Scene');
        scene_folder.addColor(sky, 'color').onChange(function(value){
                scene.background.set(value);
        });
        scene_folder.add(scene.fog, 'near',0,2000);
        scene_folder.add(scene.fog, 'far',0,30000);
        //scene_folder.closed = false;
        

        //CAMERA
        if (top_down==true){
                var d = 30
                camera = new THREE.OrthographicCamera( window.innerWidth / - d, window.innerWidth / d, window.innerHeight / d, window.innerHeight / - d, 1, 1000 );
                camera.position.set(0,100,0);
                controls = new OrbitControls( camera, renderer.domElement );
                controls.listenToKeyEvents( window );
                controls.enableDamping = true;
                controls.dampingFactor = 0.05;
                controls.maxPolarAngle = 0;
            

        }
        else{
                camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 1, 1000000);
                camera.position.set(15,20,15);
                controls = new OrbitControls( camera, renderer.domElement );
                //controls.listenToKeyEvents( window );
                controls.enableDamping = true; 
                controls.screenSpacePanning = false;
                controls.dampingFactor = 0.05;
                controls.minDistance = 20;
                controls.maxDistance = 1500;
                controls.maxPolarAngle = Math.PI*0.47;
                
                //gui.add(controls, 'dampingFactor');
                var camera_folder = gui.addFolder('Camera');
                camera_folder.add(controls, 'minDistance');
                camera_folder.add(controls, 'maxDistance');
                //gui.add(controls, 'maxPolarAngle');
                
        }
        
        // LIGHT
        dirLight1 = new THREE.DirectionalLight( 0xffffff, 3);
        dirLight1.position.set( 1, 1, 1 );
        scene.add( dirLight1 );

        dirLight2 = new THREE.DirectionalLight( 0x002288, 0.5);
        dirLight2.position.set( - 1, - 1, - 1 );
        //scene.add( dirLight2 );

        ambientLight = new THREE.AmbientLight( 0x555555 );
        scene.add( ambientLight );

        //GRID
        const gridHelper = new THREE.GridHelper(100000, 10000, 0xff0000, 0xaaaaaa );
        gridHelper.position.y = 1;
        gridHelper.name = 'grid';
        scene.add( gridHelper );
   
        //TREES AND STUFF
        const treeGeometry = new THREE.ConeGeometry(10, 30, 100, 1);
        const treeMaterial = new THREE.MeshPhongMaterial( { color: 0x83d367, flatShading: true } );
        const treeMesh = new THREE.Mesh(treeGeometry,treeMaterial);

        /*const materialParams ={
                treeColor: treeMesh.material.color.getHex(),
        }; 
        gui.addColor(materialParams, "treeColor").onChange((value) => treeMesh.material.color.set(value));
        */
        
        const geometry = new THREE.PlaneGeometry(100000, 100000);
        const material = new THREE.MeshBasicMaterial( {color: '#dbc391', side: THREE.BackSide} );
        const plane = new THREE.Mesh( geometry, material );
        plane.name = 'plane'
        plane.position.y=0;
        plane.rotateX(Math.PI/2);
        scene.add( plane );

        const clickMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(100000, 100000),
                new THREE.MeshBasicMaterial({visible: false, side: THREE.DoubleSide}))
        clickMesh.position.y=gridHelper.position.y;
        clickMesh.rotateX(Math.PI/2);
        clickMesh.name = 'clickMesh';
        scene.add(clickMesh);

        /*     
        for ( let i = 0; i < 1000; i ++ ) {

                const mesh = new THREE.Mesh(treeGeometry,treeMaterial);
                mesh.position.x = Math.random() * 50000 - 25000;
                mesh.position.y = 15;
                mesh.position.z = Math.random() * 50000 - 25000;
                mesh.updateMatrix();
                mesh.matrixAutoUpdate = false;
                scene.add( mesh );

        }
        */

        
        assetLoader.load('/Drone.glb', function ( gltf ){
                const drone = gltf.scene;  
                drone.scale.set(10, 10, 10);
                drone.position.set(0,5,0);
                drone.userData.name = "mydrone";
                
                scene.add(drone);
        },
        undefined,
        function ( error ) {
		console.log( 'An error happened:', error);

	});

        /*
        var dummy = new THREE.Object3D();
        assetLoader.load( 'Drone.glb', function ( gltf ) {
                
                gltf.scene.traverse( function ( child ) {
                        if ( child.isMesh ) {
                                var instancedMesh = new THREE.InstancedMesh( child.geometry, child.material, 1 );
                                instancedMesh.setMatrixAt( 0, dummy.matrix );
                                
                                scene.add( instancedMesh );
                        }
                });
        });
        
*/
        
        const highlightMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(10,10),
                new THREE.MeshBasicMaterial({
                        color: '#d1b9b2', 
                        side: THREE.DoubleSide,
                        visible: true
                })
        );
        highlightMesh.position.set(0,gridHelper.position.y, 0);
        highlightMesh.rotateX(-Math.PI /2);
        scene.add(highlightMesh);

        renderer.domElement.addEventListener('pointerdown', (event) =>{
                pointer.x = (event.clientX / renderer.domElement.clientWidth - renderer.domElement.getBoundingClientRect().x) * 2 - 1;
                pointer.y = -(event.clientY / renderer.domElement.clientHeight + renderer.domElement.getBoundingClientRect().y) * 2 + 1;
                
                clickMeshIntersect = raycaster.intersectObject(clickMesh)[0];
                highlightMesh.material.color=new THREE.Color('#ffaaaa');
                
        });
        renderer.domElement.addEventListener('pointerup', (event) =>{
                pointer.x = (event.clientX / renderer.domElement.clientWidth - renderer.domElement.getBoundingClientRect().x) * 2 - 1;
                pointer.y = -(event.clientY / renderer.domElement.clientHeight + renderer.domElement.getBoundingClientRect().y) * 2 + 1;
                
                clickMeshIntersect = raycaster.intersectObject(clickMesh)[0];
                highlightMesh.material.color=new THREE.Color('#d1b9b2');
                
        });
        

        
        document.addEventListener( 'pointermove', function(event){
                pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
                pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1; 
                raycaster.setFromCamera( pointer, camera );
                
                clickMeshIntersect = raycaster.intersectObject(clickMesh)[0];
                highlightMesh.position.copy(clickMeshIntersect.point).add(clickMeshIntersect.face.normal );
                highlightMesh.position.divideScalar(10).floor().multiplyScalar(10).addScalar(5);
                highlightMesh.position.y =gridHelper.position.y;
        });
                
                
        window.addEventListener( 'resize', onWindowResize );
        //const obj = gltf.scene.getObjectByName('Earth');
        //console.log(obj.isObject3D); // returns true
        
}

function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

}

function onPointerMove( event ) {

        pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function animate() {
        controls.update();      
        render();
        stats.update();
        window.requestAnimationFrame( animate );
        //scene.drone.position.x +=1;
        
}


function render(){
        //const time = Date.now() * 0.001;
        renderer.render(scene, camera );

}
//import {runApp } from "./core-utils"

//THREE.JS APP BOILER PLATE
const container = document.querySelector('#threejs-container')
         container.append(renderer.domElement)
         renderer.render(scene, camera)
         animate()
export const runApp = (app, scene, renderer, camera, enableAnimation = false, composer = null) => {
    //CREATE HTML CONTAINER(you need to have a div with id="threejs-container")
    const container = document.querySelector('#threejs-container');
    container.append(renderer.domElement);

    //LISTENER FOR RESPONSIVENESS
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    })

    // Define your app
    if (app.updateScene === undefined) {
        app.updateScene = (delta, elapsed) => { }
    }
    Object.assign(app, { ...app, container })

    // The engine that powers your scene into movement
    const clock = new THREE.Clock()
    const animate = () => {
        if (enableAnimation) {
            requestAnimationFrame(animate)
        }

        const delta = clock.getDelta()
        const elapsed = clock.getElapsedTime()
        
        app.updateScene(delta, elapsed)
        renderer.render(scene, camera)
    }

    app.initScene()
        .then(() => {
            const veil = document.getElementById("veil")
            veil.style.opacity = 0
            return true
        })
        .then(animate)
        .then(() => {
            // debugging info
            renderer.info.reset()
        })
        .catch((error) => {
            console.log(error);
        });
}
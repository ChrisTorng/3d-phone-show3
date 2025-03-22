import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let phoneModels = []; // 用於儲存載入的手機模型
let currentModelIndex = 0; // 當前顯示的模型索引

/**
 * 初始化 3D 場景、相機和渲染器
 */
function init() {
    // 建立場景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // 設定相機
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // 設定渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('container').appendChild(renderer.domElement);

    // 設定控制
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 新增燈光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    // 讀取手機資訊並載入對應的模型
    fetchPhoneData();

    // 視窗大小調整事件處理
    window.addEventListener('resize', onWindowResize, false);
}

/**
 * 從 API 讀取手機資訊
 */
async function fetchPhoneData() {
    try {
        const response = await fetch('/api/phones');
        if (!response.ok) {
            throw new Error(`HTTP 錯誤！狀態: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('手機資料:', data);
        
        // 載入所有模型
        loadModels(data);
        
    } catch (error) {
        console.error('讀取手機資料時發生錯誤:', error);
    }
}

/**
 * 載入 3D 模型
 * @param {Array} phonesData - 手機資訊陣列
 */
function loadModels(phonesData) {
    if (!Array.isArray(phonesData) || phonesData.length === 0) {
        console.error('無效的手機資料格式或空白資料');
        return;
    }

    const loader = new GLTFLoader();
    let loadedCount = 0;
    
    // 清除現有的模型
    phoneModels.forEach(model => {
        if (model && model.scene) {
            scene.remove(model.scene);
        }
    });
    phoneModels = [];

    // 載入每個手機模型
    phonesData.forEach((phone, index) => {
        if (!phone.model_path) {
            console.warn(`手機 ${phone.name} 缺少模型路徑`);
            loadedCount++;
            return;
        }

        console.log(`載入模型: ${phone.model_path}`);
        
        loader.load(
            phone.model_path,
            (gltf) => {
                console.log(`模型 ${phone.name} 已載入`);
                
                // 初始時隱藏除第一個外的所有模型
                gltf.scene.visible = (index === 0);
                
                // 調整模型大小和位置
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = box.getSize(new THREE.Vector3()).length();
                const scaleFactor = 6 / size;
                gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
                
                // 置中模型
                const center = new THREE.Vector3();
                box.getCenter(center);
                gltf.scene.position.sub(center.multiplyScalar(scaleFactor));
                
                // 儲存模型及資訊
                phoneModels[index] = {
                    scene: gltf.scene,
                    info: phone
                };
                
                scene.add(gltf.scene);
                
                loadedCount++;
                if (loadedCount === phonesData.length) {
                    createPhoneInfoUI(phonesData);
                }
            },
            (xhr) => {
                console.log(`${phone.name} 載入進度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
            },
            (error) => {
                console.error(`載入模型 ${phone.model_path} 時發生錯誤:`, error);
                loadedCount++;
            }
        );
    });
}

/**
 * 建立手機資訊 UI
 * @param {Array} phonesData - 手機資訊陣列
 */
function createPhoneInfoUI(phonesData) {
    // 建立一個資訊面板
    const infoContainer = document.createElement('div');
    infoContainer.id = 'info-container';
    infoContainer.style.position = 'absolute';
    infoContainer.style.top = '10px';
    infoContainer.style.left = '10px';
    infoContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    infoContainer.style.color = 'white';
    infoContainer.style.padding = '10px';
    infoContainer.style.borderRadius = '5px';
    infoContainer.style.maxWidth = '300px';
    document.body.appendChild(infoContainer);
    
    // 切換模型按鈕
    const nextButton = document.createElement('button');
    nextButton.textContent = '下一個手機';
    nextButton.style.position = 'absolute';
    nextButton.style.bottom = '20px';
    nextButton.style.right = '20px';
    nextButton.addEventListener('click', showNextModel);
    document.body.appendChild(nextButton);
    
    // 顯示第一個手機的資訊
    updatePhoneInfo(0);
}

/**
 * 更新手機資訊顯示
 * @param {number} index - 手機索引
 */
function updatePhoneInfo(index) {
    if (index < 0 || index >= phoneModels.length || !phoneModels[index]) {
        return;
    }

    const phoneInfo = phoneModels[index].info;
    const infoContainer = document.getElementById('info-container');

    if (infoContainer && phoneInfo) {
        infoContainer.innerHTML = `
            <h3>${phoneInfo.name}</h3>
            <p>螢幕: ${phoneInfo.screen}</p>
            <p>處理器: ${phoneInfo.processor}</p>
            <p>相機: ${phoneInfo.camera}</p>
            <p>電池: ${phoneInfo.battery}</p>
            <p>儲存空間: ${phoneInfo.storage}</p>
        `;
    }
}

/**
 * 顯示下一個手機模型
 */
function showNextModel() {
    if (phoneModels.length <= 1) return;
    
    // 隱藏當前模型
    if (phoneModels[currentModelIndex] && phoneModels[currentModelIndex].scene) {
        phoneModels[currentModelIndex].scene.visible = false;
    }
    
    // 計算下一個索引
    currentModelIndex = (currentModelIndex + 1) % phoneModels.length;
    
    // 顯示新模型
    if (phoneModels[currentModelIndex] && phoneModels[currentModelIndex].scene) {
        phoneModels[currentModelIndex].scene.visible = true;
    }
    
    // 更新資訊
    updatePhoneInfo(currentModelIndex);
    
    // 重置相機控制
    controls.reset();
}

/**
 * 處理視窗大小變更
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 動畫迴圈
 */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// 初始化並開始動畫
init();
animate();
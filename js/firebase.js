// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC3OUQBy8VpjDCBllgsCGu3sDQoGO-G8w0",
    authDomain: "betasegui-8cdaa.firebaseapp.com",
    projectId: "betasegui-8cdaa",
    storageBucket: "betasegui-8cdaa.firebasestorage.app",
    messagingSenderId: "995668670252",
    appId: "1:995668670252:web:0aa68d85263ce46354de89"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
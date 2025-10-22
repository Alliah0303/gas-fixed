// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ❌ DO NOT import the JSON here if you keep the inline object
// import firebaseConfig from "./firebase.config.json";  // <-- remove this line

const firebaseConfig = {
  apiKey: "AIzaSyDdY_rqWlacFJpZpYfRXn5ajqaHDiZnw70",
  authDomain: "gas-detection-bd536.firebaseapp.com",
  databaseURL: "https://gas-detection-bd536-default-rtdb.firebaseio.com",
  projectId: "gas-detection-bd536",
  storageBucket: "gas-detection-bd536.firebasestorage.app",
  messagingSenderId: "668765171657",
  appId: "1:668765171657:web:50e5add4f71561ded40218",
  measurementId: "G-FK4F4GSP3X",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore } from "firebase/firestore";
import {getAuth } from "firebase/auth";
import { getVertexAI, getGenerativeModel } from "firebase/vertexai-preview";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDMsfL_VzmMaxQqWr7ipOg4kBDhbNxZyYo",
  authDomain: "pantry2table-fa81f.firebaseapp.com",
  projectId: "pantry2table-fa81f",
  storageBucket: "pantry2table-fa81f.appspot.com",
  messagingSenderId: "644927238470",
  appId: "1:644927238470:web:a71dcd5f4f6b30dcbab547",
  measurementId: "G-PL6DZY7D0B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export {firestore, model};



// Initialize the Vertex AI service
const vertexAI = getVertexAI(app);

// Initialize the generative model with a model that supports your use case
// Gemini 1.5 models are versatile and can be used with all API capabilities
const model = getGenerativeModel(vertexAI, { model: "gemini-1.5-flash" });

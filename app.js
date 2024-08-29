// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// Firebase and Firestore Initialization
const firebaseConfig = {
    apiKey: "AIzaSyD2SDMtKZmh72K2BbpA-hZK6X2NPE8d9AQ",
    authDomain: "internexxus-products.firebaseapp.com",
    projectId: "internexxus-products",
    storageBucket: "internexxus-products.appspot.com",
    messagingSenderId: "340039291602",
    appId: "1:340039291602:web:0b0795bb9c6e8f6501930b",
    measurementId: "G-BB654YGLR4"
};
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const stripe = Stripe('YOUR_PUBLISHABLE_KEY');

// Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();

// Elements
const uploadBox = document.getElementById('upload-box');
const resumeUpload = document.getElementById('resume-upload');
const uploadButton = document.getElementById('upload-button');
const generateButton = document.getElementById('generate-button');
const generateSection = document.getElementById('step2');
let uploadedFileUrl = ''; // To store uploaded file URL for further use

// Drag and Drop handling
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadBox.classList.add('dragover'); // Visual cue for drag-over state
});

uploadBox.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadBox.classList.remove('dragover'); // Remove visual cue
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadBox.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        resumeUpload.files = e.dataTransfer.files; // Assign dropped file to input element
        handleFileUpload(file); // Handle file upload
    } else {
        alert('Please upload a PDF file.');
    }
});

// Click-to-Select File
uploadButton.addEventListener('click', () => {
    resumeUpload.click(); // Trigger hidden file input
});

resumeUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        handleFileUpload(file); // Handle file upload
    } else {
        alert('Please select a PDF file.');
    }
});

// Handle File Upload
function handleFileUpload(file) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please sign in first.');
        return;
    }
    const storageRef = firebase.storage().ref(`resumes/${user.uid}/${file.name}`);
    storageRef.put(file)
        .then((snapshot) => {
            console.log('File uploaded successfully');
            return snapshot.ref.getDownloadURL();
        })
        .then((url) => {
            uploadedFileUrl = url;
            console.log('File available at:', url);
            document.getElementById('step1').classList.remove('active');
            document.getElementById('step2').classList.add('active');
            document.getElementById('job-description-box').style.display = 'block';
        })
        .catch(error => {
            console.error('File upload error:', error);
        });
}

// Handle Job Description and Cover Letter Generation
generateButton.addEventListener('click', () => {
    const jobDescription = document.getElementById('job-description').value;
    if (!uploadedFileUrl) {
        alert('Please upload a resume first.');
        return;
    }
    fetch('https://your-api-endpoint/job-description', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription: jobDescription, resumeUrl: uploadedFileUrl }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step3').classList.add('active');

        // Redirect to Stripe Checkout
        return fetch('https://your-backend-endpoint/create-checkout-session', {
            method: 'POST',
        });
    })
    .then(response => response.json())
    .then(session => {
        return stripe.redirectToCheckout({ sessionId: session.id });
    })
    .then(result => {
        if (result.error) {
            console.error('Error:', result.error.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// Authentication buttons for sign-in and sign-up
document.querySelector('.sign-in').addEventListener('click', () => {
    handleGoogleSignIn()
        .then(user => {
            console.log('Signed in with Google:', user);
        });
});

document.querySelector('.get-started').addEventListener('click', () => {
    handleGoogleSignIn()
        .then(user => {
            console.log('Signed up with Google:', user);
            saveUserData(user);
        });
});

// Google Sign-In Handler
function handleGoogleSignIn() {
    return firebase.auth().signInWithPopup(provider)
        .then(result => result.user)
        .catch(error => {
            console.error('Error during sign-in:', error);
        });
}

// Save User Data to Firestore
function saveUserData(user) {
    db.collection('users').doc(user.uid).set({
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('User data saved');
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// FAQ Toggle functionality
document.querySelectorAll('.faq-question').forEach(item => {
    item.addEventListener('click', () => {
        const faqItem = item.parentElement;
        const isVisible = faqItem.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });

        if (!isVisible) {
            faqItem.classList.add('active');
        }
    });
});

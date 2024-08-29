// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvPjN4aeHU2H0UtHfOHWdLy4clx5uGR-k",
  authDomain: "internexxus-products-65a8b.firebaseapp.com",
  projectId: "internexxus-products-65a8b",
  storageBucket: "internexxus-products-65a8b.appspot.com",
  messagingSenderId: "788630683314",
  appId: "1:788630683314:web:ff6a2da1fdfee098e713ab",
  measurementId: "G-B0JLMBTZWZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const stripe = Stripe('YOUR_PUBLISHABLE_KEY'); // Stripe initialization

// Google Auth Provider
const provider = new GoogleAuthProvider();

// DOM Elements
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const uploadSection = document.getElementById('step1');
const generateSection = document.getElementById('step2');
const resultSection = document.getElementById('step3');
const uploadButton = document.getElementById('upload-button');
const generateButton = document.getElementById('generate-button');
const resumeUpload = document.getElementById('resume-upload');
const jobDescription = document.getElementById('job-description');
const coverLetterOutput = document.getElementById('cover-letter-output');

// API URL
const apiUrl = 'https://p12uecufp5.execute-api.us-west-1.amazonaws.com/default/resume_cover';

// Variable to store the download URL
let uploadedFileUrl = '';

// Sign in event
signInButton.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then(result => {
            console.log('User signed in:', result.user);
            toggleUI(true);
        })
        .catch(error => {
            console.error('Sign in error:', error);
        });
});

// Sign out event
signOutButton.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            console.log('User signed out');
            toggleUI(false);
        })
        .catch(error => {
            console.error('Sign out error:', error);
        });
});

// Upload resume event
uploadButton.addEventListener('click', () => {
    const file = resumeUpload.files[0];
    if (file) {
        const storageRef = ref(storage, `resumes/${auth.currentUser.uid}/${file.name}`);
        uploadBytes(storageRef, file)
            .then((snapshot) => {
                console.log('File uploaded successfully');
                return getDownloadURL(snapshot.ref); // Get the download URL
            })
            .then((url) => {
                uploadedFileUrl = url; // Store the download URL
                generateSection.classList.add('active');
                document.getElementById('job-description-box').style.display = 'block';
            })
            .catch(error => {
                console.error('File upload error:', error);
            });
    } else {
        alert('Please select a file to upload.');
    }
});

// Generate cover letter event
generateButton.addEventListener('click', () => {
    const description = jobDescription.value.trim();
    if (description && uploadedFileUrl) {
        const requestData = {
            link: uploadedFileUrl,
            job_description: description
        };

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Cover letter generated:', data.cover_letter);
            coverLetterOutput.value = data.cover_letter; // Set the generated cover letter
            resultSection.classList.add('active');
        })
        .catch(error => {
            console.error('Error generating cover letter:', error);
        });
    } else {
        alert('Please provide a job description and upload your resume first.');
    }
});

// Toggle UI for authentication state
function toggleUI(isLoggedIn) {
    signInButton.style.display = isLoggedIn ? 'none' : 'block';
    signOutButton.style.display = isLoggedIn ? 'block' : 'none';
    uploadSection.style.display = isLoggedIn ? 'block' : 'none';
}

// Firebase authentication state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in:', user);
        toggleUI(true);
    } else {
        console.log('No user is signed in.');
        toggleUI(false);
    }
});

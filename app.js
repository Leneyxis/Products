// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
  // Your Firebase config
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// Google Auth Provider
const provider = new GoogleAuthProvider();

// DOM Elements
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const uploadBox = document.getElementById('upload-box');
const uploadButton = document.getElementById('upload-button');
const resumeUpload = document.getElementById('resume-upload');
const generateButton = document.getElementById('generate-button');

// API URL
const apiUrl = 'https://p12uecufp5.execute-api.us-west-1.amazonaws.com/default/internexxusCoverLetterGenerator';

let user = null;
let uploadedFileUrl = null;

// Sign-in function
signInButton.addEventListener('click', () => {
    signInWithPopup(auth, provider)
    .then((result) => {
        user = result.user;
        signInButton.style.display = 'none';
        signOutButton.style.display = 'block';
        uploadBox.style.display = 'block';
    })
    .catch((error) => {
        console.error('Error signing in: ', error);
    });
});

// Sign-out function
signOutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
        user = null;
        signInButton.style.display = 'block';
        signOutButton.style.display = 'none';
        uploadBox.style.display = 'none';
    }).catch((error) => {
        console.error('Error signing out: ', error);
    });
});

// Resume upload function
uploadButton.addEventListener('click', () => {
    resumeUpload.click();
});

resumeUpload.addEventListener('change', () => {
    const file = resumeUpload.files[0];
    if (file) {
        const storageRef = ref(storage, `resumes/${user.uid}/${file.name}`);
        uploadBytes(storageRef, file).then((snapshot) => {
            getDownloadURL(snapshot.ref).then((url) => {
                uploadedFileUrl = url;
                document.getElementById('job-description-box').style.display = 'block';
            }).catch((error) => {
                console.error('Error getting download URL: ', error);
            });
        }).catch((error) => {
            console.error('Error uploading file: ', error);
        });
    }
});

// Redirect to Stripe payment
function redirectToStripePayment() {
    const stripePaymentForm = document.getElementById('stripe-payment-form');
    stripePaymentForm.submit();
}

// Generate cover letter function
function generateCoverLetter(description) {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
            resumeUrl: uploadedFileUrl,
            jobDescription: description,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        const link = document.createElement('a');
        link.href = data.coverLetterUrl;
        link.download = 'CoverLetter.pdf';
        link.click();
    })
    .catch(error => {
        console.error('Error generating cover letter:', error);
    })
    .finally(() => {
        loader.style.display = 'none';
    });
}

// Handle generate button click
generateButton.addEventListener('click', () => {
    const description = document.getElementById('job-description').value.trim();
    if (description && uploadedFileUrl) {
        redirectToStripePayment();
        generateCoverLetter(description);
    } else {
        alert('Please upload your resume and enter a job description.');
    }
});

// Handle auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        signInButton.style.display = 'none';
        signOutButton.style.display = 'block';
        uploadBox.style.display = 'block';
    } else {
        signInButton.style.display = 'block';
        signOutButton.style.display = 'none';
        uploadBox.style.display = 'none';
    }
});

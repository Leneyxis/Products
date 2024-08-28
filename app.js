// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

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

// Google Auth Provider
const provider = new GoogleAuthProvider();

// DOM Elements
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const uploadSection = document.getElementById('upload-section');
const generateSection = document.getElementById('generate-section');
const resultSection = document.getElementById('result-section');
const uploadButton = document.getElementById('upload-button');
const generateButton = document.getElementById('generate-button');
const resumeUpload = document.getElementById('resume-upload');
const jobDescription = document.getElementById('job-description');
const coverLetterOutput = document.getElementById('cover-letter-output');

// API URL
const apiUrl = 'https://p12uecufp5.execute-api.us-west-1.amazonaws.com/default/resume_cover';

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
        uploadBytes(storageRef, file).then(() => {
            console.log('File uploaded successfully');
            generateSection.style.display = 'block';
        }).catch(error => {
            console.error('File upload error:', error);
        });
    } else {
        alert('Please select a file to upload.');
    }
});

// Generate cover letter event
generateButton.addEventListener('click', () => {
    const description = jobDescription.value.trim();
    if (description) {
        // Prepare the POST request payload
        const requestData = {
            link: resumeUpload.files[0] ? `path/to/your/uploaded/file/${resumeUpload.files[0].name}` : '',
            job_description: description
        };

        // Send POST request to API
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            // Parse the body to extract the URL
            const body = JSON.parse(data.body);
            const coverLetterUrl = body.cover_letter_url;

            if (coverLetterUrl) {
                // Trigger the download
                const link = document.createElement('a');
                link.href = coverLetterUrl;
                link.download = coverLetterUrl.split('/').pop(); // Extract file name from URL
                document.body.appendChild(link); // Append link to the body
                link.click(); // Trigger click event
                document.body.removeChild(link); // Remove link from the body
                resultSection.style.display = 'block';
            } else {
                coverLetterOutput.innerText = 'Cover letter URL not available.';
                resultSection.style.display = 'block';
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    } else {
        alert('Please enter a job description.');
    }
});

// Toggle UI based on user auth state
onAuthStateChanged(auth, user => {
    if (user) {
        toggleUI(true);
    } else {
        toggleUI(false);
    }
});

function toggleUI(isSignedIn) {
    if (isSignedIn) {
        signInButton.style.display = 'none';
        signOutButton.style.display = 'block';
        uploadSection.style.display = 'block';
    } else {
        signInButton.style.display = 'block';
        signOutButton.style.display = 'none';
        uploadSection.style.display = 'none';
        generateSection.style.display = 'none';
        resultSection.style.display = 'none';
    }
}

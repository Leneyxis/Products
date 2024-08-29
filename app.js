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

// Google Auth Provider
const provider = new GoogleAuthProvider();

// DOM Elements
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const uploadSection = document.getElementById('upload-section');
const generateSection = document.getElementById('generate-section');
const resultSection = document.getElementById('result-section');
const uploadBox = document.getElementById('upload-box');  // Drag and drop area
const uploadButton = document.getElementById('upload-button');
const generateButton = document.getElementById('generate-button');
const resumeUpload = document.getElementById('resume-upload');
const jobDescription = document.getElementById('job-description');
const coverLetterOutput = document.getElementById('cover-letter-output');

// DOM Elements for Modal and Loader
const textDialog = document.getElementById('text-dialog');
const closeDialog = document.getElementById('close-dialog');
const dialogSubmit = document.getElementById('dialog-submit');
const dialogJobDescription = document.getElementById('dialog-job-description');
const loader = document.getElementById('loader');

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

// Drag and Drop functionality
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover'); // Add visual feedback
});

uploadBox.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover'); // Remove visual feedback
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        handleFileUpload(file); // Call file upload function
    } else {
        alert('Please upload a PDF file.');
    }
});

// Upload resume event
uploadButton.addEventListener('click', () => {
    resumeUpload.click(); // Trigger file input click
});

resumeUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        handleFileUpload(file); // Call file upload function
    } else {
        alert('Please select a PDF file.');
    }
});

// Handle File Upload
function handleFileUpload(file) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please sign in first.');
        return;
    }

    // Show loader during upload
    loader.style.display = 'block';

    const storageRef = ref(storage, `resumes/${user.uid}/${file.name}`);
    uploadBytes(storageRef, file)
        .then((snapshot) => {
            console.log('File uploaded successfully');
            return getDownloadURL(snapshot.ref); // Get the download URL
        })
        .then((url) => {
            uploadedFileUrl = url; // Store the download URL
            loader.style.display = 'none'; // Hide loader after upload
            textDialog.style.display = 'block'; // Show dialog for job description input
        })
        .catch(error => {
            console.error('File upload error:', error);
            loader.style.display = 'none'; // Hide loader if upload fails
        });
}

// Close dialog
closeDialog.addEventListener('click', () => {
    textDialog.style.display = 'none';
});

// Submit job description from dialog
dialogSubmit.addEventListener('click', () => {
    jobDescription.value = dialogJobDescription.value.trim(); // Transfer to the main textarea
    textDialog.style.display = 'none'; // Hide dialog
    generateSection.style.display = 'block'; // Show the generate section
});

// Generate cover letter event
generateButton.addEventListener('click', () => {
    const description = jobDescription.value.trim();
    if (description && uploadedFileUrl) {
        loader.style.display = 'block'; // Show loader during processing

        const requestData = {
            link: uploadedFileUrl,
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
            loader.style.display = 'none'; // Hide loader after processing

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
            loader.style.display = 'none'; // Hide loader if there's an error
        });
    } else {
        alert('Please upload a file and enter a job description.');
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

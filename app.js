// Your Firebase configuration (to be provided)
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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

// Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();

// Sign in event
signInButton.addEventListener('click', () => {
    auth.signInWithPopup(provider)
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
    auth.signOut()
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
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`resumes/${auth.currentUser.uid}/${file.name}`);
        fileRef.put(file).then(() => {
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
        // Placeholder: Simulate generating a cover letter
        coverLetterOutput.innerText = `Generated cover letter for: ${description}`;
        resultSection.style.display = 'block';
    } else {
        alert('Please enter a job description.');
    }
});

// Toggle UI based on user auth state
auth.onAuthStateChanged(user => {
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

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
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

// Google Auth Provider
const provider = new GoogleAuthProvider();

// DOM Elements
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const uploadBox = document.getElementById('upload-box');
const uploadButton = document.getElementById('upload-button');
const resumeUpload = document.getElementById('resume-upload');
const loginModal = document.getElementById('login-modal');
const closeButton = document.querySelector('.close-button');
const googleSignInButton = document.getElementById('google-sign-in');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const emailInput = document.querySelector('input[type="text"]');
const passwordInput = document.querySelector('input[type="password"]');
const toggleLink = document.getElementById('toggle-link');
let uploadedFileUrl = '';

// Set initial payment status for the user upon sign-up
signupButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('User signed up:', user);
            // Set initial payment status to false in Firestore
            setDoc(doc(db, 'users', user.uid), { payment_status: false });
            loginModal.style.display = 'none'; // Hide modal after sign-up
        })
        .catch((error) => {
            console.error('Sign up error:', error.message);
            alert(`Sign up failed: ${error.message}`);
        });
});

// Check user's payment status before redirecting to payment or allowing download
function checkPaymentStatusAndProceed(description) {
    const user = auth.currentUser;
    const userRef = doc(db, 'users', user.uid);

    getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
            const paymentStatus = docSnapshot.data().payment_status;
            if (paymentStatus) {
                // If payment_status is true, trigger the download
                triggerCoverLetterDownload();
            } else {
                // Otherwise, redirect to payment page
                generateCoverLetter(description);
            }
        }
    });
}

// Generate Cover Letter and redirect to Payment
function generateCoverLetter(description) {
    const requestData = {
        link: uploadedFileUrl,
        job_description: description
    };

    fetch('https://p12uecufp5.execute-api.us-west-1.amazonaws.com/default/resume_cover', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    })
    .then(response => response.json())
    .then(data => {
        const parsedBody = JSON.parse(data.body);
        const coverLetterUrl = parsedBody.cover_letter_url;

        // Store the cover letter URL for download after payment
        uploadedFileUrl = coverLetterUrl;

        // Redirect to Stripe payment page
        window.location.href = 'https://buy.stripe.com/test_14keYE1E12eHgUgfZ0';
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Update payment status after successful payment
async function updatePaymentStatus() {
    const user = auth.currentUser;
    if (user) {
        await updateDoc(doc(db, 'users', user.uid), { payment_status: true });
    }
}

// Handle successful payment and trigger the download
function handleSuccessfulPayment() {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutSessionId = urlParams.get('id');
    
    if (checkoutSessionId) {
        // Update payment status to true in Firestore
        updatePaymentStatus().then(() => {
            triggerCoverLetterDownload();
        });
    }
}

// Trigger cover letter download
function triggerCoverLetterDownload() {
    if (uploadedFileUrl) {
        const link = document.createElement('a');
        link.href = uploadedFileUrl;
        link.download = 'cover_letter.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        console.error('No cover letter URL found for download.');
    }
}

// Check for successful payment on page load
document.addEventListener('DOMContentLoaded', () => {
    handleSuccessfulPayment();
});

// Toggle Sign In/Sign Up modal display
toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        loginButton.style.display = 'none';
        signupButton.style.display = 'block';
        toggleLink.textContent = 'Already have an account? Sign In';
    } else {
        loginButton.style.display = 'block';
        signupButton.style.display = 'none';
        toggleLink.textContent = 'Don’t have an account? Sign Up';
    }
});

// Sign In logic
loginButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('User signed in with email:', user);
            loginModal.classList.remove('show');
            setTimeout(() => {
                loginModal.style.display = 'none';
            }, 300);  // Wait for the transition to complete before hiding
            toggleUI(true);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Email sign in error:', errorCode, errorMessage);
            alert(`Error: ${errorMessage}`);
        });
});

// Sign out logic
signOutButton.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            console.log('User signed out');
            toggleUI(false);
            loginModal.style.display = 'none';
            loginModal.classList.remove('show');
            location.reload(); // Refresh the page after signing out
        })
        .catch(error => {
            console.error('Sign out error:', error);
        });
});

// Handle file upload
resumeUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        handleFileUpload(file);
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

    showLoader();  // Show loader while uploading

    const storageRef = ref(getStorage(), `resumes/${user.uid}/${file.name}`);
    uploadBytes(storageRef, file)
        .then((snapshot) => {
            console.log('File uploaded successfully');
            return getDownloadURL(snapshot.ref);
        })
        .then((url) => {
            uploadedFileUrl = url;
            hideLoader();  // Hide loader after upload
            showJobDescriptionInput();  // Proceed to show job description input
        })
        .catch(error => {
            hideLoader();  // Hide loader if there’s an error
            console.error('File upload error:', error);
        });
}

// Show Job Description Input
function showJobDescriptionInput() {
    uploadBox.innerHTML = '';
    uploadBox.classList.add('job-description-active');

    const jobDescriptionInput = document.createElement('textarea');
    jobDescriptionInput.id = 'job-description-input';
    jobDescriptionInput.placeholder = 'Enter the job description here...';
    uploadBox.appendChild(jobDescriptionInput);

    const generateButton = document.createElement('button');
    generateButton.textContent = 'Generate Cover Letter';
    generateButton.className = 'generate-button';
    uploadBox.appendChild(generateButton);

    generateButton.addEventListener('click', () => {
        const description = jobDescriptionInput.value.trim();
        if (description && uploadedFileUrl) {
            checkPaymentStatusAndProceed(description);  // Check payment status before proceeding
        } else {
            alert('Please enter a job description.');
        }
    });
}

// Function to show loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Toggle UI based on user auth state
function toggleUI(isSignedIn) {
    if (isSignedIn) {
        signInButton.style.display = 'none';  // Hide sign in button
        signOutButton.style.display = 'block'; // Show sign out button
    } else {
        signInButton.style.display = 'block'; // Show sign in button
        signOutButton.style.display = 'none';  // Hide sign out button
    }
}

// Listen for changes in the auth state (e.g., sign in, sign out)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        toggleUI(true);
    } else {
        // User is signed out
        toggleUI(false);
    }
});

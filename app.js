// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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
const storage = getStorage(app);
const db = getFirestore(app);  // Initialize Firestore

// Google Auth Provider
const provider = new GoogleAuthProvider();

// DOM Elements
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const signUpButton = document.getElementById('sign-up-button');
const uploadBox = document.getElementById('upload-box');
const uploadButton = document.getElementById('upload-button');
const resumeUpload = document.getElementById('resume-upload');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const closeButton = document.querySelector('.close-button');
const googleSignInButton = document.getElementById('google-sign-in');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const emailInput = document.querySelector('input[type="text"]');
const passwordInput = document.querySelector('input[type="password"]');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');

// Show login modal
signInButton.addEventListener('click', () => {
    loginModal.style.display = 'flex';
    setTimeout(() => {
        loginModal.classList.add('show');
    }, 10);
});

// Show sign up modal
signUpButton.addEventListener('click', () => {
    signupModal.style.display = 'flex';
    setTimeout(() => {
        signupModal.classList.add('show');
    }, 10);
});

// Close login modal
closeButton.addEventListener('click', () => {
    loginModal.classList.remove('show');
    signupModal.classList.remove('show');
    setTimeout(() => {
        loginModal.style.display = 'none';
        signupModal.style.display = 'none';
    }, 300);
});

// Handle Google Sign-In from modal
googleSignInButton.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then(result => {
            console.log('User signed in:', result.user);
            loginModal.classList.remove('show');
            setTimeout(() => {
                loginModal.style.display = 'none';
            }, 300);
            toggleUI(true);
        })
        .catch(error => {
            console.error('Sign in error:', error);
        });
});

// Handle Email/Password Sign-In
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
            }, 300);
            toggleUI(true);
        })
        .catch((error) => {
            console.error('Email sign-in error:', error);
            alert(`Error: ${error.message}`);
        });
});

// Handle Email/Password Sign-Up
signupButton.addEventListener('click', () => {
    const email = signupEmail.value;
    const password = signupPassword.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('User signed up:', user);
            signupModal.classList.remove('show');
            setTimeout(() => {
                signupModal.style.display = 'none';
            }, 300);
            toggleUI(true);
        })
        .catch((error) => {
            console.error('Email sign-up error:', error);
            alert(`Error: ${error.message}`);
        });
});

// Sign out event
signOutButton.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            console.log('User signed out');
            toggleUI(false);
            loginModal.style.display = 'none';
            loginModal.classList.remove('show');
        })
        .catch(error => {
            console.error('Sign out error:', error);
        });
});

// Drag and Drop functionality
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        handleFileUpload(file);
    } else {
        alert('Please upload a PDF file.');
    }
});

// Upload resume event
uploadButton.addEventListener('click', () => {
    const user = auth.currentUser;

    if (!user) {
        // If the user is not signed in, prompt them to sign in
        alert("Please sign in first to upload your resume.");
        loginModal.style.display = 'flex';
        setTimeout(() => {
            loginModal.classList.add('show');
        }, 10);
    } else {
        resumeUpload.click();
    }
});

// Handle File Upload
function handleFileUpload(file) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please sign in first.');
        return;
    }

    const storageRef = ref(storage, `resumes/${user.uid}/${file.name}`);
    uploadBytes(storageRef, file)
        .then((snapshot) => {
            console.log('File uploaded successfully');
            return getDownloadURL(snapshot.ref);
        })
        .then((url) => {
            uploadedFileUrl = url;
            showJobDescriptionInput();
        })
        .catch(error => {
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
            checkPaymentStatusAndGenerate(description);
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

// Generate Cover Letter and Redirect to Payment
function generateCoverLetter(description) {
    showLoader();

    const requestData = {
        link: uploadedFileUrl,
        job_description: description
    };

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
        const stripePaymentUrl = 'https://buy.stripe.com/9AQ03N36954wbcs145';

        if (stripePaymentUrl) {
            redirectToStripePayment(stripePaymentUrl);
        } else {
            alert('Payment URL not available.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    })
    .finally(() => {
        hideLoader();
    });
}

// Function to redirect to Stripe payment
function redirectToStripePayment(stripeUrl) {
    window.location.href = stripeUrl;
}

// Handle successful payment and update Firestore
function handleSuccessfulPayment() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const coverLetterUrl = urlParams.get('cover_letter_url');
    const user = auth.currentUser;

    if (paymentStatus === 'success' && coverLetterUrl && user) {
        document.getElementById('payment-success').style.display = 'block';

        const userDocRef = doc(db, 'users', user.uid);
        setDoc(userDocRef, { paymentStatus: 'success' }, { merge: true });

        const link = document.createElement('a');
        link.href = coverLetterUrl;
        link.download = coverLetterUrl.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Check payment status before generating cover letter
function checkPaymentStatusAndGenerate(description) {
    const user = auth.currentUser;

    if (!user) {
        alert('Please sign in first.');
        return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().paymentStatus === 'success') {
            console.log('User has already paid. Proceeding to generate cover letter.');
            generateCoverLetter(description);
        } else {
            console.log('User has not paid. Redirecting to payment.');
            redirectToStripePayment('https://buy.stripe.com/9AQ03N36954wbcs145');
        }
    }).catch((error) => {
        console.error('Error checking payment status:', error);
    });
}

// Check for successful payment on page load
document.addEventListener('DOMContentLoaded', () => {
    handleSuccessfulPayment();
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
    } else {
        signInButton.style.display = 'block';
        signOutButton.style.display = 'none';
    }
}

// FAQ Toggle
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isVisible = answer.style.display === 'block';

        document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');

        answer.style.display = isVisible ? 'none' : 'block';
    });
});

// Update Progress Bar
document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    const uploadButton = document.querySelector('.upload-button');
    const jobDescriptionInput = document.querySelector('#job-description-input');
    const generateButton = document.querySelector('.generate-button');

    let currentStep = 0;

    function updateProgressBar(stepIndex) {
        steps.forEach((step, index) => {
            if (index <= stepIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    uploadButton.addEventListener('click', () => {
        currentStep = 1;
        updateProgressBar(currentStep);
    });

    generateButton.addEventListener('click', () => {
        if (jobDescriptionInput.value.trim() !== '') {
            currentStep = 2;
            updateProgressBar(currentStep);
        }
    });
});

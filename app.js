// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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
const steps = document.querySelectorAll('.step');
let isSignUpMode = false;
let currentStep = 0;

// API URL
const apiUrl = 'https://p12uecufp5.execute-api.us-west-1.amazonaws.com/default/resume_cover';

// Variable to store the download URL
let uploadedFileUrl = '';

// Stripe payment URLs
const stripePaymentUrl = 'https://buy.stripe.com/test_14keYE1E12eHgUgfZ0';
const paymentConfirmationUrl = 'https://reliable-genie-706794.netlify.app';

// Toggle between Sign-In and Sign-Up
toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        document.getElementById('login-button').style.display = 'none';
        signupButton.style.display = 'block';
        toggleLink.textContent = 'Already have an account? Sign In';
    } else {
        document.getElementById('login-button').style.display = 'block';
        signupButton.style.display = 'none';
        toggleLink.textContent = 'Don’t have an account? Sign Up';
    }
});

// Show login modal
signInButton.addEventListener('click', () => {
    loginModal.style.display = 'flex';
    setTimeout(() => {
        loginModal.classList.add('show');
    }, 10); // Slight delay to allow CSS transition to work
});

// Close login modal
closeButton.addEventListener('click', () => {
    loginModal.classList.remove('show');
    setTimeout(() => {
        loginModal.style.display = 'none';
    }, 300);  // Wait for the transition to complete before hiding
});

// Handle Google Sign-In from modal
googleSignInButton.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then(result => {
            console.log('User signed in:', result.user);
            loginModal.classList.remove('show');
            setTimeout(() => {
                loginModal.style.display = 'none';
            }, 300);  // Wait for the transition to complete before hiding
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

// Handle Email/Password Sign-Up
signupButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('User signed up:', user);

            // Initialize payment status
            const paymentRef = doc(db, 'payments', user.uid);
            setDoc(paymentRef, { payment_status: false })
                .then(() => {
                    console.log('Payment status initialized.');
                })
                .catch(error => {
                    console.error('Error initializing payment status:', error);
                });

            toggleUI(true);
            loginModal.style.display = 'none'; // Hide modal after sign-up
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Sign up error:', errorCode, errorMessage);
            alert(`Sign up failed: ${errorMessage}`);
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
            location.reload(); // Refresh the page after signing out
        })
        .catch(error => {
            console.error('Sign out error:', error);
        });
});

// Listen for changes in the auth state (e.g., sign in, sign out)
onAuthStateChanged(auth, (user) => {
    if (user) {
        capturePaymentConfirmation(); // Check if there's a payment confirmation in the URL
        toggleUI(true);
    } else {
        toggleUI(false);
    }
});

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

// Function to handle checking payment status
function checkPaymentStatus(user) {
    const paymentRef = doc(db, 'payments', user.uid);

    return getDoc(paymentRef)
        .then((docSnap) => {
            if (docSnap.exists()) {
                const paymentData = docSnap.data();
                return paymentData.payment_status;  // Return the payment status
            } else {
                // If no payment data exists, create a new record with payment_status = false
                return setDoc(paymentRef, { payment_status: false }).then(() => false);
            }
        })
        .catch((error) => {
            console.error('Error fetching payment status:', error);
            return false;
        });
}

// Function to capture payment confirmation and update payment status
function capturePaymentConfirmation() {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutSessionId = urlParams.get('id');

    if (checkoutSessionId) {
        const user = auth.currentUser;
        const paymentRef = doc(db, 'payments', user.uid);

        updateDoc(paymentRef, { payment_status: true, session_id: checkoutSessionId })
            .then(() => {
                console.log('Payment confirmed. Payment status updated.');
                triggerCoverLetterDownload();  // Proceed with download after payment confirmation
            })
            .catch(error => {
                console.error('Error updating payment status:', error);
            });
    }
}

// Trigger payment flow if necessary when generating the cover letter
function handleGenerateCoverLetter(description) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please sign in first.');
        return;
    }

    checkPaymentStatus(user).then((hasPaid) => {
        if (!hasPaid) {
            // If payment status is false, redirect to Stripe payment
            window.location.href = stripePaymentUrl;
        } else {
            // If already paid, generate the cover letter
            generateCoverLetter(description);
        }
    });
}

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

    const storageRef = ref(storage, `resumes/${user.uid}/${file.name}`);
    uploadBytes(storageRef, file)
        .then((snapshot) => {
            console.log('File uploaded successfully');
            return getDownloadURL(snapshot.ref);
        })
        .then((url) => {
            uploadedFileUrl = url;
            hideLoader();  // Hide loader after upload
            updateProgressBar(1);  // Move to step 2 when file upload is done
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
            updateProgressBar(2);  // Move to step 3 on Generate button click
            handleGenerateCoverLetter(description);  // Check payment and generate cover letter
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

// Generate Cover Letter and Trigger Download
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

        const parsedBody = JSON.parse(data.body);  // Parse the response body
        const coverLetterUrl = parsedBody.cover_letter_url;  // Extract cover letter URL

        uploadedFileUrl = coverLetterUrl;  // Store for later use

        // Trigger the download directly
        triggerCoverLetterDownload();
    })
    .catch((error) => {
        console.error('Error:', error);
    })
    .finally(() => {
        hideLoader();
    });
}

// Trigger cover letter download
function triggerCoverLetterDownload() {
    if (uploadedFileUrl) {
        const link = document.createElement('a');
        link.href = uploadedFileUrl;
        link.download = 'AI_cover_letter.pdf';  // Rename the file to AI_cover_letter.pdf
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        console.error('No cover letter URL found for download.');
    }
}

// Function to update the progress bar
function updateProgressBar(stepIndex) {
    steps.forEach((step, index) => {
        if (index <= stepIndex) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// FAQ Toggle
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isVisible = answer.style.display === 'block';

        // Hide all answers
        document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');

        // Toggle current answer
        answer.style.display = isVisible ? 'none' : 'block';
    });
});

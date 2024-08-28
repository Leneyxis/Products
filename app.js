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

// Check if user is signed in and handle upload button
document.getElementById('upload-button').addEventListener('click', () => {
    const user = firebase.auth().currentUser;
    if (user) {
        // If signed in, trigger file input
        document.getElementById('resume-upload').click();
    } else {
        // If not signed in, trigger Google sign-in
        firebase.auth().signInWithPopup(provider)
            .then(result => {
                console.log('Signed in with Google:', result.user);
                // After sign-in, trigger file input
                document.getElementById('resume-upload').click();
            })
            .catch(error => {
                console.error('Error during sign-in:', error);
            });
    }
});

// Handle file selection and upload
document.getElementById('resume-upload').addEventListener('change', () => {
    const fileInput = document.getElementById('resume-upload');
    const formData = new FormData();
    formData.append('resume', fileInput.files[0]);

    fetch('https://your-api-endpoint/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Move to the next step
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
        document.getElementById('job-description-box').style.display = 'block';
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// Handle job description and cover letter generation
document.getElementById('generate-button').addEventListener('click', () => {
    const jobDescription = document.getElementById('job-description').value;

    fetch('https://your-api-endpoint/job-description', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription: jobDescription }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Move to the next step
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
    firebase.auth().signInWithPopup(provider)
        .then(result => {
            console.log('Signed in with Google:', result.user);
        })
        .catch(error => {
            console.error('Error during sign-in:', error);
        });
});

document.querySelector('.get-started').addEventListener('click', () => {
    firebase.auth().signInWithPopup(provider)
        .then(result => {
            console.log('Signed up with Google:', result.user);
            saveUserData(result.user);
        })
        .catch(error => {
            console.error('Error during sign-up:', error);
        });
});

// Save user data to Firestore
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

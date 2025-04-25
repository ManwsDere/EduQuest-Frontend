// Global state variables
let isLoggedIn = false;
let currentUser = null;
let subscription = null;
 
// Main initialization
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    loadUniversities();
    loadProfessionalCourses();
    setupEventListeners();
});
 
// Set up all event listeners in one place
function setupEventListeners() {
    // Auth-related listeners
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    document.getElementById('loginBtn')?.addEventListener('click', () => showLogin());
    document.getElementById('logoutBtn')?.addEventListener('click', () => logout());
 
    // Profile-related listeners
    document.getElementById('profile-icon')?.addEventListener('click', showProfileModal);
 
    // Modal-related listeners
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('closeProfileModal')?.addEventListener('click', closeProfileModal);
 
    // Page restoration listener
    window.addEventListener('pageshow', function(event) {
        // pageshow event fires when the page is loaded, including from back/forward cache
        if (event.persisted) {
            // Page was restored from back/forward cache
            console.log('Page was restored from cache');
        }
        // Always check login state when page is shown
        checkLogin();
    });
}
 
// Authentication functions
function checkLogin() {
    const token = localStorage.getItem('eduquest_token');
    const user = localStorage.getItem('user');
 
    if (token && user) {
        try {
            // Parse user data from localStorage
            currentUser = JSON.parse(user);
            isLoggedIn = true;
            subscription = currentUser.subscription || null;
 
            // Update the UI for logged-in users
            hideLoginOverlay();
            updateUIForLoggedInUser();
 
            // Set a console message for debugging
            console.log('User logged in:', currentUser.email);
 
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout(); // Log out on corrupted data
            return false;
        }
    } else {
        // If no token or user data, ensure UI reflects logged-out state
        isLoggedIn = false;
        currentUser = null;
        subscription = null;
 
        // Update the UI for logged-out users
        document.getElementById('loginBtn')?.classList.remove('hidden');
        document.getElementById('logoutBtn')?.classList.add('hidden');
        document.getElementById('profile-icon')?.classList.add('hidden');
 
        return false;
    }
}
 
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
 
    // Show loading indicator
    const loginButton = document.querySelector('#loginForm button');
    const originalText = loginButton.textContent;
    loginButton.textContent = 'Logging in...';
    loginButton.disabled = true;
 
    // Call backend API for login
    fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        if (!response.ok) {
            // If server auth fails, try local storage fallback
            throw new Error('Server login failed');
        }
        return response.json();
    })
    .then(data => {
        // Store the token and user info
        localStorage.setItem('eduquest_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
 
        isLoggedIn = true;
        currentUser = data.user;
        subscription = data.user.subscription || null;
 
        hideLoginOverlay();
        updateUIForLoggedInUser();
 
        alert('Login successful!');
    })
    .catch(error => {
        console.error('Login error:', error);
 
        // Fallback to local storage authentication
        let user = JSON.parse(localStorage.getItem(email));
 
        if (!user) {
            alert('User not found! Please sign up.');
            return;
        }
 
        if (user.password !== password) {
            alert('Incorrect password. Try again.');
            return;
        }
 
        localStorage.setItem('user', JSON.stringify(user));
 
        isLoggedIn = true;
        currentUser = user;
        subscription = user.subscription || null;
 
        hideLoginOverlay();
        updateUIForLoggedInUser();
 
        alert('Login successful!');
    })
    .finally(() => {
        // Reset button
        loginButton.textContent = originalText;
        loginButton.disabled = false;
    });
}
 
function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
 
    // Show loading indicator
    const signupButton = document.querySelector('#signupForm button');
    const originalText = signupButton.textContent;
    signupButton.textContent = 'Signing up...';
    signupButton.disabled = true;
 
    // Call backend API for registration
    fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Registration failed');
        }
        return response.json();
    })
    .then(data => {
        alert('Registration successful! You can now log in.');
        showLogin(); // Switch to login form
    })
    .catch(error => {
        console.error('Registration error:', error);
 
        // Fallback to local storage registration
        if (localStorage.getItem(email)) {
            alert('User already exists! Please login.');
            return;
        }
 
        let user = { name, email, password };
        localStorage.setItem(email, JSON.stringify(user));
        alert('Registration successful! You can now log in.');
        showLogin();
    })
    .finally(() => {
        // Reset button
        signupButton.textContent = originalText;
        signupButton.disabled = false;
    });
}
 
function verifyToken(token) {
    fetch('http://localhost:5001/api/auth/verify-token', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            // Token invalid or expired
            logout();
            throw new Error('Invalid token');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Token verification error:', error);
        // Handle silently - user is already logged out by logout() if needed
    });
}
 
function logout() {
    const token = localStorage.getItem('eduquest_token');
 
    if (token) {
        // Inform backend about logout (optional)
        fetch('http://localhost:5001/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(error => {
            console.error('Logout error:', error);
            // Continue with local logout even if server logout fails
        });
    }
 
    // Clear local storage
    localStorage.removeItem('eduquest_token');
    localStorage.removeItem('user');
    localStorage.removeItem('subscription');
 
    isLoggedIn = false;
    currentUser = null;
    subscription = null;
 
    // Update UI
    document.getElementById('loginBtn')?.classList.remove('hidden');
    document.getElementById('logoutBtn')?.classList.add('hidden');
    document.getElementById('profile-icon')?.classList.add('hidden');
 
    showLogin();
 
    alert('Logged out successfully!');
    location.reload();
}
 
// UI state functions
function showLogin() {
    document.getElementById('loginOverlay')?.classList.remove('hidden');
    document.getElementById('signupOverlay')?.classList.add('hidden');
}
 
function showSignup() {
    document.getElementById('loginOverlay')?.classList.add('hidden');
    document.getElementById('signupOverlay')?.classList.remove('hidden');
}
 
function hideLoginOverlay() {
    document.getElementById('loginOverlay')?.classList.add('hidden');
    document.getElementById('signupOverlay')?.classList.add('hidden');
}
 
function updateUIForLoggedInUser() {
    document.getElementById('loginBtn')?.classList.add('hidden');
    document.getElementById('logoutBtn')?.classList.remove('hidden');
    document.getElementById('profile-icon')?.classList.remove('hidden');
 
    // Update profile display if needed
    if (currentUser && currentUser.name) {
        // If you have a profile name display element, update it here
    }
}
 
// Data loading functions
function loadUniversities() {
    const universityGrid = document.getElementById('universityGrid');
 
    // Show loading state
    universityGrid.innerHTML = '<div class="loading">Loading universities...</div>';
 
    // Fetch universities from the API
    fetchWithErrorHandling('http://localhost:5001/api/route/universities')
        .then(data => {
            // Clear the loading message
            universityGrid.innerHTML = '';
 
            // Check if we got valid data
            if (!data || !Array.isArray(data)) {
                universityGrid.innerHTML = '<div class="error">Error loading universities</div>';
                return;
            }
 
            // Render each university
            data.forEach(university => {
                card.className = 'university-card';
 
                // Check if university has courses property, default to 0 if not
                const coursesCount = university.courses ? university.courses.length : 0;
                const universityId = university._id || university.id; // Use _id (MongoDB) if available, fallback to id
                card.innerHTML = `
                    <h3>${university.name}</h3>
                    <p>${coursesCount} Courses Available</p>
                    <button onclick="viewUniversity('${universityId}')" class="subscribe-btn">View Courses</button>
                `;
                universityGrid.appendChild(card);
            });
 
            // If no universities were found
            if (data.length === 0) {
                universityGrid.innerHTML = '<div class="no-data">No universities available</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching universities:', error);
            universityGrid.innerHTML = `<div class="error">Failed to load universities: ${error.message}</div>`;
        });
}
 
// Define your professional courses data
const professionalCourses = {
    courses: [
      {
        name: "Data Science",
        duration: "6 months",
        slug: "data-science"
      },
      {
        name: "Cybersecurity",
        duration: "9 months",
        slug: "cybersecurity"
      },
      {
        name: "Cloud Computing",
        duration: "4 months",
        slug: "cloud"
      }
    ]
  };
 
  // Function to load professional courses
  function loadProfessionalCourses() {
    const courseGrid = document.getElementById('courseGrid');
 
    // Clear existing content
    courseGrid.innerHTML = '';
 
    // Add each course to the grid
    professionalCourses.courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.innerHTML = `
        <h3>${course.name}</h3>
        <p>Duration: ${course.duration}</p>
        <div class="course-buttons">
          <a href="pages/${course.slug}/quiz.html" class="btn">Quizzes</a>
          <a href="pages/${course.slug}/notes.html" class="btn">Notes</a>
          <a href="pages/${course.slug}/videos.html" class="btn">Videos</a>
          <a href="pages/${course.slug}/tests.html" class="btn">Test Series</a>
        </div>
      `;
      courseGrid.appendChild(card);
    });
  }
// Content viewing functions
function viewUniversity(id) {
    if (!isLoggedIn) {
        alert('Please login to view courses');
        return;
    }
 
    if (!subscription) {
        alert('Please subscribe to access course content');
        return;
    }
 
    // Show the modal with loading state
    const modal = document.getElementById('contentModal');
    const modalContent = document.getElementById('modalContent');
 
    modalContent.innerHTML = '<div class="loading">Loading university data...</div>';
    modal.classList.remove('hidden');
 
    // Fetch specific university data
    fetchWithErrorHandling(`http://localhost:5001/api/route/universities/${id}`)
        .then(university => {
            showModal(university);
        })
        .catch(error => {
            console.error('Error fetching university details:', error);
            modalContent.innerHTML = `<div class="error">Failed to load university details: ${error.message}</div>`;
        });
}
 
function viewProfessionalCourse(courseName) {
    if (!isLoggedIn) {
        alert('Please login to view courses');
        return;
    }
 
    if (subscription !== 'premium') {
        alert('Please upgrade to Premium plan to access professional courses');
        return;
    }
 
    // Show the modal with loading state
    const modal = document.getElementById('contentModal');
    const modalContent = document.getElementById('modalContent');
 
    modalContent.innerHTML = '<div class="loading">Loading course data...</div>';
    modal.classList.remove('hidden');
 
    // Fetch specific course data
    fetchWithErrorHandling(`http://localhost:5001/api/route/professional-courses/${encodeURIComponent(courseName)}`)
        .then(course => {
            showProfessionalCourseModal(course);
        })
        .catch(error => {
            console.error('Error fetching course details:', error);
            modalContent.innerHTML = `<div class="error">Failed to load course details: ${error.message}</div>`;
        });
}
 
function showModal(university) {
    const modalContent = document.getElementById('modalContent');
 
    // Clear previous content
    modalContent.innerHTML = '';
 
    // Create container for course selection
    const container = document.createElement('div');
    container.className = 'course-selection-page';
 
    // Create header
    const header = document.createElement('div');
    header.className = 'university-header';
    header.innerHTML = `
        <h1>${university.name}</h1>
        <h2>Select Your Course</h2>
    `;
    container.appendChild(header);
 
    // Create course grid
    const grid = document.createElement('div');
    grid.className = 'course-grid';
 
    // Add courses to grid
    university.courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <h3>${course.name}</h3>
            <p>${course.semesters ? course.semesters.length : 0} Semester${course.semesters && course.semesters.length !== 1 ? 's' : ''}</p>
        `;
 
        // Add click handler
        card.addEventListener('click', () => {
            showSubjectPage(university.name, course.name, course);
        });
 
        grid.appendChild(card);
    });
 
    container.appendChild(grid);
    modalContent.appendChild(container);
}
 
function showProfessionalCourseModal(course) {
    const modalContent = document.getElementById('modalContent');
 
    // Ensure resources exists
    const resources = course.resources || {
        quizzes: [],
        flashcards: [],
        notes: [],
        testSeries: [],
        videos: []
    };
 
    // Create content
    let content = `
        <div class="course-content-header">
            <h2>${course.name}</h2>
            <p>Master the fundamentals of programming</p>
        </div>
        <div class="resource-tabs">
            <div class="resource-tab" onclick="viewResourceContent('quiz', ${escapeJSON(resources.quizzes)})">
                <i class="fas fa-question-circle"></i>
                <h3>Quizzes</h3>
                <p>${resources.quizzes.length} Available</p>
            </div>
            <div class="resource-tab" onclick="viewResourceContent('flashcard', ${escapeJSON(resources.flashcards)})">
                <i class="fas fa-layer-group"></i>
                <h3>Flashcards</h3>
                <p>${resources.flashcards.length} Available</p>
            </div>
            <div class="resource-tab" onclick="viewResourceContent('note', ${escapeJSON(resources.notes)})">
                <i class="fas fa-edit"></i>
                <h3>Notes</h3>
                <p>${resources.notes.length} Available</p>
            </div>
            <div class="resource-tab" onclick="viewResourceContent('test', ${escapeJSON(resources.testSeries)})">
                <i class="fas fa-clipboard-list"></i>
                <h3>Test Series</h3>
                <p>${resources.testSeries.length} Available</p>
            </div>
            <div class="resource-tab" onclick="viewResourceContent('video', ${escapeJSON(resources.videos)})">
                <i class="fas fa-video"></i>
                <h3>Videos</h3>
                <p>${resources.videos.length} Available</p>
            </div>
        </div>
        <div id="resourceContent" class="resource-content">
            <div style="text-align:center;padding:2rem;">
                <i class="fas fa-hand-pointer" style="font-size:2rem;color:var(--primary-color);margin-bottom:1rem;"></i>
                <h3>Select a resource type to begin</h3>
            </div>
        </div>
    `;
 
    modalContent.innerHTML = content;
}
 
function showSubjectPage(universityName, courseName, courseData) {
    const modalContent = document.getElementById('modalContent');
 
    // Clear previous content
    modalContent.innerHTML = '';
 
    // Create container for course content
    const container = document.createElement('div');
    container.className = 'course-content-page';
 
    // Create header
    const header = document.createElement('div');
    header.className = 'course-header';
    header.innerHTML = `
        <h1>${universityName}</h1>
        <h2>${courseName}</h2>
    `;
    container.appendChild(header);
 
    // Create subject selection
    const subjectSelection = document.createElement('div');
    subjectSelection.className = 'subject-selection';
    subjectSelection.innerHTML = `
        <h3>Introduction to Programming</h3>
        <div class="resource-nav">
            <button class="resource-btn" data-type="quiz">
                <i class="fas fa-question-circle"></i> Quizzes
            </button>
            <button class="resource-btn" data-type="flashcard">
                <i class="fas fa-layer-group"></i> Flashcards
            </button>
            <button class="resource-btn" data-type="note">
                <i class="fas fa-edit"></i> Notes
            </button>
            <button class="resource-btn" data-type="test">
                <i class="fas fa-clipboard-list"></i> Tests
            </button>
            <button class="resource-btn" data-type="video">
                <i class="fas fa-video"></i> Videos
            </button>
        </div>
        <div id="resourceContent"></div>`;
 
    // Add event listeners to buttons
    const buttons = subjectSelection.querySelectorAll('.resource-btn');
    buttons.forEach(btn => {
        const type = btn.dataset.type;
        const resources = courseData.resources?.[type + 's'] || [];
 
        btn.addEventListener('click', () => {
            viewResourceContent(type, resources);
        });
    });
 
    container.appendChild(subjectSelection);
    modalContent.appendChild(container);
}
 
function viewResourceContent(type, resources) {
    const resourceContent = document.getElementById('resourceContent');
    if (!resourceContent) return;
 
    let content = '';
 
    switch(type) {
        case 'quiz':
            content = `
                <h2><i class="fas fa-question-circle"></i> Quizzes</h2>
                ${resources.map(quiz => `
                    <div class="quiz-container">
                        <h3>${quiz.title}</h3>
                        ${quiz.questions.map((q, i) => `
                            <div class="quiz-question">
                                <p><strong>Q${i + 1}:</strong> ${q.question}</p>
                                <div class="quiz-options">
                                    ${q.options.map((opt, j) => `
                                        <div class="quiz-option" onclick="selectOption(this, ${q.correct === j})">
                                            ${opt}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            `;
            break;
 
        case 'flashcard':
            content = `
                <h2><i class="fas fa-layer-group"></i> Flashcards</h2>
                <div class="flashcard-grid">
                    ${resources.map(card => `
                        <div class="flashcard" onclick="this.classList.toggle('flipped')">
                            <div class="flashcard-inner">
                                <div class="flashcard-front">
                                    <i class="fas fa-question"></i>
                                    <p>${card.front}</p>
                                </div>
                                <div class="flashcard-back">
                                    <i class="fas fa-lightbulb"></i>
                                    <p>${card.back}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
 
        case 'note':
            content = `
                <h2><i class="fas fa-edit"></i> Study Notes</h2>
                <div class="notes-container">
                    ${resources.map(note => `
                        <div class="note">
                            <h3>${note.title}</h3>
                            <p>${note.content}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
 
        case 'test':
            content = `
                <h2><i class="fas fa-clipboard-list"></i> Test Series</h2>
                ${resources.map(test => `
                    <div class="test-container">
                        <div class="test-info">
                            <h3>${test.title}</h3>
                            <p>Duration: ${test.duration}</p>
                        </div>
                        ${test.questions.map((q, i) => `
                            <div class="test-question">
                                <h4>Q${i + 1}:</h4>
                                <p>${q.question}</p>
                                <p class="marks">Marks: ${q.marks}</p>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            `;
            break;
 
        case 'video':
            content = `
                <h2><i class="fas fa-video"></i> Video Lectures</h2>
                <div class="video-grid">
                    ${resources.map(video => `
                        <div class="video-item">
                            <h3>${video.title}</h3>
                            <p>Duration: ${video.duration}</p>
                            <div class="video-wrapper">
                                <iframe src="${video.url}" frameborder="0" allowfullscreen></iframe>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
    }
 
    resourceContent.innerHTML = content;
}
 
// Modal functions
function closeModal() {
    document.getElementById('contentModal')?.classList.add('hidden');
}
 
function selectOption(element, isCorrect) {
    const options = element.parentElement.children;
    for (let opt of options) {
        opt.classList.remove('selected');
    }
    element.classList.add('selected');
 
    setTimeout(() => {
        alert(isCorrect ? 'Correct!' : 'Incorrect. Try again!');
    }, 500);
}
 
// Profile functions
function showProfileModal() {
    // Only proceed if user is logged in
    if (!isLoggedIn || !currentUser) {
        alert('Please login to view your profile');
        return;
    }
 
    // Get the user ID from the current user object
    const userId = currentUser._id || currentUser.id;
 
    if (!userId) {
        console.error('User ID not found in current user object');
        alert('Unable to fetch profile data. Please try logging in again.');
        return;
    }
 
    // Show loading state in the modal
    document.getElementById('profile-name').textContent = 'Loading...';
    document.getElementById('profile-email').textContent = 'Loading...';
    document.getElementById('profile-subscription').textContent = 'Loading...';
    document.getElementById('profile-joindate').textContent = 'Loading...';
 
    // Show the modal
    document.getElementById('profile-modal').classList.remove('hidden');
 
    // Get the auth token
    const token = localStorage.getItem('eduquest_token');
 
    // Fetch profile data from the API
    fetch(`http://localhost:5001/api/auth/user/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }
        return response.json();
    })
    .then(data => {
        // Update modal content with user data
        const userData = data.user;
 
        document.getElementById('profile-name').textContent = userData.name || 'Not provided';
        document.getElementById('profile-email').textContent = userData.email || 'Not provided';
        document.getElementById('profile-subscription').textContent = 
            userData.subscription ? 
            (userData.subscription.charAt(0).toUpperCase() + userData.subscription.slice(1)) : 
            'Free';
 
        // Format join date
        if (userData.memberSince) {
            const joinDate = new Date(userData.memberSince);
            document.getElementById('profile-joindate').textContent = joinDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            document.getElementById('profile-joindate').textContent = 'Not available';
        }
    })
    .catch(error => {
        console.error('Error fetching profile data:', error);
 
        // Show error in modal
        document.getElementById('profile-name').textContent = currentUser.name || 'Error loading data';
        document.getElementById('profile-email').textContent = currentUser.email || 'Error loading data';
        document.getElementById('profile-subscription').textContent = 
            currentUser.subscription ? 
            (currentUser.subscription.charAt(0).toUpperCase() + currentUser.subscription.slice(1)) : 
            'Free';
        document.getElementById('profile-joindate').textContent = 'Not available';
 
        // Optionally show an error message
        alert('Failed to fetch profile data. Using local data instead.');
    });
}
 
function closeProfileModal() {
    document.getElementById('profile-modal')?.classList.add('hidden');
}
 
function upgradeSubscription() {
    closeProfileModal();
    // Scroll to subscriptions section
    document.getElementById('subscriptions')?.scrollIntoView({
        behavior: 'smooth'
    });
}
 
function subscribe(plan) {
    if (!isLoggedIn) {
        alert('Please login to subscribe');
        return;
    }
 
    if (plan === 'basic') {
        window.location.href = 'basic.html';
    } else if (plan === 'premium') {
        window.location.href = 'premium.html';
    }
}
 
// Helper functions
function escapeString(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
 
function escapeJSON(obj) {
    return JSON.stringify(obj).replace(/</g, '\\u003c');
}
 
function fetchWithErrorHandling(url, options = {}) {
    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(`Fetch error for ${url}:`, error);
            throw error; // Re-throw to allow caller to handle
        });
}
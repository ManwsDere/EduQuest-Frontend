let isLoggedIn = false;
let currentUser = null;
let subscription = null;

document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    loadUniversities();
    loadProfessionalCourses();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
}

// Update checkLogin function
function checkLogin() {
    const token = localStorage.getItem('eduquest_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        isLoggedIn = true;
        currentUser = JSON.parse(user);
        subscription = currentUser.subscription || null;
        hideLoginOverlay();
        updateUIForLoggedInUser();
        
        // Verify token with backend (optional but recommended)
        verifyToken(token);
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
            throw new Error('Login failed');
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
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
    })
    .finally(() => {
        // Reset button
        loginButton.textContent = originalText;
        loginButton.disabled = false;
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

// Replace handleSignup function
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
        alert('Registration failed. Please try again.');
    })
    .finally(() => {
        // Reset button
        signupButton.textContent = originalText;
        signupButton.disabled = false;
    });
}


// Add new function to update UI for logged-in user
function updateUIForLoggedInUser() {
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('profile-icon').classList.remove('hidden');
    
    // Update profile display if needed
    if (currentUser && currentUser.name) {
        // If you have a profile name display element, update it here
    }
}


function showLogin() {
    document.getElementById('signupOverlay').classList.add('hidden');
    document.getElementById('loginOverlay').classList.remove('hidden');
}

function showSignup() {
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('signupOverlay').classList.remove('hidden');
}

function hideLoginOverlay() {
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('signupOverlay').classList.add('hidden');
}

// Update logout function
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
    document.getElementById('loginBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('profile-icon').classList.add('hidden');
    
    showLogin();
}

function loadUniversities() {
    const universityGrid = document.getElementById('universityGrid');
    universities.universities.forEach(university => {
        const card = document.createElement('div');
        card.className = 'university-card';
        card.innerHTML = `
            <h3>${university.name}</h3>
            <p>${university.courses.length} Courses Available</p>
            <button onclick="viewUniversity(${university.id})" class="subscribe-btn">View Courses</button>
        `;
        universityGrid.appendChild(card);
    });
}

function loadProfessionalCourses() {
    const courseGrid = document.getElementById('courseGrid');
    professionalCourses.courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <h3>${course.name}</h3>
            <p>Duration: ${course.duration}</p>
            <button onclick="viewProfessionalCourse('${course.name}')" class="subscribe-btn">View Details</button>
        `;
        courseGrid.appendChild(card);
    });
}

function viewUniversity(id) {
    if (!isLoggedIn) {
        alert('Please login to view courses');
        return;
    }

    if (!subscription) {
        alert('Please subscribe to access course content');
        return;
    }

    const university = universities.universities.find(u => u.id === id);
    showModal(university);
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

    const course = professionalCourses.courses.find(c => c.name === courseName);
    showProfessionalCourseModal(course);
}

function showModal(university) {
    const modal = document.getElementById('contentModal');
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
            <p>${course.semesters.length} Semester${course.semesters.length !== 1 ? 's' : ''}</p>
        `;
        
        // Add click handler
        card.addEventListener('click', () => {
            showSubjectPage(university.name, course.name, course);
        });
        
        grid.appendChild(card);
    });
    
    container.appendChild(grid);
    modalContent.appendChild(container);
    modal.classList.remove('hidden');
}

// Add these helper functions at the top of your main.js
function escapeString(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function escapeJSON(obj) {
    return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function showSubjectPage(universityName, courseName, courseData) {
    const modalContent = document.getElementById('modalContent');
    
    // Create resources with fallback empty arrays
    const resources = courseData.resources || {
        quizzes: [],
        flashcards: [],
        notes: [],
        testSeries: [],
        videos: []
    };

    const content = `
        <div class="course-content-page">
            <div class="course-header">
                <h1>${universityName}</h1>
                <h2>${courseName}</h2>
            </div>
            <div class="subject-selection">
                <h3>Introduction to Programming</h3>
                <div class="resource-nav">
                    <button class="resource-btn" data-type="quiz">
                        <i class="fas fa-question-circle"></i> Quizzes
                    </button>
                    <!-- Other buttons similarly -->
                </div>
                <div id="resourceContent"></div>
            </div>
        </div>
    `;

    modalContent.innerHTML = content;

    // Add event listeners to the buttons
    document.querySelectorAll('.resource-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            viewResourceContent(type, resources[type]);
        });
    });
}

function showProfessionalCourseModal(course) {
    const modal = document.getElementById('contentModal');
    const modalContent = document.getElementById('modalContent');
    
    let content = `
        <div class="course-content-header">
            <h2>${course.name}</h2>
            <p>Master the fundamentals of programming</p>
        </div>
        <div class="resource-tabs">
            <div class="resource-tab" onclick="viewResourceContent('quiz', ${JSON.stringify(course.resources.quizzes)})">
                <i class="fas fa-question-circle"></i>
                <h3>Quizzes</h3>
                <p>${course.resources.quizzes.length} Available</p>
            </div>
            <div class="resource-tab" onclick="viewResourceContent('flashcard', ${JSON.stringify(course.resources.flashcards)})">
                <i class="fas fa-layer-group"></i>
                <h3>Flashcards</h3>
                <p>${course.resources.flashcards.length} Available</p>
            </div>
            <div class="resource-tab" onclick="viewResourceContent('note', ${JSON.stringify(course.resources.notes)})">
                <i class="fas fa-edit"></i>
                <h3>Notes</h3>
                <p>${course.resources.notes.length} Available</p>
            </div>
            <div class="resource-tab" onclick="viewResourceContent('test', ${JSON.stringify(course.resources.testSeries)})">
                <i class="fas fa-clipboard-list"></i>
                <h3>Test Series</h3>
                <p>${course.resources.testSeries.length} Available</p>
            </div>
            <div class="resource-tab" onclick="viewResourceContent('video', ${JSON.stringify(course.resources.videos)})">
                <i class="fas fa-video"></i>
                <h3>Videos</h3>
                <p>${course.resources.videos.length} Available</p>
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
    modal.classList.remove('hidden');
}

function viewCourseContent(universityName, courseName) {
    const university = universities.universities.find(u => u.name === universityName);
    const course = university.courses.find(c => c.name === courseName);
    
    const modalContent = document.getElementById('modalContent');
    let content = `
        <h2>${courseName} - ${universityName}</h2>
        <div class="content-grid">
    `;

    course.semesters.forEach(semester => {
        semester.subjects.forEach(subject => {
            content += `
                <div class="content-card">
                    <h3>${subject.name}</h3>
                    <div class="resource-links">
                        <button onclick="viewResourceContent('quiz', ${JSON.stringify(subject.resources.quizzes)})">Quizzes</button>
                        <button onclick="viewResourceContent('flashcard', ${JSON.stringify(subject.resources.flashcards)})">Flashcards</button>
                        <button onclick="viewResourceContent('note', ${JSON.stringify(subject.resources.notes)})">Notes</button>
                        <button onclick="viewResourceContent('test', ${JSON.stringify(subject.resources.testSeries)})">Tests</button>
                        <button onclick="viewResourceContent('video', ${JSON.stringify(subject.resources.videos)})">Videos</button>
                    </div>
                </div>
            `;
        });
    });

    content += '</div>';
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
        <div id="resourceContent"></div>
    `;
    
    // Add event listeners to buttons
    const buttons = subjectSelection.querySelectorAll('.resource-btn');
    buttons.forEach(btn => {
        const type = btn.dataset.type;
        const resources = courseData.resources?.[type] || [];
        
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

function closeModal() {
    document.getElementById('contentModal').classList.add('hidden');
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

//--------------------------------------------------------------------------------------------------------------------//
function showProfileModal() {
    // Fetch profile data first
    fetchProfileData().then(userData => {
        // Update modal content
        document.getElementById('profile-name').textContent = userData.name || 'Not provided';
        document.getElementById('profile-email').textContent = userData.email;
        document.getElementById('profile-subscription').textContent = userData.subscription || 'free';
        
        // Format join date
        if (userData.created_at) {
            const joinDate = new Date(userData.created_at);
            document.getElementById('profile-joindate').textContent = joinDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // Show modal
        document.getElementById('profile-modal').classList.remove('hidden');
    });
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.add('hidden');
}

function fetchProfileData() {
    return fetch('/profile', {
        credentials: 'include'
    })
    .then(response => response.json())
    .catch(error => {
        console.error('Error fetching profile:', error);
        return {
            name: 'Error loading data',
            email: 'N/A',
            subscription: 'unknown',
            created_at: null
        };
    });
}

function upgradeSubscription() {
    closeProfileModal();
    // Scroll to subscriptions section
    document.getElementById('subscriptions').scrollIntoView({
        behavior: 'smooth'
    });
}

// Add click event to your profile icon
document.getElementById('profile-icon').addEventListener('click', showProfileModal);


document.addEventListener("DOMContentLoaded", function() {
  checkUserStatus();

  document.getElementById('loginForm').addEventListener('submit', function(event) {
      event.preventDefault(); 
      login();
  });

  document.getElementById('signupForm').addEventListener('submit', function(event) {
      event.preventDefault(); 
      register();
  });
});

function showLogin() {
  document.getElementById('loginOverlay').classList.remove('hidden');
  document.getElementById('signupOverlay').classList.add('hidden');
}

function showSignup() {
  document.getElementById('signupOverlay').classList.remove('hidden');
  document.getElementById('loginOverlay').classList.add('hidden');
}

function checkUserStatus() {
  let user = JSON.parse(localStorage.getItem('user'));
  if (user) {
      document.getElementById('loginBtn').classList.add('hidden');
      document.getElementById('logoutBtn').classList.remove('hidden');
      document.getElementById('profile-icon').classList.remove('hidden');
  } else {
      document.getElementById('loginBtn').classList.remove('hidden');
      document.getElementById('logoutBtn').classList.add('hidden');
      document.getElementById('profile-icon').classList.add('hidden');
  }
}

function login() {
  let email = document.getElementById('email').value;
  let password = document.getElementById('password').value;
  
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
  alert('Login successful!');
  location.reload();
}

function register() {
  let name = document.getElementById('name').value;
  let email = document.getElementById('signupEmail').value;
  let password = document.getElementById('signupPassword').value;

  if (localStorage.getItem(email)) {
      alert('User already exists! Please login.');
      return;
  }

  let user = { name, email, password };
  localStorage.setItem(email, JSON.stringify(user));
  alert('Registration successful! You can now log in.');
  showLogin();
}

function logout() {
  localStorage.removeItem('user');
  alert('Logged out successfully!');
  location.reload();
}


//Databse 
// Keep the existing code but replace the loadUniversities function

document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    loadUniversities();
    loadProfessionalCourses();
    setupEventListeners();
});

// Replace this function
function loadUniversities() {
    const universityGrid = document.getElementById('universityGrid');
    
    // Show loading state
    universityGrid.innerHTML = '<div class="loading">Loading universities...</div>';
    
    // Fetch universities from the API
    fetch('http://localhost:5001/api/route/universities')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
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
                const card = document.createElement('div');
                card.className = 'university-card';
                
                // Check if university has courses property, default to 0 if not
                const coursesCount = university.courses ? university.courses.length : 0;
                
                card.innerHTML = `
                    <h3>${university.name}</h3>
                    <p>${coursesCount} Courses Available</p>
                    <button onclick="viewUniversity(${university.id})" class="subscribe-btn">View Courses</button>
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
    fetch(`http://localhost:5001/api/route/universities/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(university => {
            showModal(university);
        })
        .catch(error => {
            console.error('Error fetching university details:', error);
            modalContent.innerHTML = `<div class="error">Failed to load university details: ${error.message}</div>`;
        });
}

// Add these utility functions to your main.js

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
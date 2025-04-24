// ===============================================
// File: api-integration.js
// Add this file to your project and include it in your HTML
// ===============================================

// API Base URL - change this if your API is hosted elsewhere
const API_BASE_URL = 'http://localhost:5001/api/route';

// Utility function for consistent fetch error handling
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

// Function to load all universities from API
function loadUniversitiesFromAPI() {
    const universityGrid = document.getElementById('universityGrid');
    
    // Show loading state
    universityGrid.innerHTML = '<div class="loading">Loading universities</div>';
    
    // Fetch universities from the API
    fetchWithErrorHandling(`${API_BASE_URL}/universities`)
        .then(data => {
            // Clear the loading message
            universityGrid.innerHTML = '';
            
            // Render each university
            data.forEach(university => {
                const card = document.createElement('div');
                card.className = 'university-card';
                
                // Get course count safely
                const coursesCount = university.courses ? university.courses.length : 0;
                
                card.innerHTML = `
    <h3>${university.name}</h3>
    <p>${coursesCount} Courses Available</p>
    <button onclick="viewUniversityDetails('${university._id}')" class="subscribe-btn">View Courses</button>
`;

                universityGrid.appendChild(card);
            });
            
            // If no universities were found
            if (data.length === 0) {
                universityGrid.innerHTML = '<div class="no-data">No universities available</div>';
            }
        })
        .catch(error => {
            universityGrid.innerHTML = `<div class="error">Failed to load universities: ${error.message}</div>`;
        });
}

// Function to fetch and display specific university details
function viewUniversityDetails(id) {
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
    
    modalContent.innerHTML = '<div class="loading">Loading university data</div>';
    modal.classList.remove('hidden');
    
    // Fetch specific university data
    fetchWithErrorHandling(`${API_BASE_URL}/universities/${id}`)
        .then(university => {
            displayUniversityDetails(university);
        })
        .catch(error => {
            modalContent.innerHTML = `<div class="error">Failed to load university details: ${error.message}</div>`;
        });
}

// Function to display university details in the modal
function displayUniversityDetails(university) {
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
    
    // Check if courses array exists and has items
    if (university.courses && university.courses.length > 0) {
        // Add courses to grid
        university.courses.forEach(course => {
            const card = document.createElement('div');
            card.className = 'course-card';
            
            // Get semester count safely
            const semesterCount = course.semesters ? course.semesters.length : 0;
            
            card.innerHTML = `
                <h3>${course.name}</h3>
                <p>${semesterCount} Semester${semesterCount !== 1 ? 's' : ''}</p>
            `;
            
            // Add click handler
            card.addEventListener('click', () => {
                showCourseDetails(university.name, course);
            });
            
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<div class="no-data">No courses available for this university</div>';
    }
    
    container.appendChild(grid);
    modalContent.appendChild(container);
}

// Function to show course details
function showCourseDetails(universityName, course) {
    const modalContent = document.getElementById('modalContent');
    
    // Create resources with fallback empty arrays
    const resources = course.resources || {
        quizzes: [],
        flashcards: [],
        notes: [],
        testSeries: [],
        videos: []
    };

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
        <h2>${course.name}</h2>
    `;
    container.appendChild(header);
    
    // Create subject selection
    const subjectSelection = document.createElement('div');
    subjectSelection.className = 'subject-selection';
    
    // Get the first subject if available
    const subjectName = course.semesters && course.semesters[0] && course.semesters[0].subjects && 
                        course.semesters[0].subjects[0] ? course.semesters[0].subjects[0].name : 'Introduction to Cloud';
    
    subjectSelection.innerHTML = `
        <h3>${subjectName}</h3>
        <div class="resource-nav">
            <button class="resource-btn" data-type="quizzes">
                <i class="fas fa-question-circle"></i> Quizzes
            </button>
            <button class="resource-btn" data-type="flashcards">
                <i class="fas fa-layer-group"></i> Flashcards
            </button>
            <button class="resource-btn" data-type="notes">
                <i class="fas fa-edit"></i> Notes
            </button>
            <button class="resource-btn" data-type="testSeries">
                <i class="fas fa-clipboard-list"></i> Tests
            </button>
            <button class="resource-btn" data-type="videos">
                <i class="fas fa-video"></i> Videos
            </button>
        </div>
        <div id="resourceContent" class="resource-content">
            <div class="resource-placeholder">
                <p>Select a resource type from above to view content</p>
            </div>
        </div>
    `;
    
    // Add event listeners to buttons
    container.appendChild(subjectSelection);
    modalContent.appendChild(container);
    
    // Now add event listeners to the resource buttons
    document.querySelectorAll('.resource-btn').forEach(btn => {
        const type = btn.dataset.type;
        
        btn.addEventListener('click', () => {
            viewResourceContent(type, resources[type] || []);
            
            // Highlight the selected button
            document.querySelectorAll('.resource-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Initialize the API integration
document.addEventListener('DOMContentLoaded', function() {
    // Check if the universities section exists
    if (document.getElementById('universityGrid')) {
        // Replace the original loadUniversities function
        window.loadUniversities = loadUniversitiesFromAPI;
        
        // Make the viewUniversityDetails function globally available
        window.viewUniversityDetails = viewUniversityDetails;
        
        // Call the new function to load universities
        loadUniversitiesFromAPI();
    }
});
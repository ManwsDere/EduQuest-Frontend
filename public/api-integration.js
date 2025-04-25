// ===============================================
// File: api-integration.js - Complete Implementation
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

// Global state to store navigation history for back buttons
let navigationState = {
    currentUniversity: null,
    currentCourse: null,
    currentSubject: null,
    breadcrumbs: []
};

// Function to load university details
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
    
    modalContent.innerHTML = '<div class="loading">Loading university data...</div>';
    modal.classList.remove('hidden');
    
    // Fetch specific university data
    fetchWithErrorHandling(`${API_BASE_URL}/universities/${id}`)
        .then(university => {
            // Store in navigation state
            navigationState.currentUniversity = university;
            navigationState.currentCourse = null;
            navigationState.currentSubject = null;
            navigationState.breadcrumbs = [
                { name: university.name, action: () => viewUniversityDetails(university._id) }
            ];
            
            displayUniversityDetails(university);
        })
        .catch(error => {
            console.error('Error fetching university details:', error);
            modalContent.innerHTML = `<div class="error">Failed to load university details: ${error.message}</div>`;
        });
}

// Display university details
function displayUniversityDetails(university) {
    const modalContent = document.getElementById('modalContent');
    
    // Clear previous content
    modalContent.innerHTML = '';
    
    // Create container for course selection
    const container = document.createElement('div');
    container.className = 'course-selection-page';
    
    // Create header with breadcrumbs
    const header = document.createElement('div');
    header.className = 'university-header';
    
    // Add breadcrumbs navigation
    const breadcrumbsDiv = document.createElement('div');
    breadcrumbsDiv.className = 'breadcrumbs';
    breadcrumbsDiv.innerHTML = renderBreadcrumbs();
    header.appendChild(breadcrumbsDiv);
    
    // Add title
    header.innerHTML += `
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
        university.courses.forEach((course, courseIndex) => {
            const card = document.createElement('div');
            card.className = 'course-card';
            
            // Get the number of subjects
            const subjectsCount = course.subjects ? course.subjects.length : 0;
            
            card.innerHTML = `
                <h3>${course.name}</h3>
                <p>${subjectsCount} Subject${subjectsCount !== 1 ? 's' : ''}</p>
            `;
            
            // Add click handler to show subjects for this course
            card.addEventListener('click', () => {
                displaySubjectsForCourse(university._id, university.name, course, courseIndex);
            });
            
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<div class="no-data">No courses available for this university</div>';
    }
    
    container.appendChild(grid);
    modalContent.appendChild(container);
}

// Display subjects for a selected course
function displaySubjectsForCourse(universityId, universityName, course, courseIndex) {
    const modalContent = document.getElementById('modalContent');
    
    // Update navigation state
    navigationState.currentCourse = { ...course, index: courseIndex };
    navigationState.currentSubject = null;
    navigationState.breadcrumbs = [
        { name: universityName, action: () => viewUniversityDetails(universityId) },
        { name: course.name, action: () => displaySubjectsForCourse(universityId, universityName, course, courseIndex) }
    ];
    
    // Clear previous content
    modalContent.innerHTML = '';
    
    // Create container
    const container = document.createElement('div');
    container.className = 'course-content-page';
    
    // Create header with breadcrumbs
    const header = document.createElement('div');
    header.className = 'course-header';
    
    // Add breadcrumbs navigation
    const breadcrumbsDiv = document.createElement('div');
    breadcrumbsDiv.className = 'breadcrumbs';
    breadcrumbsDiv.innerHTML = renderBreadcrumbs();
    header.appendChild(breadcrumbsDiv);
    
    header.innerHTML += `
        <h1>${universityName}</h1>
        <h2>${course.name}</h2>
    `;
    container.appendChild(header);
    
    // Create subjects list
    const subjectsList = document.createElement('div');
    subjectsList.className = 'subjects-list';
    
    // Title
    const title = document.createElement('h3');
    title.className = 'section-title';
    title.innerHTML = 'Select a Subject';
    subjectsList.appendChild(title);
    
    // Check if subjects exist
    if (course.subjects && course.subjects.length > 0) {
        const subjectsGrid = document.createElement('div');
        subjectsGrid.className = 'subject-grid';
        
        // Add each subject
        course.subjects.forEach((subject, subjectIndex) => {
            const subjectCard = document.createElement('div');
            subjectCard.className = 'subject-card';
            
            // Get the number of elements/resources
            const elementsCount = subject.elements ? subject.elements.length : 0;
            
            subjectCard.innerHTML = `
                <h3>${subject.name}</h3>
                <p>${elementsCount} Resource${elementsCount !== 1 ? 's' : ''} Available</p>
            `;
            
            // Add click handler to load subject content
            subjectCard.addEventListener('click', () => {
                displaySubjectResourceTypes(universityId, universityName, course.name, subject, courseIndex, subjectIndex);
            });
            
            subjectsGrid.appendChild(subjectCard);
        });
        
        subjectsList.appendChild(subjectsGrid);
    } else {
        subjectsList.innerHTML += '<div class="no-data">No subjects available for this course</div>';
    }
    
    container.appendChild(subjectsList);
    modalContent.appendChild(container);
}

// Display resource types for a subject
function displaySubjectResourceTypes(universityId, universityName, courseName, subject, courseIndex, subjectIndex) {
    const modalContent = document.getElementById('modalContent');
    
    // Update navigation state
    navigationState.currentSubject = { ...subject, index: subjectIndex };
    navigationState.breadcrumbs = [
        { name: universityName, action: () => viewUniversityDetails(universityId) },
        { name: courseName, action: () => displaySubjectsForCourse(universityId, universityName, navigationState.currentCourse, courseIndex) },
        { name: subject.name, action: () => displaySubjectResourceTypes(universityId, universityName, courseName, subject, courseIndex, subjectIndex) }
    ];
    
    // Clear previous content
    modalContent.innerHTML = '';
    
    // Create container
    const container = document.createElement('div');
    container.className = 'subject-content-page';
    
    // Create header with breadcrumbs
    const header = document.createElement('div');
    header.className = 'subject-header';
    
    // Add breadcrumbs navigation
    const breadcrumbsDiv = document.createElement('div');
    breadcrumbsDiv.className = 'breadcrumbs';
    breadcrumbsDiv.innerHTML = renderBreadcrumbs();
    header.appendChild(breadcrumbsDiv);
    
    header.innerHTML += `
        <h2>${subject.name}</h2>
        <p>Select a resource type to view</p>
    `;
    container.appendChild(header);
    
    // Group elements by type
    const resourcesByType = {};
    
    if (subject.elements && subject.elements.length > 0) {
        subject.elements.forEach(element => {
            if (!resourcesByType[element.type]) {
                resourcesByType[element.type] = [];
            }
            resourcesByType[element.type].push(element);
        });
    }
    
    // Create the resource types grid
    const resourceTypesGrid = document.createElement('div');
    resourceTypesGrid.className = 'resource-types-grid';
    
    // Define resource types with icons and labels
    const resourceTypes = [
        { type: 'quiz', icon: 'fa-question-circle', label: 'Quizzes', count: (resourcesByType.quiz || []).length },
        { type: 'flashcard', icon: 'fa-layer-group', label: 'Flashcards', count: (resourcesByType.flashcard || []).length },
        { type: 'note', icon: 'fa-edit', label: 'Notes', count: (resourcesByType.note || []).length },
        { type: 'test', icon: 'fa-clipboard-list', label: 'Tests', count: (resourcesByType.test || []).length },
        { type: 'video', icon: 'fa-video', label: 'Videos', count: (resourcesByType.video || []).length }
    ];
    
    // Create a card for each resource type
    resourceTypes.forEach(resource => {
        const resourceCard = document.createElement('div');
        resourceCard.className = 'resource-type-card';
        resourceCard.innerHTML = `
            <div class="resource-type-icon">
                <i class="fas ${resource.icon}"></i>
            </div>
            <h3>${resource.label}</h3>
            <p>${resource.count} available</p>
        `;
        
        // Only make it clickable if resources exist
        if (resource.count > 0) {
            resourceCard.classList.add('has-content');
            // Add click handler to show this resource type content
            resourceCard.addEventListener('click', () => {
                displayResourceContent(universityId, universityName, courseName, subject.name, resource.type, resourcesByType[resource.type] || [], courseIndex, subjectIndex);
            });
        } else {
            resourceCard.classList.add('no-content');
        }
        
        resourceTypesGrid.appendChild(resourceCard);
    });
    
    container.appendChild(resourceTypesGrid);
    modalContent.appendChild(container);
}

// Display specific resource content (quiz, flashcard, etc.)
function displayResourceContent(universityId, universityName, courseName, subjectName, type, resources, courseIndex, subjectIndex) {
    const modalContent = document.getElementById('modalContent');
    
    // Log resource data for debugging
    console.log(`Displaying ${type} resources:`, resources);
    
    // Update breadcrumbs with this page
    navigationState.breadcrumbs = [
        { name: universityName, action: () => viewUniversityDetails(universityId) },
        { name: courseName, action: () => displaySubjectsForCourse(universityId, universityName, navigationState.currentCourse, courseIndex) },
        { name: subjectName, action: () => displaySubjectResourceTypes(universityId, universityName, courseName, navigationState.currentSubject, courseIndex, subjectIndex) },
        { name: getResourceTypeLabel(type), action: null }
    ];
    
    // Clear previous content
    modalContent.innerHTML = '';
    
    // Create resource container
    const container = document.createElement('div');
    container.className = 'resource-content-page';
    
    // Create header with breadcrumbs
    const header = document.createElement('div');
    header.className = 'resource-header';
    
    // Add breadcrumbs navigation
    const breadcrumbsDiv = document.createElement('div');
    breadcrumbsDiv.className = 'breadcrumbs';
    breadcrumbsDiv.innerHTML = renderBreadcrumbs();
    header.appendChild(breadcrumbsDiv);
    
    header.innerHTML += `
        <h2><i class="fas ${getResourceTypeIcon(type)}"></i> ${getResourceTypeLabel(type)}</h2>
    `;
    container.appendChild(header);
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'resource-content-area';
    
    // If no resources, show message
    if (!resources || resources.length === 0) {
        contentArea.innerHTML = `
            <div class="no-data">
                <p>No ${getResourceTypeLabel(type).toLowerCase()} available for this subject yet.</p>
            </div>
        `;
        container.appendChild(contentArea);
        modalContent.appendChild(container);
        return;
    }
    
    // Handle different resource types
    switch (type) {
        case 'quiz':
            renderQuizContent(contentArea, resources);
            break;
        case 'flashcard':
            renderFlashcardContent(contentArea, resources);
            break;
        case 'note':
            renderNoteContent(contentArea, resources);
            break;
        case 'test':
            renderTestContent(contentArea, resources);
            break;
        case 'video':
            renderVideoContent(contentArea, resources);
            break;
        default:
            contentArea.innerHTML = `
                <div class="no-data">
                    <p>Unknown resource type.</p>
                </div>
            `;
    }
    
    container.appendChild(contentArea);
    modalContent.appendChild(container);
}

// Helper function - Render Quiz Content
function renderQuizContent(container, resources) {
    console.log("Quiz resources:", resources); // Debug log to see the data
    
    // Create quiz container
    const quizContent = document.createElement('div');
    quizContent.className = 'quiz-content';
    
    // Process each quiz element
    resources.forEach((element, elementIndex) => {
        console.log(`Processing quiz ${elementIndex}:`, element); // Debug log
        
        // Each element is a single quiz activity
        const quizSection = document.createElement('div');
        quizSection.className = 'quiz-container';
        quizSection.id = `quiz-${elementIndex}`;
        
        // Extract the quiz content (handle different possible structures)
        const quizContent = element.content;
        console.log("Quiz content:", quizContent); // Debug log
        
        // Add quiz title
        const quizHeader = document.createElement('h3');
        quizHeader.textContent = quizContent.title || `Quiz ${elementIndex + 1}`;
        quizHeader.className = 'quiz-title';
        quizSection.appendChild(quizHeader);

        // Create question container
        const questionContainer = document.createElement('div');
        questionContainer.className = 'questions-container';
        
        // Process each question - handle different MongoDB data structures
        if (quizContent.question) {
            // Single question format (if quiz itself is a single question)
            console.log("Single question format detected");
            const questionElem = createQuestionElement(quizContent, 0);
            questionContainer.appendChild(questionElem);
        } else if (Array.isArray(quizContent.questions)) {
            // Multiple questions format (standard format)
            console.log(`Found ${quizContent.questions.length} questions`);
            quizContent.questions.forEach((question, qIndex) => {
                const questionElem = createQuestionElement(question, qIndex);
                questionContainer.appendChild(questionElem);
            });
        } else {
            // Try to extract from any other format
            console.log("Non-standard format detected, attempting to extract questions");
            
            // If the content itself is the question
            if (quizContent.options && quizContent.answer) {
                const questionElem = createQuestionElement(quizContent, 0);
                questionContainer.appendChild(questionElem);
            } else {
                questionContainer.innerHTML = '<p class="error">Could not parse quiz questions from the data structure.</p>';
                console.error("Unable to parse questions from:", quizContent);
            }
        }
        
        // Add quiz progress and score tracking
        const quizFooter = document.createElement('div');
        quizFooter.className = 'quiz-footer';
        
        // Determine question count based on the structure
        let questionCount = 0;
        if (quizContent.questions) {
            questionCount = quizContent.questions.length;
        } else if (quizContent.question) {
            questionCount = 1;
        } else if (quizContent.options && quizContent.answer) {
            questionCount = 1;
        }
        
        quizFooter.innerHTML = `
            <div class="quiz-progress">
                <span class="current-score">Score: <strong>0</strong>/${questionCount}</span>
            </div>
        `;
        
        // Add question container and footer to quiz section
        quizSection.appendChild(questionContainer);
        quizSection.appendChild(quizFooter);
        
        // Add the complete quiz section to the main container
        quizContent.appendChild(quizSection);
    });
    
    container.appendChild(quizContent);
}

// Helper function - Create a question element
function createQuestionElement(question, index) {
    console.log(`Creating question element for index ${index}:`, question); // Debug log
    
    const questionElem = document.createElement('div');
    questionElem.className = 'quiz-question';
    questionElem.dataset.questionIndex = index;
    
    // Add question text - handle different possible structures
    const questionText = document.createElement('p');
    const questionContent = question.question || question.text || "Question not available";
    questionText.innerHTML = `<strong>Q${index + 1}:</strong> ${questionContent}`;
    questionElem.appendChild(questionText);
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'quiz-options';
    
    // Check if options is an array
    if (Array.isArray(question.options)) {
        // Process each option
        question.options.forEach((option, oIndex) => {
            const optionElem = document.createElement('div');
            optionElem.className = 'quiz-option';
            optionElem.textContent = option;
            
            // Determine if this option is correct - handle different formats
            let isCorrect = false;
            
            if (typeof question.correct === 'number') {
                // If correct is an index
                isCorrect = oIndex === question.correct;
            } else if (question.answer !== undefined) {
                // If answer is provided directly
                if (typeof question.answer === 'string') {
                    isCorrect = option === question.answer;
                } else if (typeof question.answer === 'number') {
                    isCorrect = oIndex === question.answer;
                }
            } else if (question.correctAnswer !== undefined) {
                // Alternative property name
                isCorrect = option === question.correctAnswer;
            }
            
            console.log(`Option ${oIndex}: "${option}", Correct: ${isCorrect}`); // Debug log
            optionElem.dataset.correct = isCorrect.toString();
            
            // Add click handler for option selection
            optionElem.addEventListener('click', function() {
                handleOptionSelection(this, questionElem);
            });
            
            optionsContainer.appendChild(optionElem);
        });
    } else {
        optionsContainer.innerHTML = '<p class="error">No options available for this question</p>';
        console.error("No options found for question:", question);
    }
    
    // Add feedback element (initially hidden)
    const feedbackElem = document.createElement('div');
    feedbackElem.className = 'quiz-feedback hidden';
    
    // Add options and feedback to question
    questionElem.appendChild(optionsContainer);
    questionElem.appendChild(feedbackElem);
    
    return questionElem;
}

// Helper function - Render Flashcard Content
function renderFlashcardContent(container, resources) {
    const flashcardContainer = document.createElement('div');
    flashcardContainer.innerHTML = `
        <div class="flashcard-instruction">
            <p><i class="fas fa-info-circle"></i> Click on a card to flip it and reveal the answer</p>
        </div>
        <div class="flashcard-grid">
            ${resources.map((element, index) => {
                const content = element.content;
                return `
                    <div class="flashcard" onclick="this.classList.toggle('flipped')">
                        <div class="flashcard-inner">
                            <div class="flashcard-front">
                                <i class="fas fa-question"></i>
                                <p>${content.front || 'Question'}</p>
                            </div>
                            <div class="flashcard-back">
                                <i class="fas fa-lightbulb"></i>
                                <p>${content.back || 'Answer'}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.appendChild(flashcardContainer);
}

// Helper function - Render Note Content
function renderNoteContent(container, resources) {
    const notesContainer = document.createElement('div');
    notesContainer.className = 'notes-container';
    
    resources.forEach(element => {
        const content = element.content;
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.innerHTML = `
            <h3>${content.title || 'Note'}</h3>
            <div class="note-content">${content.content || ''}</div>
        `;
        notesContainer.appendChild(noteElement);
    });
    
    container.appendChild(notesContainer);
}

// Helper function - Render Test Content
function renderTestContent(container, resources) {
    resources.forEach(element => {
        const content = element.content;
        const testContainer = document.createElement('div');
        testContainer.className = 'test-container';
        
        testContainer.innerHTML = `
            <div class="test-info">
                <h3>${content.title || 'Test'}</h3>
                <p><i class="fas fa-clock"></i> Duration: ${content.duration || 'Not specified'}</p>
                <p><i class="fas fa-question-circle"></i> Questions: ${content.questions ? content.questions.length : 0}</p>
            </div>
            <div class="test-preview">
                ${content.questions ? content.questions.slice(0, 2).map((q, i) => `
                    <div class="test-question-preview">
                        <h4>Q${i + 1}:</h4>
                        <p>${q.question}</p>
                        <p class="marks">Marks: ${q.marks || 1}</p>
                    </div>
                `).join('') : ''}
                ${content.questions && content.questions.length > 2 ? `
                    <div class="test-more">
                        <p>+ ${content.questions.length - 2} more questions</p>
                    </div>
                ` : ''}
            </div>
            <button class="start-test-btn">Start Test</button>
        `;
        
        // Add event listener for the start test button
        const startButton = testContainer.querySelector('.start-test-btn');
        if (startButton) {
            startButton.addEventListener('click', () => {
                alert('Test functionality will be implemented soon!');
            });
        }
        
        container.appendChild(testContainer);
    });
}

// Helper function - Render Video Content
function renderVideoContent(container, resources) {
    const videoGrid = document.createElement('div');
    videoGrid.className = 'video-grid';
    
    resources.forEach(element => {
        const content = element.content;
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.innerHTML = `
            <h3>${content.title || 'Video'}</h3>
            <p><i class="fas fa-clock"></i> Duration: ${content.duration || 'Not specified'}</p>
            <div class="video-wrapper">
                <iframe src="${content.url || ''}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
        videoGrid.appendChild(videoItem);
    });
    
    container.appendChild(videoGrid);
}

// Function to handle option selection in quizzes
function handleOptionSelection(optionElement, questionElement) {
    // Get all options in this question
    const options = questionElement.querySelectorAll('.quiz-option');
    
    // Don't allow selection if an option is already selected
    if (questionElement.querySelector('.quiz-option.selected')) {
        return;
    }
    
    // Mark the clicked option as selected
    optionElement.classList.add('selected');
    
    // Get the feedback element
    const feedbackElem = questionElement.querySelector('.quiz-feedback');
    
    // Check if the selected option is correct
    const isCorrect = optionElement.dataset.correct === 'true';
    
    // Show appropriate feedback
    if (isCorrect) {
        feedbackElem.innerHTML = '<p class="correct-feedback"><i class="fas fa-check-circle"></i> Correct! Well done.</p>';
        feedbackElem.classList.add('correct');
        
        // Update the score in the quiz footer
        const quizContainer = questionElement.closest('.quiz-container');
        const scoreElement = quizContainer.querySelector('.current-score strong');
        if (scoreElement) {
            const currentScore = parseInt(scoreElement.textContent) || 0;
            scoreElement.textContent = currentScore + 1;
        }
        
        // Highlight the correct answer
        optionElement.classList.add('correct');
    } else {
        feedbackElem.innerHTML = '<p class="incorrect-feedback"><i class="fas fa-times-circle"></i> Incorrect. Try again!</p>';
        feedbackElem.classList.add('incorrect');
        
        // Highlight the incorrect answer
        optionElement.classList.add('incorrect');
        
        // Optionally: Show the correct answer after a wrong selection
        options.forEach(opt => {
            if (opt.dataset.correct === 'true') {
                setTimeout(() => {
                    opt.classList.add('correct-answer');
                }, 1000);
            }
        });
    }
    
    // Show the feedback
    feedbackElem.classList.remove('hidden');
}

// Helper function - Render breadcrumbs based on navigation state
function renderBreadcrumbs() {
    let breadcrumbsHTML = '';
    
    navigationState.breadcrumbs.forEach((crumb, index) => {
        if (index === navigationState.breadcrumbs.length - 1) {
            // Last item (current page) has no link
            breadcrumbsHTML += `<span class="current">${crumb.name}</span>`;
        } else {
            // Other items are clickable
            breadcrumbsHTML += `<a href="#" onclick="event.preventDefault(); navigateToBreadcrumb(${index})">${crumb.name}</a>`;
            
            // Add separator if not the last item
            if (index < navigationState.breadcrumbs.length - 1) {
                breadcrumbsHTML += `<span class="separator">›</span>`;
            }
        }
    });
    
    return breadcrumbsHTML;
}

// Navigate to a specific breadcrumb
function navigateToBreadcrumb(index) {
    if (index >= 0 && index < navigationState.breadcrumbs.length) {
        const crumb = navigationState.breadcrumbs[index];
        if (crumb.action) {
            crumb.action();
        }
    }
}

// Helper - Get resource type label
function getResourceTypeLabel(type) {
    const types = {
        'quiz': 'Quizzes',
        'flashcard': 'Flashcards',
        'note': 'Notes',
        'test': 'Tests',
        'video': 'Videos'
    };
    return types[type] || 'Resources';
}

// Helper - Get resource type icon
function getResourceTypeIcon(type) {
    const icons = {
        'quiz': 'fa-question-circle',
        'flashcard': 'fa-layer-group',
        'note': 'fa-edit',
        'test': 'fa-clipboard-list',
        'video': 'fa-video'
    };
    return icons[type] || 'fa-file';
}

// Test quiz rendering with sample data (for debugging)
// Test quiz rendering with sample data (for debugging)
function testQuizRendering() {
    const sampleData = [
        {
            type: "quiz",
            content: {
                title: "Cloud Computing Basics",
                question: "What is Cloud Computing?",
                options: ["Physical servers you own", "On-demand services", "Weather system", "Local software"],
                answer: "On-demand services"
            }
        }
    ];
    
    const modalContent = document.getElementById('contentModal');
    if (modalContent) {
        modalContent.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'resource-content-page';
        
        const header = document.createElement('div');
        header.className = 'resource-header';
        header.innerHTML = '<h2>Test Quiz Rendering</h2>';
        container.appendChild(header);
        
        const contentArea = document.createElement('div');
        contentArea.className = 'resource-content-area';
        
        renderQuizContent(contentArea, sampleData);
        container.appendChild(contentArea);
        modalContent.appendChild(container);
        
        document.getElementById('contentModal').classList.remove('hidden');
    } else {
        alert("Content modal not found!");
    }
}

// Initialize the API integration
document.addEventListener('DOMContentLoaded', function() {
    // Make the functions globally available
    window.viewUniversityDetails = viewUniversityDetails;
    window.navigateToBreadcrumb = navigateToBreadcrumb;
    window.testQuizRendering = testQuizRendering;
    
    // Check if the universities section exists
    if (document.getElementById('universityGrid')) {
        // Replace the original loadUniversities function
        window.loadUniversities = loadUniversitiesFromAPI;
        
        // Call the new function to load universities
        loadUniversitiesFromAPI();
    }
});
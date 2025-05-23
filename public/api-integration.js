// ===============================================
// File: api-integration.js - Complete Implementation Fixed for Your DB Structure
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
    try {
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
                        <p>Unknown resource type: ${type}</p>
                    </div>
                `;
        }
    } catch (error) {
        console.error(`Error rendering ${type} content:`, error);
        contentArea.innerHTML = `
            <div class="error">
                <p>Error loading ${type} content. Please try again.</p>
                <p><small>Error: ${error.message}</small></p>
            </div>
        `;
    }
    
    container.appendChild(contentArea);
    modalContent.appendChild(container);
}

// Helper function - Render Quiz Content
function renderQuizContent(container, resources) {
    console.log("Quiz resources:", resources);
    
    const quizWrapper = document.createElement('div');
    quizWrapper.className = 'quiz-content';
    
    resources.forEach((element, elementIndex) => {
        console.log(`Processing quiz ${elementIndex}:`, element);
        
        const quizSection = document.createElement('div');
        quizSection.className = 'quiz-container';
        quizSection.id = `quiz-${elementIndex}`;
        
        const quizData = element.content;
        console.log("Quiz data:", quizData);
        
        const quizHeader = document.createElement('h3');
        quizHeader.textContent = quizData.title || `Quiz ${elementIndex + 1}`;
        quizHeader.className = 'quiz-title';
        quizSection.appendChild(quizHeader);

        const questionContainer = document.createElement('div');
        questionContainer.className = 'questions-container';
        
        if (quizData.question) {
            console.log("Single question format detected");
            const questionElem = createQuestionElement(quizData, 0);
            questionContainer.appendChild(questionElem);
        } else if (Array.isArray(quizData.questions)) {
            console.log(`Found ${quizData.questions.length} questions`);
            quizData.questions.forEach((question, qIndex) => {
                const questionElem = createQuestionElement(question, qIndex);
                questionContainer.appendChild(questionElem);
            });
        } else if (Array.isArray(quizData)) {
            console.log("Quiz data is array format - processing as questions array");
            quizData.forEach((question, qIndex) => {
                const questionElem = createQuestionElement(question, qIndex);
                questionContainer.appendChild(questionElem);
            });
        } else {
            console.log("Non-standard format detected, attempting to extract questions");
            if (quizData.options && quizData.answer) {
                const questionElem = createQuestionElement(quizData, 0);
                questionContainer.appendChild(questionElem);
            } else {
                questionContainer.innerHTML = '<p class="error">Could not parse quiz questions from the data structure.</p>';
                console.error("Unable to parse questions from:", quizData);
            }
        }
        
        const quizFooter = document.createElement('div');
        quizFooter.className = 'quiz-footer';
        
        let questionCount = 0;
        if (quizData.questions) {
            questionCount = quizData.questions.length;
        } else if (Array.isArray(quizData)) {
            questionCount = quizData.length;
        } else if (quizData.question) {
            questionCount = 1;
        } else if (quizData.options && quizData.answer) {
            questionCount = 1;
        }
        
        quizFooter.innerHTML = `
            <div class="quiz-progress">
                <span class="current-score">Score: <strong>0</strong>/${questionCount}</span>
            </div>
        `;
        
        quizSection.appendChild(questionContainer);
        quizSection.appendChild(quizFooter);
        quizWrapper.appendChild(quizSection);
    });
    
    container.appendChild(quizWrapper);
}

// Helper function - Create a question element
function createQuestionElement(question, index) {
    console.log(`Creating question element for index ${index}:`, question);
    
    const questionElem = document.createElement('div');
    questionElem.className = 'quiz-question';
    questionElem.dataset.questionIndex = index;
    
    const questionText = document.createElement('p');
    const questionContent = question.question || question.text || "Question not available";
    questionText.innerHTML = `<strong>Q${index + 1}:</strong> ${questionContent}`;
    questionElem.appendChild(questionText);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'quiz-options';
    
    if (Array.isArray(question.options)) {
        question.options.forEach((option, oIndex) => {
            const optionElem = document.createElement('div');
            optionElem.className = 'quiz-option';
            optionElem.textContent = option;
            
            let isCorrect = false;
            
            if (typeof question.correct === 'number') {
                isCorrect = oIndex === question.correct;
            } else if (question.answer !== undefined) {
                if (typeof question.answer === 'string') {
                    isCorrect = option === question.answer;
                } else if (typeof question.answer === 'number') {
                    isCorrect = oIndex === question.answer;
                }
            } else if (question.correctAnswer !== undefined) {
                isCorrect = option === question.correctAnswer;
            }
            
            console.log(`Option ${oIndex}: "${option}", Correct: ${isCorrect}`);
            optionElem.dataset.correct = isCorrect.toString();
            
            optionElem.addEventListener('click', function() {
                handleOptionSelection(this, questionElem);
            });
            
            optionsContainer.appendChild(optionElem);
        });
    } else {
        optionsContainer.innerHTML = '<p class="error">No options available for this question</p>';
        console.error("No options found for question:", question);
    }
    
    const feedbackElem = document.createElement('div');
    feedbackElem.className = 'quiz-feedback hidden';
    
    questionElem.appendChild(optionsContainer);
    questionElem.appendChild(feedbackElem);
    
    return questionElem;
}

// Helper function - Render Flashcard Content
function renderFlashcardContent(container, resources) {
    console.log("Flashcard resources:", resources);
    
    const flashcardWrapper = document.createElement('div');
    flashcardWrapper.className = 'flashcard-content';
    
    const instruction = document.createElement('div');
    instruction.className = 'flashcard-instruction';
    instruction.innerHTML = '<p><i class="fas fa-info-circle"></i> Click on a card to flip it and reveal the answer</p>';
    flashcardWrapper.appendChild(instruction);
    
    const flashcardGrid = document.createElement('div');
    flashcardGrid.className = 'flashcard-grid';
    
    resources.forEach((element, index) => {
        console.log(`Processing flashcard ${index}:`, element);
        
        let content = element.content;
        
        if (Array.isArray(content)) {
            content.forEach((card, cardIndex) => {
                const flashcard = createFlashcardElement(card, `${index}-${cardIndex}`);
                flashcardGrid.appendChild(flashcard);
            });
        } else {
            let front = 'Question';
            let back = 'Answer';
            
            if (content) {
                front = content.front || content.question || content.term || content.title || 'Question';
                back = content.back || content.answer || content.definition || content.content || 'Answer';
            }
            
            const flashcard = createFlashcardElement({ front, back }, index);
            flashcardGrid.appendChild(flashcard);
        }
    });
    
    flashcardWrapper.appendChild(flashcardGrid);
    container.appendChild(flashcardWrapper);
}

// Helper function to create individual flashcard element
function createFlashcardElement(cardData, index) {
    const flashcard = document.createElement('div');
    flashcard.className = 'flashcard';
    flashcard.onclick = function() { this.classList.toggle('flipped'); };
    
    flashcard.innerHTML = `
        <div class="flashcard-inner">
            <div class="flashcard-front">
                <i class="fas fa-question"></i>
                <p>${cardData.front || 'Question'}</p>
            </div>
            <div class="flashcard-back">
                <i class="fas fa-lightbulb"></i>
                <p>${cardData.back || 'Answer'}</p>
            </div>
        </div>
    `;
    
    return flashcard;
}

// Helper function - Render Note Content
function renderNoteContent(container, resources) {
    console.log("Note resources:", resources);
    
    const notesWrapper = document.createElement('div');
    notesWrapper.className = 'notes-content';
    
    resources.forEach((element, index) => {
        console.log(`Processing note ${index}:`, element);
        
        let content = element.content;
        
        if (Array.isArray(content)) {
            content.forEach((note, noteIndex) => {
                const noteElement = createNoteElement(note, `${index}-${noteIndex}`);
                notesWrapper.appendChild(noteElement);
            });
        } else {
            const noteElement = createNoteElement(content, index);
            notesWrapper.appendChild(noteElement);
        }
    });
    
    container.appendChild(notesWrapper);
}

// Helper function to create individual note element
function createNoteElement(noteData, index) {
    const noteElement = document.createElement('div');
    noteElement.className = 'note';

    let title = `Note ${parseInt(index) + 1}`;
    let content = '';

    if (noteData) {
        if (typeof noteData === 'string') {
            content = noteData;
        } else {
            title = noteData.title || noteData.name || noteData.subject || noteData.topic || `Note ${parseInt(index) + 1}`;
            content = noteData.content || noteData.text || noteData.body || noteData.description || noteData.explanation || '';
        }
    }

    noteElement.innerHTML = `
        <h3>${title}</h3>
        <div class="note-content">${content}</div>
    `;

    return noteElement;
}


// FIXED Helper function - Render Test Content (FOR YOUR DB STRUCTURE)
function renderTestContent(container, resources) {
    console.log("Test resources:", resources);
    
    const testsWrapper = document.createElement('div');
    testsWrapper.className = 'tests-content';
    
    // Add tests header and instructions
    const testsHeader = document.createElement('div');
    testsHeader.className = 'tests-header';
    testsHeader.innerHTML = `
        <div class="tests-instruction">
            <p><i class="fas fa-info-circle"></i> Click "Start Test" to begin. Tests will track your progress and provide results.</p>
        </div>
    `;
    testsWrapper.appendChild(testsHeader);
    
    // Create tests grid
    const testsGrid = document.createElement('div');
    testsGrid.className = 'tests-grid';
    
    resources.forEach((element, index) => {
        console.log(`Processing test ${index}:`, element);
        
        // Handle the DB structure where content is directly an array of questions
        let testData = {
            title: `Test ${index + 1}`,
            duration: 'No time limit',
            questions: []
        };
        
        // Check if content is an array (your DB structure)
        if (Array.isArray(element.content)) {
            testData.questions = element.content;
            testData.title = `Test ${index + 1} - ${element.content.length} Questions`;
        } else if (element.content && typeof element.content === 'object') {
            // Handle if it's already in the expected format
            testData = element.content;
        }
        
        const testElement = createTestElement(testData, index);
        testsGrid.appendChild(testElement);
    });
    
    testsWrapper.appendChild(testsGrid);
    container.appendChild(testsWrapper);
}

// FIXED Helper function to create test element for DB structure
function createTestElement(testData, index) {
    console.log(`Creating test element for index ${index}:`, testData);
    
    const testContainer = document.createElement('div');
    testContainer.className = 'test-container';
    testContainer.id = `test-${index}`;
    
    const questionCount = testData.questions ? testData.questions.length : 0;
    const totalMarks = testData.questions ? testData.questions.length : 0; // 1 mark per question
    
    // Create test info section
    const testInfo = document.createElement('div');
    testInfo.className = 'test-info';
    testInfo.innerHTML = `
        <h3><i class="fas fa-clipboard-list"></i> ${testData.title}</h3>
        <div class="test-details">
            <p><i class="fas fa-clock"></i> Duration: <strong>${testData.duration}</strong></p>
            <p><i class="fas fa-question-circle"></i> Questions: <strong>${questionCount}</strong></p>
            <p><i class="fas fa-star"></i> Total Marks: <strong>${totalMarks}</strong></p>
        </div>
    `;
    
    // Create test preview section
    const testPreview = document.createElement('div');
    testPreview.className = 'test-preview';
    
    if (testData.questions && testData.questions.length > 0) {
        testPreview.innerHTML = `
            <h4>Preview Questions:</h4>
            <div class="preview-questions">
                ${testData.questions.slice(0, 3).map((q, i) => `
                    <div class="test-question-preview">
                        <h5>Q${i + 1}:</h5>
                        <p>${q.question || 'Question content available in test'}</p>
                        <span class="marks-badge">Marks: 1</span>
                    </div>
                `).join('')}
                ${questionCount > 3 ? `
                    <div class="test-more">
                        <p><i class="fas fa-ellipsis-h"></i> + ${questionCount - 3} more questions</p>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Create test actions section
    const testActions = document.createElement('div');
    testActions.className = 'test-actions';
    testActions.innerHTML = `
        <button class="start-test-btn primary-btn" onclick="startTest('${index}', ${JSON.stringify(testData).replace(/"/g, '&quot;')})">
            <i class="fas fa-play"></i> Start Test
        </button>
    `;
    
    testContainer.appendChild(testInfo);
    testContainer.appendChild(testPreview);
    testContainer.appendChild(testActions);
    
    return testContainer;
}

// FIXED Helper function - Render Video Content (FOR YOUR DB STRUCTURE)
function renderVideoContent(container, resources) {
    console.log("Video resources:", resources);
    
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-content';
    
    // Add video header and instructions
    const videoHeader = document.createElement('div');
    videoHeader.className = 'video-header';
    videoHeader.innerHTML = `
        <div class="video-instruction">
            <p><i class="fas fa-info-circle"></i> Click on any video to start watching. Videos will open in a player below.</p>
        </div>
    `;
    videoWrapper.appendChild(videoHeader);
    
    // Create video grid
    const videoGrid = document.createElement('div');
    videoGrid.className = 'video-grid';
    
    resources.forEach((element, index) => {
        console.log(`Processing video ${index}:`, element);
        
        // Handle the DB structure where content is just a URL string
        let videoData = {};
        
        if (typeof element.content === 'string') {
            // This is your DB structure - content is just the URL
            videoData = {
                url: element.content,
                title: `Video ${index + 1}`,
                duration: 'Unknown'
            };
            
            // Try to extract video title from YouTube URL if possible
            if (element.content.includes('youtube.com') || element.content.includes('youtu.be')) {
                // You could potentially fetch video metadata here
                videoData.title = `YouTube Video ${index + 1}`;
            }
        } else if (element.content && typeof element.content === 'object') {
            // Handle if it's already in the expected format
            videoData = element.content;
        }
        
        const videoElement = createVideoElement(videoData, index);
        videoGrid.appendChild(videoElement);
    });
    
    videoWrapper.appendChild(videoGrid);
    container.appendChild(videoWrapper);
}

// FIXED Helper function to create video element for DB structure
function createVideoElement(videoData, index) {
    console.log(`Creating video element for index ${index}:`, videoData);
    
    const videoItem = document.createElement('div');
    videoItem.className = 'video-item';
    videoItem.id = `video-${index}`;
    
    const url = videoData.url || '';
    const title = videoData.title || `Video ${parseInt(index) + 1}`;
    const duration = videoData.duration || 'Unknown';
    
    // Create video thumbnail/info section
    const videoInfo = document.createElement('div');
    videoInfo.className = 'video-info';
    
    let thumbnailHtml = '';
    if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
        // Generate YouTube thumbnail
        const videoId = extractYouTubeVideoId(url);
        if (videoId) {
            thumbnailHtml = `<img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="${title}" class="video-thumbnail">`;
        } else {
            thumbnailHtml = `<div class="video-placeholder"><i class="fas fa-video"></i></div>`;
        }
    } else {
        thumbnailHtml = `<div class="video-placeholder"><i class="fas fa-video"></i></div>`;
    }
    
    videoInfo.innerHTML = `
        ${thumbnailHtml}
        <div class="video-details">
            <h3>${title}</h3>
            <p class="video-duration"><i class="fas fa-clock"></i> ${duration}</p>
            ${url ? `<p class="video-url-preview">${url}</p>` : ''}
        </div>
    `;
    
    // Create video player section (initially hidden)
    const videoPlayer = document.createElement('div');
    videoPlayer.className = 'video-player hidden';
    videoPlayer.id = `player-${index}`;
    
    // Create video actions
    const videoActions = document.createElement('div');
    videoActions.className = 'video-actions';
    
    if (url && url.trim() !== '') {
        videoActions.innerHTML = `
            <button class="play-video-btn primary-btn" onclick="playVideo('${index}', '${url.replace(/'/g, "\\'")}')">
                <i class="fas fa-play"></i> Play Video
            </button>
        `;
    } else {
        videoActions.innerHTML = `
            <button class="play-video-btn primary-btn" disabled>
                <i class="fas fa-exclamation-triangle"></i> No Video URL
            </button>
        `;
    }
    
    // Assemble video item
    videoItem.appendChild(videoInfo);
    videoItem.appendChild(videoPlayer);
    videoItem.appendChild(videoActions);
    
    return videoItem;
}

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url) {
    if (!url) return null;
    
    try {
        if (url.includes('youtu.be/')) {
            return url.split('youtu.be/')[1].split('?')[0].split('&')[0];
        } else if (url.includes('youtube.com/watch')) {
            const urlObj = new URL(url);
            return urlObj.searchParams.get('v');
        } else if (url.includes('youtube.com/embed/')) {
            return url.split('youtube.com/embed/')[1].split('?')[0].split('&')[0];
        }
    } catch (e) {
        console.error('Error extracting YouTube video ID:', e);
    }
    
    return null;
}

// FIXED Function to start a test (adapted for DB structure)
function startTest(testId, testData) {
    console.log(`Starting test: ${testId}`, testData);
    
    const modal = document.getElementById('contentModal');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal || !modalContent) {
        alert('Test interface not available');
        return;
    }
    
    // Create test interface
    modalContent.innerHTML = '';
    
    const testInterface = document.createElement('div');
    testInterface.className = 'test-interface';
    testInterface.id = `test-interface-${testId}`;
    
    testInterface.innerHTML = `
        <div class="test-header">
            <h2><i class="fas fa-clipboard-list"></i> ${testData.title}</h2>
            <div class="test-timer">
                <span id="timer-${testId}">Time: ${testData.duration}</span>
            </div>
        </div>
        <div class="test-content" id="test-content-${testId}">
            <div class="test-loading">
                <p><i class="fas fa-spinner fa-spin"></i> Loading test questions...</p>
            </div>
        </div>
        <div class="test-navigation">
            <button class="test-btn secondary-btn" onclick="exitTest('${testId}')">
                <i class="fas fa-times"></i> Exit Test
            </button>
            <button class="test-btn primary-btn" onclick="submitTest('${testId}', ${JSON.stringify(testData.questions).replace(/"/g, '&quot;')})" id="submit-btn-${testId}" style="display:none;">
                <i class="fas fa-check"></i> Submit Test
            </button>
        </div>
    `;
    
    modalContent.appendChild(testInterface);
    modal.classList.remove('hidden');
    
    // Load test questions
    setTimeout(() => {
        loadTestQuestions(testId, testData.questions);
    }, 1000);
}

// FIXED Function to load test questions
function loadTestQuestions(testId, questions) {
    const testContent = document.getElementById(`test-content-${testId}`);
    const submitBtn = document.getElementById(`submit-btn-${testId}`);
    
    if (!testContent) return;
    
    if (!questions || questions.length === 0) {
        testContent.innerHTML = `
            <div class="no-questions">
                <p><i class="fas fa-exclamation-triangle"></i> No questions available for this test.</p>
            </div>
        `;
        return;
    }
    
    let questionsHtml = '<div class="test-questions">';
    
    questions.forEach((question, index) => {
        questionsHtml += `
            <div class="test-question" id="question-${testId}-${index}">
                <h3>Question ${index + 1} <span class="question-marks">(1 mark)</span></h3>
                <p class="question-text">${question.question || 'Question text not available'}</p>
                
                ${question.options ? `
                    <div class="question-options">
                        ${question.options.map((option, optIndex) => `
                            <label class="option-label">
                                <input type="radio" name="question-${testId}-${index}" value="${option}" data-correct="${option === question.answer}">
                                <span>${option}</span>
                            </label>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-answer">
                        <textarea placeholder="Type your answer here..." 
                                  id="answer-${testId}-${index}" 
                                  rows="4"></textarea>
                    </div>
                `}
            </div>
        `;
    });
    
    questionsHtml += '</div>';
    
    testContent.innerHTML = questionsHtml;
    
    if (submitBtn) {
        submitBtn.style.display = 'inline-block';
    }
}

// Function to play a video
function playVideo(videoId, videoUrl) {
    console.log(`Playing video ${videoId}:`, videoUrl);
    
    const videoPlayer = document.getElementById(`player-${videoId}`);
    
    if (!videoPlayer) {
        alert('Video player not available');
        return;
    }
    
    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
        alert('Video URL not available');
        return;
    }
    
    let playerHtml = '';
    
    try {
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const videoIdYt = extractYouTubeVideoId(videoUrl);
            if (videoIdYt) {
                playerHtml = `
                    <iframe src="https://www.youtube.com/embed/${videoIdYt}?autoplay=1" 
                            frameborder="0" 
                            allowfullscreen
                            allow="autoplay; encrypted-media">
                    </iframe>
                `;
            } else {
                throw new Error('Invalid YouTube URL');
            }
        } else if (videoUrl.includes('vimeo.com')) {
            const vimeoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0];
            if (vimeoId) {
                playerHtml = `
                    <iframe src="https://player.vimeo.com/video/${vimeoId}?autoplay=1" 
                            frameborder="0" 
                            allowfullscreen>
                    </iframe>
                `;
            } else {
                throw new Error('Invalid Vimeo URL');
            }
        } else if (videoUrl.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
            playerHtml = `
                <video controls autoplay>
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        } else {
            playerHtml = `
                <iframe src="${videoUrl}" 
                        frameborder="0" 
                        allowfullscreen>
                </iframe>
            `;
        }
        
        videoPlayer.innerHTML = playerHtml;
        videoPlayer.classList.remove('hidden');
        
        // Scroll to video player
        videoPlayer.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error playing video:', error);
        alert(`Error playing video: ${error.message}`);
    }
}

// FIXED Function to submit test
function submitTest(testId, questions) {
    if (!confirm('Are you sure you want to submit the test? You cannot change answers after submission.')) {
        return;
    }
    
    let score = 0;
    let results = [];
    
    questions.forEach((question, index) => {
        const selectedInput = document.querySelector(`input[name="question-${testId}-${index}"]:checked`);
        
        if (selectedInput) {
            const isCorrect = selectedInput.dataset.correct === 'true';
            if (isCorrect) score++;
            
            results.push({
                question: question.question,
                selected: selectedInput.value,
                correct: question.answer,
                isCorrect: isCorrect
            });
        }
    });
    
    const percentage = Math.round((score / questions.length) * 100);
    
    // Show results
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="test-results">
            <h2><i class="fas fa-check-circle"></i> Test Completed!</h2>
            <div class="score-display">
                <h3>Your Score: ${score}/${questions.length}</h3>
                <p class="percentage">${percentage}%</p>
            </div>
            <div class="results-details">
                ${results.map((r, i) => `
                    <div class="result-item ${r.isCorrect ? 'correct' : 'incorrect'}">
                        <h4>Q${i + 1}: ${r.question}</h4>
                        <p>Your answer: <strong>${r.selected || 'Not answered'}</strong></p>
                        ${!r.isCorrect ? `<p>Correct answer: <strong>${r.correct}</strong></p>` : ''}
                    </div>
                `).join('')}
            </div>
            <button class="test-btn primary-btn" onclick="closeModal()">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
}

// Additional helper functions
function exitTest(testId) {
    if (confirm('Are you sure you want to exit the test? Your progress will be lost.')) {
        closeModal();
    }
}

// Function to handle option selection in quizzes
function handleOptionSelection(optionElement, questionElement) {
    const options = questionElement.querySelectorAll('.quiz-option');
    
    if (questionElement.querySelector('.quiz-option.selected')) {
        return;
    }
    
    optionElement.classList.add('selected');
    
    const feedbackElem = questionElement.querySelector('.quiz-feedback');
    const isCorrect = optionElement.dataset.correct === 'true';
    
    if (isCorrect) {
        feedbackElem.innerHTML = '<p class="correct-feedback"><i class="fas fa-check-circle"></i> Correct! Well done.</p>';
        feedbackElem.classList.add('correct');
        
        const quizContainer = questionElement.closest('.quiz-container');
        const scoreElement = quizContainer.querySelector('.current-score strong');
        if (scoreElement) {
            const currentScore = parseInt(scoreElement.textContent) || 0;
            scoreElement.textContent = currentScore + 1;
        }
        
        optionElement.classList.add('correct');
    } else {
        feedbackElem.innerHTML = '<p class="incorrect-feedback"><i class="fas fa-times-circle"></i> Incorrect. Try again!</p>';
        feedbackElem.classList.add('incorrect');
        
        optionElement.classList.add('incorrect');
        
        options.forEach(opt => {
            if (opt.dataset.correct === 'true') {
                setTimeout(() => {
                    opt.classList.add('correct-answer');
                }, 1000);
            }
        });
    }
    
    feedbackElem.classList.remove('hidden');
}

// Helper function - Render breadcrumbs based on navigation state
function renderBreadcrumbs() {
    let breadcrumbsHTML = '';
    
    navigationState.breadcrumbs.forEach((crumb, index) => {
        if (index === navigationState.breadcrumbs.length - 1) {
            breadcrumbsHTML += `<span class="current">${crumb.name}</span>`;
        } else {
            breadcrumbsHTML += `<a href="#" onclick="event.preventDefault(); navigateToBreadcrumb(${index})">${crumb.name}</a>`;
            
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

// Helper function to close modal
function closeModal() {
    const modal = document.getElementById('contentModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Initialize the API integration
document.addEventListener('DOMContentLoaded', function() {
    // Make the functions globally available
    window.viewUniversityDetails = viewUniversityDetails;
    window.navigateToBreadcrumb = navigateToBreadcrumb;
    window.closeModal = closeModal;
    window.startTest = startTest;
    window.exitTest = exitTest;
    window.submitTest = submitTest;
    window.playVideo = playVideo;
    
    // Check if the universities section exists
    if (document.getElementById('universityGrid')) {
        window.loadUniversities = loadUniversitiesFromAPI;
        loadUniversitiesFromAPI();
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (navigationState.breadcrumbs.length > 0) {
                const lastCrumb = navigationState.breadcrumbs[navigationState.breadcrumbs.length - 1];
                if (lastCrumb.action) {
                    lastCrumb.action();
                }
            }
        }
    });
    
    // Add click handler to close modal when clicking outside
    const modal = document.getElementById('contentModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    console.log('API Integration initialized successfully - Fixed for DB structure');
});
  document.addEventListener('DOMContentLoaded', function() {
            // DOM References
            const contestForm = document.getElementById('contest-form');
            const postUrlInput = document.getElementById('post-url');
            const titleInput = document.getElementById('title');
            const descriptionInput = document.getElementById('description');
            const deadlineInput = document.getElementById('deadline');
            const prizesContainer = document.getElementById('prizes-container');
            const addPrizeBtn = document.getElementById('add-prize');
            const contestGrid = document.getElementById('contest-grid');
            const sortSelect = document.getElementById('sort-select');
            const imageUpload = document.getElementById('image-upload');
            const imagePreview = document.getElementById('image-preview');
            const themeToggle = document.getElementById('theme-toggle');
            const addContestBtn = document.getElementById('add-contest-btn');
            const clearAllBtn = document.getElementById('clear-all-btn');
            const modal = document.getElementById('add-modal');
            const closeModal = document.querySelector('.close-modal');
            const prizeRadios = document.querySelectorAll('input[name="prize-type"]');
            
            // Variables
            let uploadedImage = null;
            let currentSort = 'deadline';
            let contests = JSON.parse(localStorage.getItem('artContests')) || [];
            sortContests('deadline');
            
            // Default to dark mode if not set
            if (localStorage.getItem('darkMode') === null) {
                localStorage.setItem('darkMode', 'true');
            }
            const darkMode = localStorage.getItem('darkMode') === 'true';
            if (darkMode) {
                document.body.classList.add('dark-mode');
                themeToggle.checked = true;
            }
            
            // Initialize
            renderContests();
            setMinDate();
            initImageUpload();
            handlePrizeTypeChange(); // Initial setup for prizes
            
            // Event Listeners
            contestForm.addEventListener('submit', handleFormSubmit);
            addPrizeBtn.addEventListener('click', addPrizeField);
            sortSelect.addEventListener('change', handleSort);
            themeToggle.addEventListener('change', toggleTheme);
            addContestBtn.addEventListener('click', () => modal.style.display = 'block');
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete all contests? This action cannot be undone.')) {
                    contests = [];
                    saveContests();
                    renderContests();
                }
            });
            closeModal.addEventListener('click', closeModalFunc);
            window.addEventListener('click', (e) => { if (e.target === modal) closeModalFunc(); });
            prizeRadios.forEach(radio => radio.addEventListener('change', handlePrizeTypeChange));
            
            function toggleTheme() {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
            }
            
            function closeModalFunc() {
                modal.style.display = 'none';
                contestForm.reset();
                uploadedImage = null;
                imagePreview.innerHTML = `
                    <span>
                        <i class="upload-icon fas fa-cloud-upload-alt"></i>
                        <p>Click to upload or drag and drop</p>
                        <p class="drag-feedback">Drop the image!</p>
                    </span>
                `;
                handlePrizeTypeChange();
            }
            
            function initImageUpload() {
                imagePreview.addEventListener('click', () => imageUpload.click());
                imageUpload.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) handleImageUpload(file);
                });

                imagePreview.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    imagePreview.classList.add('dragover');
                });
                imagePreview.addEventListener('dragleave', () => imagePreview.classList.remove('dragover'));
                imagePreview.addEventListener('drop', (e) => {
                    e.preventDefault();
                    imagePreview.classList.remove('dragover');
                    const file = e.dataTransfer.files[0];
                    if (file) handleImageUpload(file);
                });
            }
            
            function handleImageUpload(file) {
                if (!file || !file.type.match('image.*')) {
                    alert('Please select a valid image file');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedImage = event.target.result;
                    imagePreview.innerHTML = `<img src="${uploadedImage}" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            }
            
            function setMinDate() {
                const now = new Date();
                const tomorrow = new Date(now.getTime() + 86400000);
                const year = tomorrow.getFullYear();
                const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
                const day = String(tomorrow.getDate()).padStart(2, '0');
                deadlineInput.min = `${year}-${month}-${day}`;
            }
            
            function addPrizeField() {
                const prizeEntry = document.createElement('div');
                prizeEntry.className = 'prize-entry';
                prizeEntry.innerHTML = `
                    <input type="text" class="prize-place" placeholder="e.g., 1st Place">
                    <input type="number" class="prize-amount" placeholder="Amount (USD)" min="0" step="any">
                `;
                prizesContainer.appendChild(prizeEntry);
            }
            
            function handlePrizeTypeChange() {
                const type = document.querySelector('input[name="prize-type"]:checked').value;
                prizesContainer.innerHTML = '';
                if (type === 'individual') {
                    addPrizeField();
                    addPrizeBtn.style.display = 'block';
                } else {
                    const prizeEntry = document.createElement('div');
                    prizeEntry.className = 'prize-entry';
                    prizeEntry.innerHTML = `
                        <input type="text" class="prize-place" value="Prize Pool" readonly>
                        <input type="number" class="prize-amount" placeholder="Total Amount (USD)" min="0" step="any">
                    `;
                    prizesContainer.appendChild(prizeEntry);
                    addPrizeBtn.style.display = 'none';
                }
            }
            
            function getMaxPrize(contest) {
                if (!contest.prizes || contest.prizes.length === 0) return 0;
                return Math.max(...contest.prizes.map(p => p.amount));
            }
            
            function sortContests(sortBy) {
                currentSort = sortBy;
                if (sortBy === 'deadline') {
                    contests.sort((a, b) => a.deadline - b.deadline);
                } else if (sortBy === 'title') {
                    contests.sort((a, b) => a.title.localeCompare(b.title));
                } else if (sortBy === 'prize') {
                    contests.sort((a, b) => getMaxPrize(b) - getMaxPrize(a));
                }
            }
            
            function handleFormSubmit(e) {
                e.preventDefault();
                const url = postUrlInput.value.trim();
                if (!isValidTwitterUrl(url)) {
                    alert('Please enter a valid X/Twitter URL');
                    return;
                }
                if (!uploadedImage) {
                    alert('Please upload a thumbnail image');
                    return;
                }
                const prizes = [];
                const prizeEntries = prizesContainer.querySelectorAll('.prize-entry');
                prizeEntries.forEach(entry => {
                    const place = entry.querySelector('.prize-place').value.trim();
                    const amountStr = entry.querySelector('.prize-amount').value.trim();
                    if (place && amountStr) {
                        const amount = parseFloat(amountStr);
                        if (!isNaN(amount)) {
                            prizes.push({ place, amount });
                        }
                    }
                });
                
                // Set deadline to end of day
                const deadlineDate = new Date(deadlineInput.value + 'T00:00:00');
                deadlineDate.setHours(23, 59, 59, 999);
                
                const contest = {
                    id: Date.now(),
                    url,
                    title: titleInput.value.trim(),
                    description: descriptionInput.value.trim(),
                    deadline: deadlineDate.getTime(),
                    prizes,
                    image: uploadedImage
                };
                contests.push(contest);
                sortContests(currentSort);
                saveContests();
                renderContests();
                closeModalFunc();
            }
            
            function isValidTwitterUrl(url) {
                const pattern = /^https?:\/\/(twitter\.com|x\.com)\/.+\/status\/\d+/;
                return pattern.test(url);
            }
            
            function saveContests() {
                localStorage.setItem('artContests', JSON.stringify(contests));
            }
            
            function renderContests() {
                contestGrid.innerHTML = '';
                if (contests.length === 0) {
                    contestGrid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <h3>No contests tracked yet</h3>
                            <p>Add some contests to get started</p>
                        </div>
                    `;
                    return;
                }
                contests.forEach(contest => {
                    const card = createContestCard(contest);
                    contestGrid.appendChild(card);
                });
            }
            
            function createContestCard(contest) {
                const now = Date.now();
                const timeLeft = contest.deadline - now;
                
                let timeLeftText = '';
                let timeLeftClass = '';
                let hoursLeftText = '';
                let hoursLeftClass = '';
                
                if (timeLeft < 0) {
                    timeLeftText = 'Ended';
                    timeLeftClass = 'countdown-ended';
                } else {
                    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const totalHours = (days * 24) + hours;
                    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    
                    if (days === 0) {
                        if (hours > 0) {
                            timeLeftText = `Ends in ${hours}h`;
                            hoursLeftText = `${hours} hour${hours !== 1 ? 's' : ''} left`;
                        } else {
                            timeLeftText = 'Ends soon';
                            hoursLeftText = `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
                        }
                        timeLeftClass = 'countdown-soon';
                        hoursLeftClass = 'soon';
                    } else if (days < 3) {
                        timeLeftText = `Ends in ${days}d`;
                        timeLeftClass = 'countdown-soon';
                        hoursLeftText = `${totalHours} total hour${totalHours !== 1 ? 's' : ''} left`;
                    } else if (days < 7) {
                        timeLeftText = `Ends in ${days}d`;
                        timeLeftClass = 'countdown-normal';
                    } else {
                        timeLeftText = `Ends in ${days}d`;
                        timeLeftClass = 'countdown-far';
                    }
                }
                
                const deadlineDate = new Date(contest.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                
                let prizesText = '';
                if (contest.prizes.length > 0) {
                    if (contest.prizes[0].place === 'Prize Pool') {
                        prizesText = `$${contest.prizes[0].amount} prize pool`;
                    } else {
                        prizesText = contest.prizes.map(p => `$${p.amount}`).join(', ');
                    }
                }
                
                const card = document.createElement('div');
                card.className = 'contest-card';
                card.innerHTML = `
                    <div class="card-description">${contest.description ? contest.description.split('\n').join('<br>') : ''}</div>
                    <div class="card-image">
                        <img src="${contest.image}" alt="${contest.title}">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${contest.title}</h3>
                        <div class="deadline-container">
                            <div class="card-deadline">
                                <i class="fas fa-calendar-alt"></i> ${deadlineDate}
                            </div>
                            <span class="countdown ${timeLeftClass}">${timeLeftText}</span>
                        </div>
                        ${hoursLeftText ? `<div class="hours-left ${hoursLeftClass}"><i class="fas fa-clock"></i> ${hoursLeftText}</div>` : ''}
                        <div class="card-prizes"><i class="fas fa-trophy"></i> ${prizesText}</div>
                        <div class="card-actions">
                            <a href="${contest.url}" target="_blank" class="card-link">
                                <i class="fas fa-external-link-alt"></i> View Contest
                            </a>
                            <button class="delete-btn" data-id="${contest.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                card.querySelector('.delete-btn').addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this contest?')) {
                        contests = contests.filter(c => c.id !== contest.id);
                        saveContests();
                        renderContests();
                    }
                });
                
                return card;
            }
            
            function handleSort() {
                sortContests(sortSelect.value);
                renderContests();
            }
        });

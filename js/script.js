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
            const filterHighlightedBtn = document.getElementById('filter-highlighted-btn');

            // Edit Modal DOM References
            const editModal = document.getElementById('edit-modal');
            const editContestForm = document.getElementById('edit-contest-form');
            const editContestIdInput = document.getElementById('edit-contest-id');
            const editPostUrlInput = document.getElementById('edit-post-url');
            const editTitleInput = document.getElementById('edit-title');
            const editDescriptionInput = document.getElementById('edit-description');
            const editDeadlineInput = document.getElementById('edit-deadline');
            const editPrizesContainer = document.getElementById('edit-prizes-container');
            const editAddPrizeBtn = document.getElementById('edit-add-prize');
            const editImageUpload = document.getElementById('edit-image-upload');
            const editImagePreview = document.getElementById('edit-image-preview');
            const editPrizeRadios = document.querySelectorAll('input[name="edit-prize-type"]');
            const editCloseModal = editModal.querySelector('.close-modal');
            
            // Variables
            let uploadedImage = null;
            let editUploadedImage = null;
            let currentSort = 'deadline';
            let contests = JSON.parse(localStorage.getItem('artContests')) || [];
            let highlightedContests = JSON.parse(localStorage.getItem('highlightedContests')) || [];
            let showHighlighted = false;
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
            initEditImageUpload();
            handlePrizeTypeChange(); // Initial setup for prizes
            
            // Event Listeners
            contestForm.addEventListener('submit', handleFormSubmit);
            editContestForm.addEventListener('submit', handleEditFormSubmit);
            addPrizeBtn.addEventListener('click', addPrizeField);
            editAddPrizeBtn.addEventListener('click', addEditPrizeField);
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
            editCloseModal.addEventListener('click', closeEditModalFunc);
            window.addEventListener('click', (e) => { 
                if (e.target === modal) closeModalFunc();
                if (e.target === editModal) closeEditModalFunc();
            });
            prizeRadios.forEach(radio => radio.addEventListener('change', handlePrizeTypeChange));
            editPrizeRadios.forEach(radio => radio.addEventListener('change', handleEditPrizeTypeChange));
            filterHighlightedBtn.addEventListener('click', toggleFilterHighlighted);

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

            function closeEditModalFunc() {
                editModal.style.display = 'none';
                editContestForm.reset();
                editUploadedImage = null;
                editImagePreview.innerHTML = `
                    <span>
                        <i class="upload-icon fas fa-cloud-upload-alt"></i>
                        <p>Click to upload or drag and drop</p>
                        <p class="drag-feedback">Drop the image!</p>
                    </span>
                `;
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

            function initEditImageUpload() {
                editImagePreview.addEventListener('click', () => editImageUpload.click());
                editImageUpload.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) handleEditImageUpload(file);
                });

                editImagePreview.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    editImagePreview.classList.add('dragover');
                });
                editImagePreview.addEventListener('dragleave', () => editImagePreview.classList.remove('dragover'));
                imagePreview.addEventListener('drop', (e) => {
                    e.preventDefault();
                    editImagePreview.classList.remove('dragover');
                    const file = e.dataTransfer.files[0];
                    if (file) handleEditImageUpload(file);
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

            function handleEditImageUpload(file) {
                if (!file || !file.type.match('image.*')) {
                    alert('Please select a valid image file');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    editUploadedImage = event.target.result;
                    editImagePreview.innerHTML = `<img src="${editUploadedImage}" alt="Preview">`;
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
                editDeadlineInput.min = `${year}-${month}-${day}`;
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

            function addEditPrizeField(place = '', amount = '') {
                const prizeEntry = document.createElement('div');
                prizeEntry.className = 'prize-entry';
                prizeEntry.innerHTML = `
                    <input type="text" class="prize-place" placeholder="e.g., 1st Place" value="${place}">
                    <input type="number" class="prize-amount" placeholder="Amount (USD)" min="0" step="any" value="${amount}">
                `;
                editPrizesContainer.appendChild(prizeEntry);
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

            function handleEditPrizeTypeChange() {
                const type = document.querySelector('input[name="edit-prize-type"]:checked').value;
                editPrizesContainer.innerHTML = '';
                if (type === 'individual') {
                    addEditPrizeField();
                    editAddPrizeBtn.style.display = 'block';
                } else {
                    const prizeEntry = document.createElement('div');
                    prizeEntry.className = 'prize-entry';
                    prizeEntry.innerHTML = `
                        <input type="text" class="prize-place" value="Prize Pool" readonly>
                        <input type="number" class="prize-amount" placeholder="Total Amount (USD)" min="0" step="any">
                    `;
                    editPrizesContainer.appendChild(prizeEntry);
                    editAddPrizeBtn.style.display = 'none';
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

            function handleEditFormSubmit(e) {
                e.preventDefault();
                const contestId = parseInt(editContestIdInput.value);
                const url = editPostUrlInput.value.trim();
                if (!isValidTwitterUrl(url)) {
                    alert('Please enter a valid X/Twitter URL');
                    return;
                }
                
                const prizes = [];
                const prizeEntries = editPrizesContainer.querySelectorAll('.prize-entry');
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

                const deadlineDate = new Date(editDeadlineInput.value + 'T00:00:00');
                deadlineDate.setHours(23, 59, 59, 999);

                const contestIndex = contests.findIndex(c => c.id === contestId);
                if (contestIndex > -1) {
                    contests[contestIndex] = {
                        ...contests[contestIndex],
                        url,
                        title: editTitleInput.value.trim(),
                        description: editDescriptionInput.value.trim(),
                        deadline: deadlineDate.getTime(),
                        prizes,
                        image: editUploadedImage || contests[contestIndex].image
                    };
                }
                
                sortContests(currentSort);
                saveContests();
                renderContests();
                closeEditModalFunc();
            }
            
            function isValidTwitterUrl(url) {
                const pattern = /^https?:\/\/(twitter\.com|x\.com)\/.+\/status\/\d+/;
                return pattern.test(url);
            }
            
            function saveContests() {
                localStorage.setItem('artContests', JSON.stringify(contests));
            }

            function saveHighlightedContests() {
                localStorage.setItem('highlightedContests', JSON.stringify(highlightedContests));
            }
            
            function renderContests() {
                contestGrid.innerHTML = '';
                const contestsToRender = showHighlighted ? contests.filter(c => highlightedContests.includes(c.id)) : contests;

                if (contestsToRender.length === 0) {
                    contestGrid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <h3>No contests to display</h3>
                            <p>${showHighlighted ? 'No highlighted contests found.' : 'Add some contests to get started'}</p>
                        </div>
                    `;
                    return;
                }
                contestsToRender.forEach(contest => {
                    const card = createContestCard(contest);
                    contestGrid.appendChild(card);
                });
            }

            function openEditModal(id) {
                const contest = contests.find(c => c.id === id);
                if (!contest) return;

                editContestIdInput.value = contest.id;
                editPostUrlInput.value = contest.url;
                editTitleInput.value = contest.title;
                editDescriptionInput.value = contest.description;
                
                const deadline = new Date(contest.deadline);
                const year = deadline.getFullYear();
                const month = String(deadline.getMonth() + 1).padStart(2, '0');
                const day = String(deadline.getDate()).padStart(2, '0');
                editDeadlineInput.value = `${year}-${month}-${day}`;

                editImagePreview.innerHTML = `<img src="${contest.image}" alt="Preview">`;
                editUploadedImage = contest.image;

                editPrizesContainer.innerHTML = '';
                const prizeType = contest.prizes.length > 1 || (contest.prizes.length === 1 && contest.prizes[0].place !== 'Prize Pool') ? 'individual' : 'pool';
                document.querySelector(`input[name="edit-prize-type"][value="${prizeType}"]`).checked = true;
                
                if (prizeType === 'individual') {
                    contest.prizes.forEach(p => addEditPrizeField(p.place, p.amount));
                    editAddPrizeBtn.style.display = 'block';
                } else {
                    const prize = contest.prizes[0] || { amount: '' };
                    editPrizesContainer.innerHTML = `
                        <div class="prize-entry">
                            <input type="text" class="prize-place" value="Prize Pool" readonly>
                            <input type="number" class="prize-amount" placeholder="Total Amount (USD)" min="0" step="any" value="${prize.amount}">
                        </div>
                    `;
                    editAddPrizeBtn.style.display = 'none';
                }

                editModal.style.display = 'block';
            }
            
            function createContestCard(contest) {
                const now = Date.now();
                const timeLeft = contest.deadline - now;
                const isHighlighted = highlightedContests.includes(contest.id);
                
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
                card.className = `contest-card ${isHighlighted ? 'highlighted' : ''}`;
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
                            <button class="highlight-btn ${isHighlighted ? 'highlighted' : ''}" data-id="${contest.id}">
                                <i class="${isHighlighted ? 'fas' : 'far'} fa-star"></i>
                            </button>
                            <button class="edit-btn" data-id="${contest.id}">
                                <i class="fas fa-edit"></i>
                            </button>
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

                card.querySelector('.edit-btn').addEventListener('click', () => {
                    openEditModal(contest.id);
                });

                card.querySelector('.highlight-btn').addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    toggleHighlight(id);
                });
                
                return card;
            }

            function toggleHighlight(id) {
                const index = highlightedContests.indexOf(id);
                if (index > -1) {
                    highlightedContests.splice(index, 1);
                } else {
                    highlightedContests.push(id);
                }
                saveHighlightedContests();
                renderContests();
            }

            function toggleFilterHighlighted() {
                showHighlighted = !showHighlighted;
                filterHighlightedBtn.classList.toggle('active');
                const btnText = filterHighlightedBtn.querySelector('.btn-text');
                if (showHighlighted) {
                    btnText.textContent = 'Show All';
                } else {
                    btnText.textContent = 'Show Highlighted';
                }
                renderContests();
            }
            
            function handleSort() {
                sortContests(sortSelect.value);
                renderContests();
            }
        });
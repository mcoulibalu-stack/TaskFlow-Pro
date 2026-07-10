// ============================================================
// TASKFLOW PRO - APPLICATION JS COMPLÈTE
// Version SIMPLIFIÉE - TOUTES LES SECTIONS FONCTIONNENT
// ============================================================

// === ÉTAT ===
let tasks = [];
let editingId = null;
let toastTimeout = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let weeklyChart = null;

// ============================================================
// CHARGEMENT ET SAUVEGARDE
// ============================================================
function loadFromStorage() {
    const stored = localStorage.getItem('taskflow_tasks');
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch {
            tasks = getDefaultTasks();
        }
    } else {
        tasks = getDefaultTasks();
    }
}

function getDefaultTasks() {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + 7);
    const past = new Date(now);
    past.setDate(past.getDate() - 2);
    
    return [
        {
            id: Date.now() + 1,
            title: 'Préparer la présentation',
            description: 'Finaliser les slides pour la réunion',
            priority: 'haute',
            category: 'professionnel',
            dueDate: future.toISOString().split('T')[0],
            status: 'en cours',
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            title: 'Réviser le code du projet',
            description: 'Optimiser les performances',
            priority: 'moyenne',
            category: 'professionnel',
            dueDate: future.toISOString().split('T')[0],
            status: 'en cours',
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            title: 'Faire les courses',
            description: 'Acheter les ingrédients',
            priority: 'basse',
            category: 'personnel',
            dueDate: past.toISOString().split('T')[0],
            status: 'terminée',
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 4,
            title: 'Étudier pour l\'examen',
            description: 'Réviser les chapitres 1 à 5',
            priority: 'haute',
            category: 'etude',
            dueDate: future.toISOString().split('T')[0],
            status: 'en cours',
            createdAt: new Date().toISOString()
        }
    ];
}

function saveToStorage() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 10000);
}

// ============================================================
// RENDU DES TÂCHES (SECTION TÂCHES)
// ============================================================
function renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;
    
    const search = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
    const status = document.getElementById('filter-status')?.value || 'all';
    const priority = document.getElementById('filter-priority')?.value || 'all';
    const category = document.getElementById('filter-category')?.value || 'all';

    let filtered = tasks.filter(task => {
        const matchSearch = task.title.toLowerCase().includes(search) ||
            (task.description && task.description.toLowerCase().includes(search));
        const matchStatus = status === 'all' || task.status === status;
        const matchPriority = priority === 'all' || task.priority === priority;
        const matchCategory = category === 'all' || task.category === category;
        return matchSearch && matchStatus && matchPriority && matchCategory;
    });

    filtered.sort((a, b) => {
        const order = { haute: 0, moyenne: 1, basse: 2 };
        if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return b.id - a.id;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-msg">
                <i class="fas fa-inbox"></i>
                Aucune tâche trouvée
                <span>Créez votre première tâche !</span>
            </div>
        `;
    } else {
        container.innerHTML = filtered.map((task, index) => createTaskHTML(task, index)).join('');
    }

    updateStats();
    updateCounter(filtered.length);
    updateDashboard();
    updateCalendar();
    updateReports();
    updateProjects();
    updateTeam();
}

function createTaskHTML(task, index) {
    const isDone = task.status === 'terminée';
    const isLate = !isDone && task.dueDate && new Date(task.dueDate) < new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : 'Aucune';
    const categoryEmoji = { professionnel: '💼', personnel: '👤', etude: '📚', urgent: '⚡', autre: '📌' };
    const priorityClass = `priority-${task.priority}`;
    
    return `
        <div class="task-item ${isDone ? 'done' : ''} ${isLate ? 'late' : ''}" data-id="${task.id}">
            <div class="task-info">
                <div class="task-title">${escapeHTML(task.title)}</div>
                ${task.description ? `<div class="task-desc">${escapeHTML(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="${priorityClass}">${task.priority}</span>
                    <span>${categoryEmoji[task.category] || '📌'} ${task.category}</span>
                    <span>📅 ${dueDate}</span>
                    <span>${isLate ? '⚠️ En retard' : (isDone ? '✅ Terminée' : '⏳ En cours')}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-success toggle-btn" data-id="${task.id}">
                    <i class="fas ${isDone ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button class="btn btn-warning edit-btn" data-id="${task.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-btn" data-id="${task.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function updateCounter(count) {
    const el = document.getElementById('task-counter');
    if (el) el.innerHTML = `<i class="fas fa-tasks"></i> ${count} tâche${count > 1 ? 's' : ''}`;
}

// ============================================================
// STATISTIQUES (DASHBOARD)
// ============================================================
function updateStats() {
    const total = tasks.length;
    const enCours = tasks.filter(t => t.status === 'en cours').length;
    const terminees = tasks.filter(t => t.status === 'terminée').length;
    const now = new Date();
    const enRetard = tasks.filter(t => t.status !== 'terminée' && t.dueDate && new Date(t.dueDate) < now).length;
    const progress = total > 0 ? Math.round((terminees / total) * 100) : 0;

    const statTotal = document.getElementById('stat-total')?.querySelector('.stat-number');
    const statInProgress = document.getElementById('stat-in-progress')?.querySelector('.stat-number');
    const statDone = document.getElementById('stat-done')?.querySelector('.stat-number');
    const statLate = document.getElementById('stat-late')?.querySelector('.stat-number');

    if (statTotal) statTotal.textContent = total;
    if (statInProgress) statInProgress.textContent = enCours;
    if (statDone) statDone.textContent = progress + '%';
    if (statLate) statLate.textContent = enRetard;
}

// ============================================================
// DASHBOARD
// ============================================================
function updateDashboard() {
    updateTodayTasks();
    updateWeeklyChart();
    updateDate();
}

function updateDate() {
    const el = document.getElementById('currentDate');
    if (el) {
        const now = new Date();
        el.textContent = now.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }
}

function updateTodayTasks() {
    const container = document.getElementById('todayTasks');
    if (!container) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(task => {
        if (!task.dueDate || task.status === 'terminée') return false;
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
    });
    
    const count = document.getElementById('todayCount');
    if (count) count.textContent = todayTasks.length + ' tâches';
    
    if (todayTasks.length === 0) {
        container.innerHTML = '<p class="empty-msg-small">Aucune tâche pour aujourd\'hui</p>';
    } else {
        container.innerHTML = todayTasks.map(task => `
            <div class="today-task-item">
                <span class="task-dot ${task.priority}"></span>
                <span class="task-text">${escapeHTML(task.title)}</span>
            </div>
        `).join('');
    }
}

function updateWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    if (typeof Chart === 'undefined') return;
    
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const data = days.map((_, index) => {
        const day = new Date();
        day.setDate(day.getDate() - (6 - index));
        day.setHours(0, 0, 0, 0);
        return tasks.filter(t => {
            const created = new Date(t.createdAt || t.id);
            created.setHours(0, 0, 0, 0);
            return created.getTime() === day.getTime();
        }).length;
    });
    
    if (weeklyChart) weeklyChart.destroy();
    
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Tâches',
                data: data,
                backgroundColor: 'rgba(102,126,234,0.5)',
                borderColor: '#667eea',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#94a3b8', stepSize: 1 } },
                x: { ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// ============================================================
// CALENDRIER
// ============================================================
function updateCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('calendarMonth');
    if (!grid || !monthLabel) return;
    
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    monthLabel.textContent = months[currentMonth] + ' ' + currentYear;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    let html = '';
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dayNames.forEach(name => html += `<div class="day-name">${name}</div>`);
    
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startOffset; i++) html += `<div class="day other-month"></div>`;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isToday = date.toDateString() === today.toDateString();
        const hasTask = tasks.some(t => {
            if (!t.dueDate || t.status === 'terminée') return false;
            const taskDate = new Date(t.dueDate);
            return taskDate.toDateString() === date.toDateString();
        });
        html += `<div class="day ${isToday ? 'today' : ''} ${hasTask ? 'has-task' : ''}" 
                  onclick="goToDate(${currentYear}, ${currentMonth}, ${day})">${day}</div>`;
    }
    
    grid.innerHTML = html;
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    updateCalendar();
}

function goToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    updateCalendar();
}

function goToDate(year, month, day) {
    const date = new Date(year, month, day);
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-priority').value = 'all';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('search-input').value = '';
    renderTasks();
    showToast('Calendrier', 'Tâches du ' + date.toLocaleDateString('fr-FR'));
    document.getElementById('task-list').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// RAPPORTS
// ============================================================
function updateReports() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'terminée').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const late = tasks.filter(t => t.status !== 'terminée' && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const lateRate = total > 0 ? Math.round((late / total) * 100) : 0;
    
    document.getElementById('reportTotal').textContent = total;
    document.getElementById('reportCompleted').textContent = completed;
    document.getElementById('reportRate').textContent = rate + '%';
    document.getElementById('metricGoal').textContent = rate + '%';
    document.getElementById('metricLate').textContent = lateRate + '%';
    
    // Mettre à jour les barres
    document.querySelector('.metric-fill').style.width = rate + '%';
    const lateBar = document.querySelector('.metric-bar .metric-fill:last-child');
    if (lateBar) lateBar.style.width = lateRate + '%';
    
    // Conseils
    const tips = document.getElementById('reportTips');
    if (tips) {
        let tipsList = [];
        if (total === 0) {
            tipsList.push('💡 Créez votre première tâche');
        } else {
            if (late > 0) tipsList.push(`⚠️ ${late} tâche(s) en retard`);
            if (rate < 50) tipsList.push(`📈 Taux de complétion: ${rate}%`);
            else if (rate > 80) tipsList.push(`🏆 Excellent ! ${rate}% terminé`);
            else tipsList.push(`📊 ${rate}% de complétion, continuez !`);
            tipsList.push('💡 Utilisez les filtres pour organiser');
        }
        tips.innerHTML = tipsList.map(t => `<li>${t}</li>`).join('');
    }
}

// ============================================================
// PROJETS
// ============================================================
function updateProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    
    const categories = ['professionnel', 'personnel', 'etude', 'urgent', 'autre'];
    const labels = ['💼 Professionnel', '👤 Personnel', '📚 Étude', '⚡ Urgent', '📌 Autre'];
    const colors = ['#667eea', '#f6d365', '#34d399', '#f43f5e', '#a78bfa'];
    
    let html = '';
    let hasProjects = false;
    
    categories.forEach((cat, index) => {
        const catTasks = tasks.filter(t => t.category === cat);
        const total = catTasks.length;
        if (total > 0) {
            hasProjects = true;
            const done = catTasks.filter(t => t.status === 'terminée').length;
            const progress = Math.round((done / total) * 100);
            const late = catTasks.filter(t => t.status !== 'terminée' && t.dueDate && new Date(t.dueDate) < new Date()).length;
            
            html += `
                <div class="project-card">
                    <div class="project-header">
                        <span class="project-title">${labels[index]}</span>
                        <span class="project-badge">${total} tâches</span>
                    </div>
                    <div class="project-progress">
                        <div class="progress-track">
                            <div class="progress-fill" style="width:${progress}%;background:${colors[index]};"></div>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:#94a3b8;margin-top:4px;">
                            <span>${done} terminées</span>
                            <span>${progress}%</span>
                        </div>
                    </div>
                    <div class="project-meta">
                        <span><i class="fas fa-clock"></i> ${total - done} restantes</span>
                        ${late > 0 ? `<span style="color:#f43f5e;"><i class="fas fa-exclamation-triangle"></i> ${late} en retard</span>` : ''}
                    </div>
                </div>
            `;
        }
    });
    
    if (!hasProjects) {
        html = `<div class="empty-msg" style="grid-column:1/-1;">
                    <i class="fas fa-folder-open"></i>
                    Aucun projet
                    <span>Créez des tâches pour voir vos projets</span>
                </div>`;
    }
    
    container.innerHTML = html;
}

function showAddProject() {
    document.getElementById('add-task').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// ÉQUIPE
// ============================================================
function updateTeam() {
    const container = document.getElementById('teamContainer');
    if (!container) return;
    
    const stats = {};
    tasks.forEach(task => {
        let member = '';
        switch(task.category) {
            case 'professionnel': member = 'Thomas'; break;
            case 'personnel': member = 'Lisa'; break;
            case 'etude': member = 'Marie'; break;
            case 'urgent': member = 'Jean'; break;
            default: member = 'Thomas'; break;
        }
        if (!stats[member]) stats[member] = { total: 0, done: 0 };
        stats[member].total++;
        if (task.status === 'terminée') stats[member].done++;
    });
    
    const members = [
        { name: 'Thomas', role: 'Lead Developer', color: '#667eea' },
        { name: 'Lisa', role: 'Designer', color: '#f6d365' },
        { name: 'Marie', role: 'Project Manager', color: '#34d399' },
        { name: 'Jean', role: 'Developer', color: '#f43f5e' }
    ];
    
    container.innerHTML = members.map(m => {
        const s = stats[m.name] || { total: 0, done: 0 };
        const progress = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
        return `
            <div class="member-card">
                <div class="member-avatar" style="background:${m.color};">${m.name[0]}</div>
                <div class="member-name">${m.name}</div>
                <div class="member-role">${m.role}</div>
                <div class="member-tasks">${s.total} tâches (${progress}% terminées)</div>
            </div>
        `;
    }).join('');
}

function showAddMember() {
    showToast('Équipe', 'Ajout de membre bientôt disponible');
}

// ============================================================
// PARAMÈTRES
// ============================================================
function setTheme(theme) {
    const buttons = document.querySelectorAll('.settings-options .btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    if (theme === 'dark') {
        document.body.classList.remove('light-mode');
        buttons[0]?.classList.add('active');
        localStorage.setItem('taskflow_theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.add('light-mode');
        buttons[1]?.classList.add('active');
        localStorage.setItem('taskflow_theme', 'light');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function exportData() {
    const data = JSON.stringify({ tasks }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export', 'Données exportées !');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.tasks) {
                tasks = data.tasks;
                saveToStorage();
                renderTasks();
                showToast('Import', 'Données importées !');
            }
        } catch { showToast('Erreur', 'Fichier invalide', 'error'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function clearAllData() {
    if (confirm('Effacer toutes les données ?')) {
        tasks = [];
        saveToStorage();
        renderTasks();
        showToast('Effacé', 'Toutes les données effacées');
    }
}

// ============================================================
// TOAST
// ============================================================
function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-message').textContent = message;
    const icon = toast.querySelector('.toast-icon');
    icon.className = 'toast-icon' + (type === 'error' ? ' error' : '');
    icon.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>`;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

document.querySelector('.toast-close')?.addEventListener('click', () => {
    document.getElementById('toast')?.classList.remove('show');
});

// ============================================================
// CRUD - FORMULAIRE
// ============================================================
document.getElementById('task-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
        showToast('Erreur', 'Le titre est obligatoire', 'error');
        document.getElementById('task-title').focus();
        return;
    }
    
    const task = {
        id: generateId(),
        title: title,
        description: document.getElementById('task-desc').value.trim(),
        priority: document.getElementById('task-priority').value,
        category: document.getElementById('task-category').value,
        dueDate: document.getElementById('task-due').value,
        status: 'en cours',
        createdAt: new Date().toISOString()
    };
    
    if (editingId !== null) {
        const index = tasks.findIndex(t => t.id === editingId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...task };
            showToast('Modification', 'Tâche mise à jour');
        }
        editingId = null;
        document.querySelector('#task-form button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> Ajouter';
    } else {
        tasks.push(task);
        showToast('Ajout', 'Tâche créée !');
    }
    
    saveToStorage();
    renderTasks();
    this.reset();
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    document.getElementById('task-due').value = defaultDate.toISOString().split('T')[0];
});

// ============================================================
// CRUD - ACTIONS SUR LES TÂCHES
// ============================================================
document.getElementById('tasks-container')?.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    if (isNaN(id)) return;
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    if (btn.classList.contains('toggle-btn')) {
        task.status = task.status === 'terminée' ? 'en cours' : 'terminée';
        saveToStorage();
        renderTasks();
        showToast('Succès', `Tâche ${task.status === 'terminée' ? 'terminée' : 'réouverte'}`);
        return;
    }
    
    if (btn.classList.contains('delete-btn')) {
        if (confirm(`Supprimer "${task.title}" ?`)) {
            tasks = tasks.filter(t => t.id !== id);
            saveToStorage();
            renderTasks();
            showToast('Supprimé', 'Tâche supprimée');
        }
        return;
    }
    
    if (btn.classList.contains('edit-btn')) {
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-category').value = task.category;
        document.getElementById('task-due').value = task.dueDate || '';
        editingId = id;
        document.querySelector('#task-form button[type="submit"]').innerHTML = '<i class="fas fa-edit"></i> Modifier';
        document.getElementById('add-task').scrollIntoView({ behavior: 'smooth' });
        showToast('Édition', 'Modification en cours');
        return;
    }
});

// ============================================================
// FILTRES
// ============================================================
document.getElementById('search-input')?.addEventListener('input', renderTasks);
document.getElementById('filter-status')?.addEventListener('change', renderTasks);
document.getElementById('filter-priority')?.addEventListener('change', renderTasks);
document.getElementById('filter-category')?.addEventListener('change', renderTasks);

document.getElementById('clear-filters')?.addEventListener('click', function() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-priority').value = 'all';
    document.getElementById('filter-category').value = 'all';
    renderTasks();
    showToast('Filtres', 'Filtres réinitialisés');
});

// ============================================================
// MENU MOBILE
// ============================================================
document.getElementById('mobile-menu-btn')?.addEventListener('click', function() {
    const nav = document.querySelector('nav ul');
    nav?.classList.toggle('open');
    this.innerHTML = nav?.classList.contains('open') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
});

document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelector('nav ul')?.classList.remove('open');
        document.getElementById('mobile-menu-btn').innerHTML = '<i class="fas fa-bars"></i>';
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
    });
});

// ============================================================
// SCROLL & BACK TO TOP
// ============================================================
function handleScroll() {
    const header = document.querySelector('header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
    
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) backToTop.classList.toggle('show', window.scrollY > 400);
    
    document.querySelectorAll('.scroll-animate').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) el.classList.add('visible');
    });
}

window.addEventListener('scroll', handleScroll);
document.getElementById('back-to-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ============================================================
// THEME
// ============================================================
document.getElementById('themeToggle')?.addEventListener('click', function() {
    const isDark = !document.body.classList.contains('light-mode');
    setTheme(isDark ? 'light' : 'dark');
});

// Charger le thème
if (localStorage.getItem('taskflow_theme') === 'light') {
    setTheme('light');
}

// ============================================================
// RACCOURCI CLAVIER
// ============================================================
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
    }
    if (e.key === 'Escape' && editingId !== null) {
        editingId = null;
        document.getElementById('task-form')?.reset();
        document.querySelector('#task-form button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> Ajouter';
        showToast('Annulation', 'Édition annulée');
    }
});

// ============================================================
// INITIALISATION
// ============================================================
window.addEventListener('load', function() {
    loadFromStorage();
    renderTasks();
    handleScroll();
    
    // Date par défaut
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    document.getElementById('task-due').value = defaultDate.toISOString().split('T')[0];
    
    console.log('🚀 TaskFlow Pro chargé !');
    console.log(`📊 ${tasks.length} tâches`);
});

// Animation shake
const styleShake = document.createElement('style');
styleShake.textContent = `
    @keyframes shake {
        0%,100%{transform:translateX(0)}
        25%{transform:translateX(-8px)}
        75%{transform:translateX(8px)}
    }
`;
document.head.appendChild(styleShake);
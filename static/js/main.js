// ==========================================
// ESTADO Y NAVEGACIÓN
// ==========================================

const API_URL = 'http://localhost:5000/api';

// Efecto de scroll en Navbar
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    if (window.scrollY > 20) {
        navbar.classList.add('bg-[#080d1a]/95', 'backdrop-blur-md', 'border-b', 'border-white/10');
        navbar.classList.remove('bg-transparent');
    } else {
        navbar.classList.remove('bg-[#080d1a]/95', 'backdrop-blur-md', 'border-b', 'border-white/10');
        navbar.classList.add('bg-transparent');
    }
});

function navigate(page) {
    if(window.location.pathname.includes('admin')) {
        window.location.href = '/';
        return;
    }
    
    // Ocultar todas las vistas
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('block');
    });
    
    // Mostrar la vista seleccionada
    const target = document.getElementById(`view-${page}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('block');
    }

    // Actualizar botones del navbar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-white', 'bg-white/8');
        btn.classList.add('text-white/70');
    });

    if (page === 'activities') {
        fetchActivities();
    }

    // Mostrar el footer solo en la página de inicio
    const footer = document.getElementById('main-footer');
    if (footer) {
        if (page === 'home') {
            footer.classList.remove('hidden');
        } else {
            footer.classList.add('hidden');
        }
    }
}

// ==========================================
// AUTENTICACIÓN
// ==========================================

let currentUser = null;
let isLoginMode = true;

function checkAuth() {
    const storedUser = localStorage.getItem('participARD_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        
        // Si es admin o editor y estamos en index.html, redirigir
        if ((currentUser.role === 'Rol_Administradores' || currentUser.role === 'Rol_Editores') && !window.location.pathname.includes('admin')) {
            window.location.href = '/admin'; 
        }
    }
    updateNavbar();
}

function updateNavbar() {
    const navActions = document.getElementById('nav-actions');
    if (!navActions) return;

    if (currentUser) {
        navActions.innerHTML = `
            <div class="flex items-center gap-3 mr-2 bg-white/5 pr-4 pl-1 py-1 rounded-full border border-white/10">
                <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
                    ${currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                </div>
                <div class="flex flex-col">
                    <span class="text-white text-sm font-medium leading-none">${currentUser.fullName}</span>
                    <span class="text-white/40 text-[10px] uppercase font-bold mt-0.5">${currentUser.role === 'Rol_Administradores' ? 'Admin' : (currentUser.role === 'Rol_Editores' ? 'Editor' : 'Estudiante')}</span>
                </div>
            </div>
            <button onclick="logout()" class="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all duration-200 flex items-center gap-2">
                <i data-lucide="log-out" class="w-4 h-4"></i> Salir
            </button>
        `;
    } else {
        navActions.innerHTML = `
            <button onclick="toggleAuthModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all duration-200">
                Iniciar Sesión
            </button>
            <button onclick="toggleAuthModal(false)" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                Registrarse
            </button>
        `;
    }
    if (window.lucide) window.lucide.createIcons();
}

function logout() {
    localStorage.removeItem('participARD_user');
    currentUser = null;
    if (window.location.pathname.includes('admin')) {
        window.location.href = '/';
    } else {
        updateNavbar();
    }
}

// Modal Toggle
function toggleAuthModal(forceLogin = true) {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
            isLoginMode = forceLogin;
            updateAuthForm();
        }
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthForm();
}

function updateAuthForm() {
    document.getElementById('auth-title').innerText = isLoginMode ? 'Bienvenido de nuevo' : 'Únete a ParticipaRD';
    const subtitle = document.getElementById('auth-subtitle');
    subtitle.innerText = isLoginMode ? 'Ingresa tus credenciales para continuar.' : 'Comienza a transformar tu futuro hoy mismo.';
    subtitle.classList.remove("text-emerald-400");
    
    document.getElementById('auth-submit-btn').innerText = isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta';
    document.getElementById('auth-toggle-text').innerText = isLoginMode ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión aquí';
    
    if (isLoginMode) {
        document.getElementById('group-name').classList.add('hidden');
        document.getElementById('auth-name').removeAttribute('required');
    } else {
        document.getElementById('group-name').classList.remove('hidden');
        document.getElementById('auth-name').setAttribute('required', 'true');
    }
}

// Handle Form Submission
const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const fullName = document.getElementById('auth-name').value;
        const role = 'Rol_Estudiantes';
        
        const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
        const body = isLoginMode ? { email, password } : { email, password, fullName, role };
        
        try {
            const res = await fetch(API_URL + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error);
            
            if (isLoginMode) {
                localStorage.setItem('participARD_user', JSON.stringify(data.user));
                checkAuth();
                document.getElementById('auth-modal').classList.add('hidden');
            } else {
                alert('Registro exitoso. Inicia sesión ahora.');
                toggleAuthMode();
            }
        } catch (err) {
            alert(err.message);
        }
    });
}

// ==========================================
// ACTIVITIES (PUBLIC)
// ==========================================

let currentPublicActivities = [];

async function fetchActivities(type = 'all') {
    try {
        let url = API_URL + '/activities';
        if (type !== 'all') url += `?type=${type}`;
        
        const res = await fetch(url);
        const activities = await res.json();
        
        currentPublicActivities = activities;
        
        // Populate Hero Mockups dynamically
        if (activities.length > 0 && type === 'all') {
            const mainAct = activities[0];
            const subAct = activities.length > 1 ? activities[1] : mainAct;

            const today = new Date();
            const endDateMain = new Date(mainAct.end_date);
            const diffTimeMain = endDateMain - today;
            const daysLeftMain = Math.ceil(diffTimeMain / (1000 * 60 * 60 * 24));
            
            const elType = document.getElementById('hero-main-type');
            if (elType) {
                elType.innerText = mainAct.type_id || 'Actividad';
                document.getElementById('hero-main-title').innerText = mainAct.title;
                document.getElementById('hero-main-inst').innerText = mainAct.institution_name || 'Institución Destacada';
                document.getElementById('hero-main-location').innerText = (mainAct.location && mainAct.province) ? `${mainAct.location}, ${mainAct.province}` : (mainAct.province || 'República Dominicana');
                document.getElementById('hero-main-date').innerText = daysLeftMain > 0 ? `Cierra en ${daysLeftMain} días` : 'Cerrada';

                document.getElementById('hero-sub-type').innerText = subAct.type_id || 'Actividad';
                document.getElementById('hero-sub-title').innerText = subAct.title;
            }
            
            // Populate dynamic filter buttons based on available activity types
            const uniqueTypes = [...new Set(activities.map(a => a.type_id))];
            const filtersContainer = document.getElementById('filters-container');
            if (filtersContainer) {
                filtersContainer.innerHTML = `
                    <select onchange="filterActivities(this.value)" class="w-full bg-[#0a0f1e]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer hover:bg-white/5 transition-all shadow-lg shadow-black/20">
                        <option class="bg-[#0a0f1e]" value="all">Todas las categorías</option>
                        ${uniqueTypes.map(t => `
                            <option class="bg-[#0a0f1e]" value="${t}">${t}</option>
                        `).join('')}
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-emerald-400">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            }
        }

        renderActivitiesGrid();
    } catch (err) {
        console.error(err);
    }
}

function renderActivitiesGrid() {
    const grid = document.getElementById('activities-grid');
    if (!grid) return;
    
    const searchInput = document.getElementById('search-activities');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    
    grid.innerHTML = '';
    
    const filteredActivities = currentPublicActivities.filter(act => {
        if (!searchQuery) return true;
        return act.title.toLowerCase().includes(searchQuery) || 
               (act.institution_name && act.institution_name.toLowerCase().includes(searchQuery)) ||
               (act.province && act.province.toLowerCase().includes(searchQuery)) ||
               (act.type_id && act.type_id.toLowerCase().includes(searchQuery));
    });
    
    if (filteredActivities.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-white/50 py-12">No se encontraron actividades que coincidan con tu búsqueda.</div>';
        return;
    }
    
    filteredActivities.forEach(act => {
        const date = new Date(act.end_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        
        let actionHtml = '';
        if (!currentUser || currentUser.role === 'Rol_Estudiantes') {
            actionHtml = `
            <div class="mt-6 pt-4 border-t border-white/10">
                <button onclick="enrollActivity(${act.id})" class="w-full btn-premium py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl font-bold transition-all flex justify-center items-center gap-2">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    Inscribirme ahora
                </button>
            </div>`;
        }

        grid.innerHTML += `
            <div class="glass-card flex flex-col h-full rounded-2xl overflow-hidden group">
                ${act.image_url ? `
                <div class="h-48 w-full relative overflow-hidden shrink-0">
                    <img src="${act.image_url}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${act.title}">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-transparent to-black/30"></div>
                </div>` : ''}
                <div class="p-6 flex-1 flex flex-col relative z-10 ${act.image_url ? '-mt-20' : ''}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${act.image_url ? 'bg-black/40 backdrop-blur-md border border-white/20 text-emerald-300' : 'bg-white/5 border border-white/10 text-emerald-400'} text-xs font-bold uppercase tracking-wider shadow-inner">
                            <i data-lucide="tag" class="w-3 h-3"></i>
                            ${act.type_id}
                        </div>
                        <div class="px-2 py-1 rounded ${act.image_url ? 'bg-black/40 backdrop-blur-md border border-white/20 text-white/90' : 'bg-white/5 text-white/50 border border-white/5'} text-xs font-medium flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i>
                            ${act.province}
                        </div>
                    </div>
                    <h3 class="text-xl font-extrabold text-white mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">${act.title}</h3>
                    <p class="text-white/60 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">${act.description}</p>
                    
                    <div class="space-y-3 mt-auto bg-white/5 p-4 rounded-xl border border-white/5">
                        <div class="flex items-center gap-3 text-white/70 text-sm">
                            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <i data-lucide="building" class="w-4 h-4 text-emerald-400"></i>
                            </div>
                            <span class="truncate font-medium">${act.institution_name}</span>
                        </div>
                        <div class="flex items-center gap-3 text-white/70 text-sm">
                            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <i data-lucide="calendar" class="w-4 h-4 text-emerald-400"></i>
                            </div>
                            <span class="font-medium">Cierre: ${date}</span>
                        </div>
                    </div>
                    ${actionHtml}
                </div>
            </div>
        `;
    });
    if (window.lucide) window.lucide.createIcons();
}

function filterActivities(type) {
    fetchActivities(type);
}

async function enrollActivity(activityId) {
    if (!currentUser) {
        toggleAuthModal(true);
        const subtitle = document.getElementById('auth-subtitle');
        if (subtitle) {
            subtitle.innerText = "Debes iniciar sesión para poder inscribirte en esta actividad.";
            subtitle.classList.add("text-emerald-400"); // Resaltar mensaje
        }
        return;
    }
    
    if (currentUser.role !== 'Rol_Estudiantes') {
        alert("Solo los estudiantes pueden inscribirse en actividades.");
        return;
    }
    
    try {
        const res = await fetch(API_URL + '/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activity_id: activityId, user_id: currentUser.id })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        alert("¡Inscripción exitosa! Te hemos registrado en la actividad.");
    } catch (err) {
        if(err.message.includes('PRIMARY KEY') || err.message.includes('UNIQUE')) {
             alert("Ya estás inscrito en esta actividad.");
        } else {
             alert(err.message || "Ocurrió un error al inscribirte.");
        }
    }
}

// ==========================================
// ADMIN PANEL
// ==========================================

let adminInstitutions = [];

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.add('hidden'));
    document.getElementById(`content-${tab}`).classList.remove('hidden');

    ['overview', 'activities', 'users'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) {
            btn.classList.remove('bg-emerald-500/10', 'text-emerald-400');
            btn.classList.add('text-white/50', 'hover:bg-white/5', 'hover:text-white');
        }
    });

    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-white/50', 'hover:bg-white/5', 'hover:text-white');
        activeBtn.classList.add('bg-emerald-500/10', 'text-emerald-400');
    }
}

async function loadAdminData() {
    if (!window.location.pathname.includes('admin')) return;
    
    if (!currentUser || (currentUser.role !== 'Rol_Administradores' && currentUser.role !== 'Rol_Editores')) {
        window.location.href = '/';
        return;
    }

    // Handle editor view specifics
    if (currentUser.role === 'Rol_Editores') {
        const tabUsersBtn = document.getElementById('tab-users');
        if (tabUsersBtn) tabUsersBtn.classList.add('hidden');
        
        const panelTitle = document.getElementById('panel-title');
        if (panelTitle) panelTitle.innerText = 'Editor Panel';
    }

    document.getElementById('admin-avatar').innerText = currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'A';
    document.getElementById('admin-name').innerText = currentUser.fullName;

    try {
        const [usersRes, actRes, instRes, recentRes] = await Promise.all([
            fetch(API_URL + '/users'),
            fetch(API_URL + '/activities'),
            fetch(API_URL + '/institutions'),
            fetch(API_URL + '/recent_activity')
        ]);
        
        const users = await usersRes.json();
        const activities = await actRes.json();
        adminInstitutions = await instRes.json();
        const recentActivity = await recentRes.json();
        
        document.getElementById('stat-users').innerText = users.length;
        document.getElementById('stat-activities').innerText = activities.length;
        
        renderAdminChart(users);
        renderRecentActivity(recentActivity);
        renderRolesPermissions(users);
        
        // Fill Users Table
        const usersList = document.getElementById('admin-users-list');
        usersList.innerHTML = users.map(u => `
            <tr>
                <td class="px-6 py-4 text-sm text-white">${u.full_name}</td>
                <td class="px-6 py-4 text-sm text-white/70">${u.email}</td>
                <td class="px-6 py-4 text-sm text-emerald-400">${u.role}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-2">
                    <button onclick='openEditUserModal(${JSON.stringify(u).replace(/'/g, "&#39;")})' class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="deleteUser('${u.id}')" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');

        // Fill Activities Table
        const actList = document.getElementById('admin-activities-list');
        actList.innerHTML = activities.map(a => `
            <tr>
                <td class="px-6 py-4 text-sm text-white font-medium max-w-[200px] truncate">${a.title}</td>
                <td class="px-6 py-4 text-sm"><span class="px-2 py-1 bg-white/10 rounded text-white/70">${a.type_id}</span></td>
                <td class="px-6 py-4 text-sm text-white/70">${a.end_date.split('T')[0]}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-2">
                    <button onclick='editActivity(${JSON.stringify(a).replace(/'/g, "&#39;")})' class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="deleteActivity(${a.id})" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');
        
        // Fill Activity Types Datalist dynamically
        const uniqueTypes = [...new Set(activities.map(a => a.type_id))];
        const typesDatalist = document.getElementById('activity-types-list');
        if (typesDatalist) {
            typesDatalist.innerHTML = uniqueTypes.map(t => `<option value="${t}"></option>`).join('');
        }

        // Fill Institution Select removed as it is now free-text

        if (window.lucide) window.lucide.createIcons();
        initCloudinary();

    } catch (err) {
        console.error(err);
    }
}

// Cloudinary Integration
let cloudinaryWidget = null;

function initCloudinary() {
    if (window.cloudinary && !cloudinaryWidget) {
        cloudinaryWidget = cloudinary.createUploadWidget({
            cloudName: 'duvsilg9e', 
            uploadPreset: 'participard_preset',
            sources: ['local', 'url', 'camera'],
            multiple: false,
            language: 'es'
        }, (error, result) => { 
            if (!error && result && result.event === "success") { 
                const imgUrl = result.info.secure_url;
                document.getElementById('act-image').value = imgUrl;
                document.getElementById('image-preview').src = imgUrl;
                document.getElementById('image-preview-container').classList.remove('hidden');
            }
        });

        const uploadBtn = document.getElementById('upload_widget');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', function() {
                cloudinaryWidget.open();
            }, false);
        }
    }
}

function removeImage() {
    const actImage = document.getElementById('act-image');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    if(actImage) actImage.value = '';
    if(previewImg) previewImg.src = '';
    if(previewContainer) previewContainer.classList.add('hidden');
}

function openActivityModal() {
    document.getElementById('activity-form').reset();
    document.getElementById('act-id').value = '';
    removeImage();
    document.getElementById('modal-activity-title').innerText = 'Nueva Actividad';
    document.getElementById('activity-modal').classList.remove('hidden');
}

function closeActivityModal() {
    document.getElementById('activity-modal').classList.add('hidden');
}

function editActivity(act) {
    document.getElementById('act-id').value = act.id;
    document.getElementById('act-title').value = act.title;
    document.getElementById('act-desc').value = act.description;
    document.getElementById('act-type').value = act.type_id;
    document.getElementById('act-date').value = act.end_date.split('T')[0];
    document.getElementById('act-location').value = act.location;
    document.getElementById('act-institution').value = act.institution_name || '';
    
    if (act.image_url) {
        document.getElementById('act-image').value = act.image_url;
        document.getElementById('image-preview').src = act.image_url;
        document.getElementById('image-preview-container').classList.remove('hidden');
    } else {
        removeImage();
    }
    
    document.getElementById('modal-activity-title').innerText = 'Editar Actividad';
    document.getElementById('activity-modal').classList.remove('hidden');
}

const actForm = document.getElementById('activity-form');
if (actForm) {
    actForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('act-id').value;
        const body = {
            Titulo: document.getElementById('act-title').value,
            Descripcion: document.getElementById('act-desc').value,
            Tipo: document.getElementById('act-type').value,
            FechaCierre: document.getElementById('act-date').value,
            Localidad: document.getElementById('act-location').value,
            InstitucionNombre: document.getElementById('act-institution').value,
            ImagenURL: document.getElementById('act-image').value || null,
            modifier: currentUser.fullName || 'Sistema'
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/activities/${id}` : `${API_URL}/activities`;

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            closeActivityModal();
            loadAdminData();
        } catch (err) {
            console.error(err);
        }
    });
}

async function deleteActivity(id) {
    if(confirm('¿Seguro que deseas eliminar esta actividad?')) {
        await fetch(`${API_URL}/activities/${id}`, { method: 'DELETE' });
        loadAdminData();
    }
}

async function deleteUser(id) {
    if(confirm('¿Seguro que deseas eliminar este usuario?')) {
        const modifier = currentUser ? currentUser.fullName : 'Sistema';
        await fetch(`${API_URL}/users/${id}?modifier=${encodeURIComponent(modifier)}`, { method: 'DELETE' });
        loadAdminData();
    }
}

// User Modal Logic
function openUserModal() {
    document.getElementById('user-form').reset();
    document.getElementById('user-id').value = '';
    document.getElementById('modal-user-title').innerText = 'Nuevo Usuario';
    document.getElementById('user-password-container').classList.remove('hidden');
    document.getElementById('user-password').required = true;
    document.getElementById('user-modal').classList.remove('hidden');
}

function openEditUserModal(user) {
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-fullname').value = user.full_name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;
    document.getElementById('modal-user-title').innerText = 'Editar Usuario';
    document.getElementById('user-password-container').classList.add('hidden');
    document.getElementById('user-password').required = false;
    document.getElementById('user-modal').classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.add('hidden');
}

const userForm = document.getElementById('user-form');
if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('user-id').value;
        let body = {};
        
        if (!id) {
            body = {
                fullName: document.getElementById('user-fullname').value,
                email: document.getElementById('user-email').value,
                role: document.getElementById('user-role').value,
                password: document.getElementById('user-password').value
            };
        } else {
            body = {
                FullName: document.getElementById('user-fullname').value,
                Email: document.getElementById('user-email').value,
                RolID: document.getElementById('user-role').value
            };
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/users/${id}` : `${API_URL}/auth/register`;

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            closeUserModal();
            loadAdminData();
        } catch (err) {
            console.error(err);
        }
    });
}

// Chart Logic
let adminChart = null;
function renderAdminChart(users) {
    const ctx = document.getElementById('adminSummaryChart');
    if (!ctx) return;
    
    // Contar usuarios por rol
    let admins = 0;
    let estudiantes = 0;
    let editores = 0;
    users.forEach(u => {
        if (u.role === 'Rol_Administradores') admins++;
        else if (u.role === 'Rol_Editores') editores++;
        else estudiantes++;
    });

    if (adminChart) {
        adminChart.destroy();
    }

    adminChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Administradores', 'Editores', 'Estudiantes'],
            datasets: [{
                data: [admins, editores, estudiantes],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // Emerald
                    'rgba(245, 158, 11, 0.8)', // Amber
                    'rgba(59, 130, 246, 0.8)'  // Blue
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 1,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: 'rgba(255, 255, 255, 0.7)', padding: 20 }
                }
            }
        }
    });
}

function renderRecentActivity(recentActivity) {
    const listEl = document.getElementById('recent-activity-list');
    if (!listEl) return;
    
    if (!recentActivity || recentActivity.length === 0) {
        listEl.innerHTML = '<p class="text-white/50 text-sm">No hay actividad reciente.</p>';
        return;
    }
    
    let html = '';
    
    recentActivity.forEach(act => {
        let color = 'emerald';
        let initials = 'U';
        let title = '';
        let desc = '';
        
        if (act.type === 'user') {
            color = 'blue';
            initials = 'US';
            title = 'Nuevo usuario creado';
            desc = `${act.name} (${act.role})`;
        } else if (act.type === 'activity') {
            if (act.action === 'USUARIO ELIMINADO') {
                color = 'red';
                initials = 'UE';
                title = 'Usuario eliminado';
                desc = act.user; // We stored the 'Name (por Modifier)' in the user field
            } else {
                color = act.action === 'CREADA' ? 'emerald' : (act.action === 'EDITADA' ? 'amber' : 'red');
                initials = act.action === 'CREADA' ? 'CR' : (act.action === 'EDITADA' ? 'ED' : 'EL');
                title = `Actividad ${act.action.toLowerCase()}`;
                desc = `${act.title} (por ${act.user})`;
            }
        }
        
        // Formatear la fecha
        let timeLabel = '';
        if (act.date) {
            const dateObj = new Date(act.date);
            const today = new Date();
            const diffTime = Math.abs(today - dateObj);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) timeLabel = 'Hoy';
            else if (diffDays === 1) timeLabel = 'Ayer';
            else timeLabel = `Hace ${diffDays} días`;
        }
        
        html += `
            <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-${color}-500/20 text-${color}-400 flex items-center justify-center font-bold text-sm border border-${color}-500/30">
                        ${initials}
                    </div>
                    <div>
                        <p class="text-white text-sm font-medium">${title}</p>
                        <p class="text-white/50 text-xs">${desc}</p>
                    </div>
                </div>
                <span class="text-white/30 text-xs">${timeLabel}</span>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
}



function renderRolesPermissions(users) {
    const listEl = document.getElementById('roles-permissions-list');
    if (!listEl) return;
    
    let admins = 0, editores = 0, estudiantes = 0;
    users.forEach(u => {
        if (u.role === 'Rol_Administradores') admins++;
        else if (u.role === 'Rol_Editores') editores++;
        else estudiantes++;
    });
    
    const roles = [
        { name: 'Administrador', count: admins, access: 'Acceso total', color: 'purple', bg: 'purple-500/20', border: 'purple-500/30', text: 'purple-400' },
        { name: 'Editor', count: editores, access: 'Lectura + edición', color: 'blue', bg: 'blue-500/20', border: 'blue-500/30', text: 'blue-400' },
        { name: 'Estudiante', count: estudiantes, access: 'Solo lectura', color: 'emerald', bg: 'emerald-500/20', border: 'emerald-500/30', text: 'emerald-400' }
    ];
    
    let html = '';
    roles.forEach(r => {
        html += `
            <div class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div class="flex items-center gap-3">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-${r.color}-500/20 text-${r.color}-400 border border-${r.color}-500/30">
                        ${r.name}
                    </span>
                    <span class="text-white/60 text-xs">${r.count} usuario${r.count !== 1 ? 's' : ''}</span>
                </div>
                <span class="text-white/40 text-xs">${r.access}</span>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
    
    const lastChangeEl = document.getElementById('last-role-change');
    if (lastChangeEl && users.length > 0) {
        const sortedUsers = [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latestDate = new Date(sortedUsers[0].created_at);
        const today = new Date();
        const diffTime = Math.abs(today - latestDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        let timeLabel = '';
        if (diffDays === 0) timeLabel = 'hoy';
        else if (diffDays === 1) timeLabel = 'hace 1 día';
        else timeLabel = `hace ${diffDays} días`;
        
        lastChangeEl.innerText = `Último cambio de rol: ${timeLabel} - por el sistema`;
    }
}

// ==========================================
// EFFECTS (PARTICLES)
// ==========================================

function initParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
        const el = document.createElement('div');
        const size = 2 + Math.random() * 4;
        el.className = 'absolute rounded-full bg-emerald-400 animate-fall';
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = `-50px`;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.opacity = 0.2 + Math.random() * 0.4;
        el.style.animation = `fall ${25 + Math.random() * 20}s linear infinite`;
        el.style.animationDelay = `-${Math.random() * 40}s`;
        el.style.filter = 'blur(0.5px)';
        el.style.boxShadow = `0 0 ${size * 2}px rgba(52, 211, 153, 0.4)`;
        container.appendChild(el);
    }
    for (let i = 0; i < 25; i++) {
        const el = document.createElement('div');
        const size = 2 + Math.random() * 4;
        el.className = 'absolute rounded-full bg-emerald-300 opacity-20 animate-drift';
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = `${Math.random() * 100}%`;
        el.style.width = `${size * 1.5}px`;
        el.style.height = `${size * 1.5}px`;
        el.style.animation = `drift ${(25 + Math.random() * 20) * 1.5}s ease-in-out infinite both`;
        el.style.animationDelay = `-${Math.random() * 40}s`;
        el.style.filter = 'blur(1.5px)';
        container.appendChild(el);
    }
}

// ==========================================
// INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initParticles();
    
    if (window.location.pathname.includes('admin')) {
        loadAdminData();
    } else {
        // Redirigir admin/editor a panel de admin si está en index.html
        if (currentUser && (currentUser.role === 'Rol_Administradores' || currentUser.role === 'Rol_Editores')) {
            window.location.href = '/admin';
        }
        // Cargar actividades para la vista pública y el Hero
        fetchActivities();
    }
});

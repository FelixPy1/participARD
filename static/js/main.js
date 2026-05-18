// ==========================================
// ESTADO Y NAVEGACIÓN
// ==========================================

const API_URL = '/api';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'duvsilg9e'; 
const CLOUDINARY_PRESET = 'participard_preset';


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
    } else {
        console.warn(`View section 'view-${page}' not found.`);
    }

    // Actualizar botones del navbar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-white', 'bg-white/8');
        btn.classList.add('text-white/70');
    });

    if (page === 'activities') {
        if (typeof fetchActivities === 'function') fetchActivities();
    } else if (page === 'news') {
        if (typeof fetchNews === 'function') fetchNews();
    } else if (page === 'about') {
        if (typeof loadAboutPage === 'function') loadAboutPage();
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
let isOtpMode = false;

function checkAuth() {
    try {
        const storedUser = localStorage.getItem('participARD_user');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            
            // Si es admin o editor y estamos en index.html, redirigir
            if (currentUser && (currentUser.role === 'Rol_Administradores' || currentUser.role === 'Rol_Editores') && !window.location.pathname.includes('admin')) {
                window.location.href = '/admin'; 
            }
        }
    } catch (err) {
        console.error('Error in checkAuth:', err);
        localStorage.removeItem('participARD_user'); // Limpiar datos corruptos
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
            isOtpMode = false;
            updateAuthForm();
            // Reset errors/success when opening
            document.getElementById('auth-error').classList.add('hidden');
            document.getElementById('auth-success').classList.add('hidden');
        }
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    isOtpMode = false;
    updateAuthForm();
}

function updateAuthForm() {
    if (isOtpMode) {
        document.getElementById('auth-title').innerText = 'Verificación de Correo';
        document.getElementById('auth-subtitle').innerText = 'Ingresa el código que acabamos de enviar a tu correo.';
        document.getElementById('auth-submit-btn').innerText = 'Verificar y Crear Cuenta';
        
        document.getElementById('group-otp').classList.remove('hidden');
        document.getElementById('auth-otp').setAttribute('required', 'true');
        
        document.getElementById('auth-email').setAttribute('readonly', 'true');
        document.getElementById('auth-name').setAttribute('readonly', 'true');
        document.getElementById('auth-password').setAttribute('readonly', 'true');
        document.getElementById('auth-confirm-password').setAttribute('readonly', 'true');
        return;
    }

    document.getElementById('auth-title').innerText = isLoginMode ? 'Bienvenido de nuevo' : 'Únete a ParticipaRD';
    const subtitle = document.getElementById('auth-subtitle');
    subtitle.innerText = isLoginMode ? 'Ingresa tus credenciales para continuar.' : 'Comienza a transformar tu futuro hoy mismo.';
    subtitle.classList.remove("text-emerald-400");
    
    document.getElementById('auth-submit-btn').innerText = isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta';
    document.getElementById('auth-toggle-text').innerText = isLoginMode ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión aquí';
    
    document.getElementById('group-otp').classList.add('hidden');
    document.getElementById('auth-otp').removeAttribute('required');
    document.getElementById('auth-otp').value = '';
    
    document.getElementById('auth-email').removeAttribute('readonly');
    document.getElementById('auth-name').removeAttribute('readonly');
    document.getElementById('auth-password').removeAttribute('readonly');
    document.getElementById('auth-confirm-password').removeAttribute('readonly');
    
    if (isLoginMode) {
        document.getElementById('group-name').classList.add('hidden');
        document.getElementById('auth-name').removeAttribute('required');
        document.getElementById('group-confirm-password').classList.add('hidden');
        document.getElementById('auth-confirm-password').removeAttribute('required');
    } else {
        document.getElementById('group-name').classList.remove('hidden');
        document.getElementById('auth-name').setAttribute('required', 'true');
        document.getElementById('group-confirm-password').classList.remove('hidden');
        document.getElementById('auth-confirm-password').setAttribute('required', 'true');
    }
}

// Handle Form Submission
let lockoutInterval = null;
let isLockoutActive = false;
let lockoutRemainingSeconds = 0;

function showPremiumAlert(title, text, icon = 'error') {
    Swal.fire({
        title: title,
        text: text,
        icon: icon,
        background: '#0a0f1e',
        color: '#fff',
        confirmButtonColor: '#10b981',
        customClass: {
            popup: 'glass-panel border border-white/10 rounded-3xl',
            title: 'text-white font-bold',
            htmlContainer: 'text-white/70'
        }
    });
}

function startLockoutCountdown(seconds) {
    const errorContainer = document.getElementById('auth-error');
    const errorMsg = document.getElementById('auth-error-msg');
    const submitBtn = document.getElementById('auth-submit-btn');
    
    if (!errorContainer || !errorMsg) return;
    
    errorContainer.classList.remove('hidden');
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    
    if (lockoutInterval) clearInterval(lockoutInterval);
    
    isLockoutActive = true;
    lockoutRemainingSeconds = seconds;
    
    const updateText = () => {
        const minutes = Math.floor(lockoutRemainingSeconds / 60);
        const secs = lockoutRemainingSeconds % 60;
        const timeStr = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        errorMsg.innerHTML = `<strong>Cuenta bloqueada temporalmente.</strong><br>Por favor, espera <span class="text-white font-bold">${timeStr}</span> antes de intentar de nuevo.`;
    };
    
    updateText();
    
    lockoutInterval = setInterval(() => {
        lockoutRemainingSeconds--;
        if (lockoutRemainingSeconds <= 0) {
            clearInterval(lockoutInterval);
            isLockoutActive = false;
            errorContainer.classList.add('hidden');
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            updateText();
        }
    }, 1000);
}

const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLockoutActive) {
            const minutes = Math.floor(lockoutRemainingSeconds / 60);
            const secs = lockoutRemainingSeconds % 60;
            const timeStr = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
            showPremiumAlert('Cuenta Bloqueada', `Tu cuenta está bloqueada temporalmente por seguridad. Debes esperar ${timeStr} para intentar de nuevo.`, 'warning');
            return;
        }
        
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const confirmPassword = document.getElementById('auth-confirm-password').value;
        const fullName = document.getElementById('auth-name').value;
        const role = 'Rol_Estudiantes';
        
        const errorContainer = document.getElementById('auth-error');
        const errorMsg = document.getElementById('auth-error-msg');
        const successContainer = document.getElementById('auth-success');
        const submitBtn = document.getElementById('auth-submit-btn');
        
        errorContainer.classList.add('hidden');
        successContainer.classList.add('hidden');

        if (!isLoginMode && password !== confirmPassword) {
            showPremiumAlert('Error de Validación', 'Las contraseñas no coinciden. Por favor, verifícalas.', 'error');
            return;
        }

        if (!isLoginMode && !email.toLowerCase().trim().endsWith('@gmail.com')) {
            showPremiumAlert('Error de Validación', 'Solo se permite el registro con cuentas de correo de @gmail.com.', 'error');
            return;
        }
        
        const code = document.getElementById('auth-otp').value;
        let endpoint = isLoginMode ? '/auth/login' : '/auth/register';
        let body = isLoginMode ? { email, password } : { email, password, fullName, role, code };
        
        if (!isLoginMode && !isOtpMode) {
            endpoint = '/auth/request_register';
            body = { email, password, fullName, role };
        }
        
        try {
            submitBtn.classList.add('opacity-50', 'pointer-events-none');
            submitBtn.innerText = 'Procesando...';
            
            const res = await fetch(API_URL + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            submitBtn.classList.remove('opacity-50', 'pointer-events-none');
            submitBtn.innerText = isOtpMode ? 'Verificar y Crear Cuenta' : (isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta');
            
            if (!res.ok) {
                if (data.lockout) {
                    startLockoutCountdown(data.seconds_remaining);
                    return;
                }
                
                if (isLoginMode || isOtpMode) {
                    errorContainer.classList.remove('hidden');
                    errorMsg.innerHTML = `<strong>Error:</strong><br>${data.error}`;
                    return;
                }
                
                throw new Error(data.error);
            }
            
            if (isLoginMode) {
                localStorage.setItem('participARD_user', JSON.stringify(data.user));
                checkAuth();
                
                Swal.fire({
                    title: '¡Bienvenido!',
                    text: `Hola ${data.user.fullName}, has iniciado sesión correctamente.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#0a0f1e',
                    color: '#fff'
                });
                
                setTimeout(() => {
                    document.getElementById('auth-modal').classList.add('hidden');
                }, 2000);
            } else if (!isLoginMode && !isOtpMode) {
                isOtpMode = true;
                updateAuthForm();
                successContainer.classList.remove('hidden');
                document.getElementById('auth-success-msg').innerHTML = `<strong>Código enviado</strong><br>Revisa tu correo ${email} (incluyendo SPAM).`;
            } else {
                showPremiumAlert('¡Registro Exitoso!', 'Tu cuenta ha sido creada y verificada. Ahora puedes iniciar sesión con tus credenciales.', 'success');
                toggleAuthMode();
            }
        } catch (err) {
            submitBtn.classList.remove('opacity-50', 'pointer-events-none');
            submitBtn.innerText = isOtpMode ? 'Verificar y Crear Cuenta' : (isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta');
            
            if (isLoginMode) {
                errorContainer.classList.remove('hidden');
                errorMsg.innerHTML = `<strong>Error:</strong> ${err.message}`;
            } else {
                showPremiumAlert('Error', err.message, 'error');
            }
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
            let daysLeftMainText = 'Cerrada';
            if (mainAct.end_date) {
                const endDateMain = new Date(mainAct.end_date);
                const diffTimeMain = endDateMain - today;
                const daysLeftMain = Math.ceil(diffTimeMain / (1000 * 60 * 60 * 24));
                daysLeftMainText = daysLeftMain > 0 ? `Cierra en ${daysLeftMain} días` : 'Cerrada';
            } else if (mainAct.start_date) {
                const startDateMain = new Date(mainAct.start_date);
                const diffTimeMain = startDateMain - today;
                const daysLeftMain = Math.ceil(diffTimeMain / (1000 * 60 * 60 * 24));
                daysLeftMainText = daysLeftMain > 0 ? `Inicia en ${daysLeftMain} días` : 'Iniciada';
            } else {
                daysLeftMainText = 'Fecha no definida';
            }
            
            const elType = document.getElementById('hero-main-type');
            if (elType) {
                elType.innerText = mainAct.type_id || 'Actividad';
                document.getElementById('hero-main-title').innerText = mainAct.title;
                document.getElementById('hero-main-inst').innerText = mainAct.institution_name || 'Institución Destacada';
                document.getElementById('hero-main-location').innerText = (mainAct.location && mainAct.province) ? `${mainAct.location}, ${mainAct.province}` : (mainAct.province || 'República Dominicana');
                document.getElementById('hero-main-date').innerText = daysLeftMainText;

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
        const isEndDate = !!act.end_date;
        const displayDate = isEndDate ? act.end_date : act.start_date;
        const date = displayDate ? new Date(displayDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No definida';
        const dateLabel = isEndDate ? 'Cierre:' : (act.start_date ? 'Inicio:' : 'Fecha:');
        
        const showAction = !currentUser || currentUser.role === 'Rol_Estudiantes';
        const actionHtml = showAction ? `
            <div class="mt-6 pt-4 border-t border-white/10">
                <button data-open-modal="${act.id}" class="ver-mas-btn w-full btn-premium py-2.5 bg-transparent hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl font-bold transition-all flex justify-center items-center gap-2">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                    Ver más
                </button>
            </div>` : '';

        const card = document.createElement('div');
        card.className = 'glass-card flex flex-col h-full rounded-2xl overflow-hidden group cursor-pointer hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all';
        card.dataset.activityId = act.id;
        card.innerHTML = `
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
                        ${act.location !== 'No especificada' && act.location ? act.location : act.province}
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
                        <span class="font-medium">${dateLabel} ${date}</span>
                    </div>
                </div>
                ${actionHtml}
            </div>
        `;

        grid.appendChild(card);
    });

    // Attach 'Ver más' button events after all cards are in DOM
    grid.querySelectorAll('.ver-mas-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const id = this.dataset.openModal;
            openPublicActivityModal(id);
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

function filterActivities(type) {
    fetchActivities(type);
}

async function enrollActivity(activityId) {
    if (!currentUser) {
        // Close activity modal first, then show login
        closePublicActivityModal();
        setTimeout(() => {
            toggleAuthModal(true);
            const subtitle = document.getElementById('auth-subtitle');
            if (subtitle) {
                subtitle.innerText = "Debes iniciar sesión para poder inscribirte en esta actividad.";
                subtitle.classList.add("text-emerald-400");
            }
        }, 200);
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
        closePublicActivityModal();
    } catch (err) {
        console.error('Enrollment error:', err);
        if(err.message.includes('PRIMARY KEY') || err.message.includes('UNIQUE')) {
             alert("Ya estás inscrito en esta actividad.");
        } else {
             alert("Error: " + err.message);
        }
    }
}

function openPublicActivityModal(activityId) {
    const act = currentPublicActivities.find(a => String(a.id) === String(activityId));
    if (!act) {
        console.error('Activity not found:', activityId, currentPublicActivities);
        return;
    }

    const startDateStr = act.start_date ? new Date(act.start_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha no definida';
    const endDateStr = act.end_date ? new Date(act.end_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha no definida';

    document.getElementById('public-activity-title').innerText = act.title;
    document.getElementById('public-activity-desc').innerText = act.description;
    
    // Type handling
    const typeEl = document.getElementById('public-activity-type');
    if (typeEl) {
        typeEl.querySelector('span').innerText = act.type_id || 'Actividad';
    }
    
    document.getElementById('public-activity-province').innerHTML = act.location !== 'No especificada' && act.location ? act.location : act.province;
    document.getElementById('public-activity-inst').innerText = act.institution_name || 'Desconocida';
    
    const startEl = document.getElementById('public-activity-start-date');
    if (startEl) startEl.innerText = startDateStr;
    const endEl = document.getElementById('public-activity-end-date');
    if (endEl) endEl.innerText = endDateStr;

    const imgContainer = document.getElementById('public-activity-image-container');
    const imgEl = document.getElementById('public-activity-image');
    if (act.image_url) {
        imgEl.src = act.image_url;
        imgContainer.classList.remove('hidden');
    } else {
        imgContainer.classList.add('hidden');
    }

    const modal = document.getElementById('public-activity-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock scroll

    // Wire up enroll button
    const container = document.getElementById('public-activity-action-container');
    container.innerHTML = ''; // Clear
    
    const btn = document.createElement('button');
    btn.id = 'public-activity-enroll-btn';
    btn.className = 'w-full sm:w-64 btn-premium py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)]';
    
    if (act.official_url) {
        btn.innerHTML = `<i data-lucide="external-link" class="w-5 h-5"></i> Ir al sitio oficial`;
        btn.onclick = () => {
            if (!currentUser) {
                closePublicActivityModal();
                setTimeout(() => {
                    toggleAuthModal(true);
                    const subtitle = document.getElementById('auth-subtitle');
                    if (subtitle) {
                        subtitle.innerText = "Debes iniciar sesión para ir al sitio oficial.";
                        subtitle.classList.add("text-emerald-400");
                    }
                }, 200);
            } else {
                window.open(act.official_url, '_blank');
            }
        };
    } else {
        btn.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5"></i> Inscribirme ahora`;
        btn.onclick = () => enrollActivity(act.id);
    }
    
    container.appendChild(btn);
    
    if (window.lucide) window.lucide.createIcons();
    if (window.AOS) window.AOS.refresh();
}

function closePublicActivityModal() {
    const modal = document.getElementById('public-activity-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Unlock scroll
}

// ==========================================
// ADMIN PANEL
// ==========================================

let adminInstitutions = [];

function switchAdminTab(tab) {
    console.log(`Switching to admin tab: ${tab}`);
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('block');
    });
    
    const target = document.getElementById(`content-${tab}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('block');
    } else {
        console.error(`Admin content section 'content-${tab}' not found.`);
        return;
    }

    ['overview', 'activities', 'users', 'news', 'contributors'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) {
            btn.classList.remove('bg-emerald-500/10', 'text-emerald-400');
            btn.classList.add('text-white/50', 'hover:bg-white/5', 'hover:text-white');
        }
    });

    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-emerald-500/10', 'text-emerald-400');
        activeBtn.classList.remove('text-white/50');
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
        
        const tabContribBtn = document.getElementById('tab-contributors');
        if (tabContribBtn) tabContribBtn.classList.add('hidden');
        
        const panelTitle = document.getElementById('panel-title');
        if (panelTitle) panelTitle.innerText = 'Editor Panel';
    }

    document.getElementById('admin-avatar').innerText = currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'A';
    document.getElementById('admin-name').innerText = currentUser.fullName;

    try {
        const [usersRes, actRes, instRes, recentRes, newsRes, contRes] = await Promise.all([
            fetch(API_URL + '/users'),
            fetch(API_URL + '/activities?all=true'),
            fetch(API_URL + '/institutions'),
            fetch(API_URL + '/recent_activity'),
            fetch(API_URL + '/news'),
            fetch(API_URL + '/contributors')
        ]);
        
        const users = await usersRes.json();
        const activities = await actRes.json();
        adminInstitutions = await instRes.json();
        const recentActivity = await recentRes.json();
        const news = await newsRes.json();
        const contributors = await contRes.json();
        
        if (currentUser.role === 'Rol_Editores') {
            const titleEl = document.getElementById('overview-card-1-title');
            if (titleEl) titleEl.innerText = 'NOTICIAS CREADAS';
            document.getElementById('stat-users').innerText = news.length;
            const iconEl = document.getElementById('overview-card-1-icon');
            if (iconEl) {
                iconEl.innerHTML = '<i data-lucide="newspaper" class="w-16 h-16"></i>';
            }
            const subEl = document.getElementById('overview-card-1-sub');
            if (subEl) {
                subEl.innerHTML = '<i data-lucide="bar-chart" class="w-3 h-3"></i> noticias publicadas';
            }
        } else {
            document.getElementById('stat-users').innerText = users.length;
        }
        document.getElementById('stat-activities').innerText = activities.length;
        
        renderAdminChart(users);
        renderRecentActivity(recentActivity);
        renderRolesPermissions(users);
        
        // Update User Stats
        const totalUsers = users.length;
        const activeUsers = users.length; // Assuming all users are active for now
        
        let userAdmins = 0, userEditors = 0, userStudents = 0;
        let newUsersThisMonth = 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        users.forEach(u => {
            if (u.role === 'Rol_Administradores') userAdmins++;
            else if (u.role === 'Rol_Editores') userEditors++;
            else userStudents++;

            if (u.created_at) {
                const dateObj = new Date(u.created_at);
                if (dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
                    newUsersThisMonth++;
                }
            }
        });

        const statTotal = document.getElementById('user-stat-total');
        if (statTotal) statTotal.innerText = totalUsers;
        const statNew = document.getElementById('user-stat-new');
        if (statNew) statNew.innerText = newUsersThisMonth > 0 ? `↑ ${newUsersThisMonth} este mes` : 'Sin nuevos este mes';
        
        const statActive = document.getElementById('user-stat-active');
        if (statActive) statActive.innerText = activeUsers;
        const statActivePct = document.getElementById('user-stat-active-pct');
        if (statActivePct) statActivePct.innerText = totalUsers > 0 ? `${Math.round((activeUsers/totalUsers)*100)}% del total` : '0% del total';

        const statRoles = document.getElementById('user-stat-roles');
        if (statRoles) statRoles.innerText = (userAdmins>0?1:0) + (userEditors>0?1:0) + (userStudents>0?1:0);

        // Initialize Users Table and Search
        window.allAdminUsers = users;
        renderAdminUsersTable(users);
        setupUserSearch();

        // Initialize Admin Activities Table and Stats
        window.allAdminActivities = activities;
        renderAdminActivitiesStats(activities);
        renderAdminActivitiesTable(activities);
        setupActivityFilters();
        
        // Fill Activity Types Datalist dynamically
        const uniqueTypes = [...new Set(activities.map(a => a.type_id))];
        const typesDatalist = document.getElementById('activity-types-list');
        if (typesDatalist) {
            typesDatalist.innerHTML = uniqueTypes.map(t => `<option value="${t}"></option>`).join('');
        }

        // Fill Institution Select removed as it is now free-text

        // Initialize Admin News Table and Stats
        window.allAdminNews = news;
        renderAdminNewsStats(news);
        renderAdminNewsTable(news);

        if (window.lucide) window.lucide.createIcons();
        initCloudinary();
        initNewsCloudinary();
        initContributorCloudinary();

        // RENDER CONTRIBUTORS TABLE (Missing call!)
        renderAdminContributors(contributors);

    } catch (err) {
        console.error(err);
    }
}

function renderAdminUsersTable(usersToRender) {
    const usersList = document.getElementById('admin-users-list');
    if (!usersList) return;
    
    if (usersToRender.length === 0) {
        usersList.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-white/50 text-sm">No se encontraron usuarios que coincidan con la búsqueda.</td></tr>';
    } else {
        usersList.innerHTML = usersToRender.map(u => {
            let bgAvatar = '', textAvatar = '', bgBadge = '', textBadge = '', roleDisplay = '';
            if (u.role === 'Rol_Estudiantes') {
                bgAvatar = 'bg-[#0f3b30]'; textAvatar = 'text-[#34d399]';
                bgBadge = 'bg-[#0f3b30] text-[#34d399]';
                roleDisplay = 'Estudiante';
            } else if (u.role === 'Rol_Editores') {
                bgAvatar = 'bg-[#1a3048]'; textAvatar = 'text-[#60a5fa]';
                bgBadge = 'bg-[#1a3048] text-[#60a5fa]';
                roleDisplay = 'Editor';
            } else {
                bgAvatar = 'bg-[#2d1f4e]'; textAvatar = 'text-[#a78bfa]';
                bgBadge = 'bg-[#2d1f4e] text-[#a78bfa]';
                roleDisplay = 'Administrador';
            }

            const initials = u.full_name ? (u.full_name.substring(0, 2).toUpperCase()) : 'US';
            const dateStr = u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '';
            
            return `
            <tr class="hover:bg-white/5 transition-colors group">
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full ${bgAvatar} ${textAvatar} flex items-center justify-center text-[11px] font-bold shrink-0 shadow-inner border border-white/5">${initials}</div>
                        <div class="flex flex-col">
                            <span class="text-[13px] text-white font-medium">${u.full_name}</span>
                            <span class="text-[11px] text-white/40">Desde ${dateStr}</span>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-[13px] text-white/70">${u.email}</td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium ${bgBadge} border border-white/5">${roleDisplay}</span>
                </td>
                <td class="px-4 py-3 text-[12px] text-white/40">Reciente</td>
                <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick='openEditUserModal(${JSON.stringify(u).replace(/'/g, "&#39;")})' class="p-1.5 text-white/50 hover:text-white bg-[#111827] border border-white/10 rounded-md transition-all hover:bg-white/10" title="Editar">
                            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="deleteUser('${u.id}')" class="p-1.5 text-red-400 hover:text-red-300 bg-[#111827] border border-white/10 rounded-md transition-all hover:border-red-900/50 hover:bg-red-900/20" title="Eliminar">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }
    
    if (window.lucide) window.lucide.createIcons();
    
    const pagInfo = document.getElementById('user-pagination-info');
    if (pagInfo) pagInfo.innerText = `Mostrando ${usersToRender.length} usuarios`;
}

function setupUserSearch() {
    const searchInput = document.getElementById('user-search-input');
    if (!searchInput) return;
    
    // Eliminar event listener anterior clonándolo
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!window.allAdminUsers) return;
        
        const filtered = window.allAdminUsers.filter(u => {
            const roleStr = u.role === 'Rol_Estudiantes' ? 'estudiante' : (u.role === 'Rol_Editores' ? 'editor' : 'administrador');
            return (u.full_name && u.full_name.toLowerCase().includes(query)) ||
                   (u.email && u.email.toLowerCase().includes(query)) ||
                   roleStr.includes(query);
        });
        
        renderAdminUsersTable(filtered);
    });
}

// Cloudinary Integration
let cloudinaryWidget = null;

function initCloudinary() {
    if (window.cloudinary && !cloudinaryWidget) {
        cloudinaryWidget = cloudinary.createUploadWidget({
            cloudName: CLOUDINARY_CLOUD_NAME, 
            uploadPreset: CLOUDINARY_PRESET,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            language: 'es',
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
            maxFileSize: 5000000, // 5MB
        }, (error, result) => { 
            if (error) {
                console.error('Cloudinary Error:', error);
                showPremiumAlert('Error de Subida', 'No se pudo conectar con Cloudinary. Verifica tu configuración.', 'error');
                return;
            }
            if (result && result.event === "success") { 
                const imgUrl = result.info.secure_url;
                document.getElementById('act-image').value = imgUrl;
                document.getElementById('image-preview').src = imgUrl;
                document.getElementById('image-preview-container').classList.remove('hidden');
                showPremiumAlert('¡Éxito!', 'Imagen subida correctamente.', 'success');
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
    
    // Helper para convertir la fecha del backend (ej. "Tue, 05 May 2026...") a formato YYYY-MM-DD
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return '';
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    if(document.getElementById('act-start-date') && act.start_date) {
        document.getElementById('act-start-date').value = formatDate(act.start_date);
    }
    document.getElementById('act-date').value = formatDate(act.end_date);
    if(document.getElementById('act-status')) {
        document.getElementById('act-status').value = act.status || 'Activa';
    }
    document.getElementById('act-location').value = act.location;
    document.getElementById('act-institution').value = act.institution_name || '';
    if(document.getElementById('act-official-url')) {
        document.getElementById('act-official-url').value = act.official_url || '';
    }
    
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
        const startDate = document.getElementById('act-start-date') ? document.getElementById('act-start-date').value : null;
        const endDate = document.getElementById('act-date') ? document.getElementById('act-date').value : null;
        
        if (!startDate && !endDate) {
            alert('Debes proveer al menos una fecha (Inicio o Cierre).');
            return;
        }

        const body = {
            Titulo: document.getElementById('act-title').value,
            Descripcion: document.getElementById('act-desc').value,
            Tipo: document.getElementById('act-type').value,
            FechaInicio: startDate,
            FechaCierre: endDate,
            Estado: document.getElementById('act-status') ? document.getElementById('act-status').value : 'Activa',
            Localidad: document.getElementById('act-location').value,
            InstitucionNombre: document.getElementById('act-institution').value,
            ImagenURL: document.getElementById('act-image').value || null,
            SitioOficialURL: document.getElementById('act-official-url') ? (document.getElementById('act-official-url').value || null) : null,
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
    document.getElementById('user-confirm-password-container').classList.remove('hidden');
    document.getElementById('user-password').required = true;
    document.getElementById('user-confirm-password').required = true;
    document.getElementById('user-modal').classList.remove('hidden');
}

function openEditUserModal(user) {
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-fullname').value = user.full_name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;
    document.getElementById('modal-user-title').innerText = 'Editar Usuario';
    document.getElementById('user-password-container').classList.add('hidden');
    document.getElementById('user-confirm-password-container').classList.add('hidden');
    document.getElementById('user-password').required = false;
    document.getElementById('user-confirm-password').required = false;
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
            const password = document.getElementById('user-password').value;
            const confirmPassword = document.getElementById('user-confirm-password').value;
            
            if (password !== confirmPassword) {
                showPremiumAlert('Error de Validación', 'Las contraseñas no coinciden.', 'error');
                return;
            }
            
            body = {
                fullName: document.getElementById('user-fullname').value,
                email: document.getElementById('user-email').value,
                role: document.getElementById('user-role').value,
                password: password
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
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al guardar el usuario');
            }
            
            closeUserModal();
            loadAdminData();
            
            Swal.fire({
                title: '¡Éxito!',
                text: id ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: '#0a0f1e',
                color: '#fff'
            });
        } catch (err) {
            showPremiumAlert('Error', err.message, 'error');
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
// ADMIN ACTIVITIES TAB LOGIC
// ==========================================

function renderAdminActivitiesStats(activities) {
    const totalEl = document.getElementById('act-stat-total');
    const proxEl = document.getElementById('act-stat-prox');
    const proxDaysEl = document.getElementById('act-stat-prox-days');

    if (!totalEl || !proxEl) return;

    totalEl.innerText = activities.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = activities
        .map(a => ({ ...a, dateObj: new Date(a.end_date) }))
        .filter(a => a.dateObj >= today)
        .sort((a, b) => a.dateObj - b.dateObj);

    if (upcoming.length > 0) {
        const next = upcoming[0];
        const options = { day: '2-digit', month: 'short' };
        proxEl.innerText = next.dateObj.toLocaleDateString('es-ES', options);
        
        const diffTime = Math.abs(next.dateObj - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        proxDaysEl.innerText = diffDays === 0 ? 'hoy' : `en ${diffDays} días`;
    } else {
        proxEl.innerText = '-';
        proxDaysEl.innerText = 'sin actividades futuras';
    }
}

function renderAdminActivitiesTable(activities) {
    const actList = document.getElementById('admin-activities-list');
    if (!actList) return;

    if (activities.length === 0) {
        actList.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-white/50 text-sm">No se encontraron actividades.</td></tr>';
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    const today = new Date();

    actList.innerHTML = activities.map(a => {
        // Calculate creation time ago
        let createdTimeLabel = 'N/A';
        if (a.created_at) {
            const dateObj = new Date(a.created_at);
            const diffTime = Math.abs(today - dateObj);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0) createdTimeLabel = 'Hoy';
            else if (diffDays === 1) createdTimeLabel = 'Ayer';
            else createdTimeLabel = `Hace ${diffDays} días`;
        }

        let startDateString = 'No definida';
        if (a.start_date) {
            const startObj = new Date(a.start_date);
            startDateString = startObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        let endDateString = 'No definida';
        let isClosed = false;
        if (a.end_date) {
            const endObj = new Date(a.end_date);
            isClosed = endObj < today;
            endDateString = endObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        const typeNormalized = a.type_id.toLowerCase();
        
        let typeColor = 'blue';
        if (typeNormalized.includes('beca')) typeColor = 'blue';
        else if (typeNormalized.includes('olimp')) typeColor = 'purple';
        else typeColor = 'emerald';

        const creator = a.created_by || 'administrador';
        const creatorInitials = creator.substring(0, 2).toUpperCase();

        const rowHtml = `
            <tr class="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                <td class="px-6 py-4">
                    <p class="text-sm font-semibold text-white truncate max-w-[200px]">${a.title}</p>
                    <p class="text-[10px] text-white/40 mt-1">Creada ${createdTimeLabel.toLowerCase()}</p>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex px-3 py-1 bg-${typeColor}-500/20 text-${typeColor}-400 border border-${typeColor}-500/30 rounded-full text-[10px] uppercase font-bold tracking-wider">
                        ${a.type_id}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-white/80">
                    ${startDateString}
                </td>
                <td class="px-6 py-4 text-sm ${isClosed ? 'text-white/30' : 'text-white/80'}">
                    ${endDateString}
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${a.status === 'Activa' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40 border border-white/10'}">
                        <span class="w-1.5 h-1.5 rounded-full ${a.status === 'Activa' ? 'bg-emerald-400' : 'bg-white/40'}"></span>
                        ${a.status || 'Activa'}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-400">
                            ${creatorInitials}
                        </div>
                        <span class="text-xs text-white/60 truncate max-w-[100px]">${creator}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex justify-end items-center gap-1">
                        <button onclick='editActivity(${JSON.stringify(a).replace(/'/g, "&#39;")})' class="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" title="Editar">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteActivity(${a.id})" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return rowHtml;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

function setupActivityFilters() {
    const searchInput = document.getElementById('activity-search-input');
    const filterSelect = document.getElementById('activity-filter-select');
    
    if (!searchInput || !filterSelect || !window.allAdminActivities) return;

    // Populate the select dynamically
    const uniqueTypes = [...new Set(window.allAdminActivities.map(a => a.type_id))];
    let selectHtml = '<option class="bg-[#0a0f1e]" value="all">Todas las categorías</option>';
    uniqueTypes.forEach(type => {
        selectHtml += `<option class="bg-[#0a0f1e]" value="${type}">${type}</option>`;
    });
    filterSelect.innerHTML = selectHtml;

    // Remove old listeners to prevent duplicates
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    const newFilterSelect = filterSelect.cloneNode(true);
    filterSelect.parentNode.replaceChild(newFilterSelect, filterSelect);

    const applyFilters = () => {
        if (!window.allAdminActivities) return;
        
        const query = newSearchInput.value.toLowerCase();
        const currentFilter = newFilterSelect.value.toLowerCase();
        
        let filtered = window.allAdminActivities.filter(a => {
            const matchesSearch = a.title.toLowerCase().includes(query) || a.type_id.toLowerCase().includes(query);
            if (!matchesSearch) return false;
            
            if (currentFilter === 'all') return true;
            return a.type_id.toLowerCase() === currentFilter;
        });

        renderAdminActivitiesTable(filtered);
    };
    
    newSearchInput.addEventListener('input', applyFilters);
    newFilterSelect.addEventListener('change', applyFilters);
}

// ==========================================
// NEWS (PUBLIC)
// ==========================================

let currentPublicNews = [];

async function fetchNews() {
    try {
        const res = await fetch(API_URL + '/news');
        const news = await res.json();
        currentPublicNews = news;
        renderNewsGrid();
    } catch (err) {
        console.error('Error fetching news:', err);
    }
}

function renderNewsGrid() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    const searchInput = document.getElementById('search-news');
    const query = searchInput ? searchInput.value.toLowerCase() : '';

    grid.innerHTML = '';

    const filteredNews = currentPublicNews.filter(n => 
        n.title.toLowerCase().includes(query) || (n.summary && n.summary.toLowerCase().includes(query))
    );

    if (filteredNews.length === 0) {
        grid.innerHTML = '<div class="text-center text-white/50 py-12">No se encontraron noticias.</div>';
        return;
    }

    filteredNews.forEach((n, index) => {
        const dateStr = new Date(n.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const initials = n.author_name ? n.author_name.substring(0, 2).toUpperCase() : 'AD';
        
        const card = document.createElement('div');
        card.className = 'glass-card group flex flex-col h-full rounded-3xl overflow-hidden border border-white/5 hover:border-emerald-500/30 transition-all duration-500 cursor-pointer hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]';
        
        card.onclick = () => openNewsDetail(n.id);
        
        card.innerHTML = `
            <div class="relative overflow-hidden shrink-0 h-52 w-full">
                <img src="${n.image_url || 'https://images.unsplash.com/photo-1585829365234-78d9b6924617?q=80&w=2070&auto=format&fit=crop'}" 
                     class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                     alt="${n.title}">
                <div class="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-transparent to-transparent opacity-60"></div>
            </div>
            <div class="flex-1 p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">${dateStr}</span>
                        <div class="w-1 h-1 rounded-full bg-white/20"></div>
                        <span class="text-white/40 text-[10px] flex items-center gap-1">
                            <i data-lucide="eye" class="w-3 h-3"></i> ${n.views}
                        </span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2">
                        ${n.title}
                    </h3>
                    <p class="text-white/50 text-xs leading-relaxed line-clamp-3 mb-4">
                        ${n.summary || ''}
                    </p>
                    <div class="flex items-center gap-2 text-emerald-400 text-xs font-bold group-hover:gap-3 transition-all duration-300">
                        Leer noticia
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
}

async function openNewsDetail(id) {
    try {
        const res = await fetch(API_URL + '/news/' + id);
        if (!res.ok) throw new Error('Failed to fetch news details');
        
        const n = await res.json();
        
        // Handle Unique View
        const viewedKey = `viewed_news_${id}`;
        if (!localStorage.getItem(viewedKey)) {
            fetch(`${API_URL}/news/${id}/view`, { method: 'POST' }).catch(err => console.error(err));
            localStorage.setItem(viewedKey, 'true');
            n.views++; // Update local object
            
            const newsInArray = currentPublicNews.find(item => item.id === id);
            if (newsInArray) newsInArray.views++;
        }

        const dateStr = new Date(n.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        
        document.getElementById('news-detail-title').innerText = n.title;
        document.getElementById('news-detail-date').innerText = dateStr;
        document.getElementById('news-detail-date-sidebar').innerText = dateStr;
        document.getElementById('news-detail-views-count').innerText = n.views;
        document.getElementById('news-detail-content').innerHTML = n.content;
        document.getElementById('news-detail-image').src = n.image_url || '';
        document.getElementById('news-detail-author-name').innerText = n.author_name || 'ParticipaRD';
        
        const initials = n.author_name ? n.author_name.substring(0, 2).toUpperCase() : 'AD';
        document.getElementById('news-detail-author-avatar').innerText = initials;

        const modal = document.getElementById('news-detail-modal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Lock scroll
        
        if (window.lucide) window.lucide.createIcons();
        if (window.AOS) window.AOS.refresh();
        
    } catch (err) {
        console.error('Error opening news:', err);
        Swal.fire('Error', 'No se pudo cargar la noticia.', 'error');
    }
}

function closeNewsDetail() {
    const modal = document.getElementById('news-detail-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Unlock scroll
}

// ==========================================
// ADMIN NEWS TAB LOGIC
// ==========================================

let newsCloudinaryWidget = null;

function initNewsCloudinary() {
    if (window.cloudinary && !newsCloudinaryWidget) {
        newsCloudinaryWidget = cloudinary.createUploadWidget({
            cloudName: CLOUDINARY_CLOUD_NAME, 
            uploadPreset: CLOUDINARY_PRESET,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            language: 'es',
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
            maxFileSize: 5000000, // 5MB
        }, (error, result) => { 
            if (error) {
                console.error('Cloudinary Error (News):', error);
                showPremiumAlert('Error de Subida', 'No se pudo subir la imagen de la noticia.', 'error');
                return;
            }
            if (result && result.event === "success") { 
                const imgUrl = result.info.secure_url;
                document.getElementById('news-image-url').value = imgUrl;
                document.getElementById('news-image-preview').src = imgUrl;
                document.getElementById('news-image-preview-container').classList.remove('hidden');
                showPremiumAlert('¡Éxito!', 'Imagen de noticia subida correctamente.', 'success');
            }
        });

        const uploadBtn = document.getElementById('news_upload_widget');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => newsCloudinaryWidget.open(), false);
        }
    }
}

function removeNewsImage() {
    document.getElementById('news-image-url').value = '';
    document.getElementById('news-image-preview').src = '';
    document.getElementById('news-image-preview-container').classList.add('hidden');
}

function renderAdminNewsStats(news) {
    const totalEl = document.getElementById('news-stat-total');
    const viewsEl = document.getElementById('news-stat-views');
    if (totalEl) totalEl.innerText = news.length;
    if (viewsEl) {
        const totalViews = news.reduce((acc, curr) => acc + (curr.views || 0), 0);
        viewsEl.innerText = totalViews;
    }
}

function renderAdminNewsTable(news) {
    const list = document.getElementById('admin-news-list');
    if (!list) return;

    if (news.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-white/50 text-sm">No hay noticias publicadas.</td></tr>';
        return;
    }

    list.innerHTML = news.map(n => `
        <tr class="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
            <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                        <img src="${n.image_url || 'https://images.unsplash.com/photo-1585829365234-78d9b6924617?q=80&w=100&auto=format&fit=crop'}" class="w-full h-full object-cover">
                    </div>
                    <p class="text-sm font-semibold text-white truncate max-w-[250px]">${n.title}</p>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-white/60">${n.author_name || 'Desconocido'}</td>
            <td class="px-6 py-4 text-sm text-white/60">${new Date(n.date).toLocaleDateString()}</td>
            <td class="px-6 py-4 text-sm text-emerald-400 font-medium">${n.views}</td>
            <td class="px-6 py-4">
                <div class="flex justify-end items-center gap-1">
                    <button onclick='editNews(${JSON.stringify(n).replace(/'/g, "&#39;")})' class="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" title="Editar">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteNews(${n.id})" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    if (window.lucide) window.lucide.createIcons();
}

function openNewsModal() {
    document.getElementById('news-form').reset();
    document.getElementById('news-id').value = '';
    removeNewsImage();
    document.getElementById('modal-news-title').innerText = 'Nueva Noticia';
    document.getElementById('news-modal').classList.remove('hidden');
}

function closeNewsModal() {
    document.getElementById('news-modal').classList.add('hidden');
}

function editNews(n) {
    document.getElementById('news-id').value = n.id;
    document.getElementById('news-title-input').value = n.title;
    document.getElementById('news-summary-input').value = n.summary || '';
    document.getElementById('news-content-input').value = n.content || '';
    
    if (n.image_url) {
        document.getElementById('news-image-url').value = n.image_url;
        document.getElementById('news-image-preview').src = n.image_url;
        document.getElementById('news-image-preview-container').classList.remove('hidden');
    } else {
        removeNewsImage();
    }
    
    document.getElementById('modal-news-title').innerText = 'Editar Noticia';
    document.getElementById('news-modal').classList.remove('hidden');
}

const newsForm = document.getElementById('news-form');
if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('news-id').value;
        const body = {
            title: document.getElementById('news-title-input').value,
            summary: document.getElementById('news-summary-input').value,
            content: document.getElementById('news-content-input').value,
            image_url: document.getElementById('news-image-url').value || null,
            author_id: currentUser ? currentUser.id : null
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/news/${id}` : `${API_URL}/news`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Error saving news');
            closeNewsModal();
            loadAdminData();
        } catch (err) {
            console.error(err);
            alert('Error al guardar la noticia');
        }
    });
}

async function deleteNews(id) {
    if (confirm('¿Seguro que deseas eliminar esta noticia?')) {
        try {
            await fetch(`${API_URL}/news/${id}`, { method: 'DELETE' });
            loadAdminData();
        } catch (err) {
            console.error(err);
        }
    }
}

// ==========================================
// CONTRIBUTORS MANAGEMENT
// ==========================================

function renderAdminContributors(contributors) {
    const list = document.getElementById('admin-contributors-list');
    if (!list) return;
    list.innerHTML = '';

    contributors.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors group';
        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <img src="${c.image_url || 'https://via.placeholder.com/150'}" class="w-10 h-10 rounded-full border border-white/10" alt="${c.name}">
                    <span class="font-medium text-white">${c.name}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-white/70">${c.role}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-md bg-white/5 text-white/50 border border-white/10 text-xs font-medium">${c.category}</span>
            </td>
            <td class="px-6 py-4 text-white/70">${c.order || 0}</td>
            <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                    <button onclick='editContributor(${JSON.stringify(c).replace(/'/g, "&#39;")})' class="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all" title="Editar">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteContributor(${c.id})" class="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all" title="Eliminar">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
    if (window.lucide) window.lucide.createIcons();
}

function openContributorModal() {
    document.getElementById('contributor-id').value = '';
    document.getElementById('contributor-form').reset();
    document.getElementById('contributor-image-preview-container').classList.add('hidden');
    document.getElementById('modal-contributor-title').innerText = 'Nuevo Contribuidor';
    document.getElementById('contributor-modal').classList.remove('hidden');
}

function closeContributorModal() {
    document.getElementById('contributor-modal').classList.add('hidden');
}

function editContributor(c) {
    document.getElementById('contributor-id').value = c.id;
    document.getElementById('contributor-name').value = c.name;
    document.getElementById('contributor-role').value = c.role;
    document.getElementById('contributor-category').value = c.category;
    document.getElementById('contributor-order').value = c.order;
    document.getElementById('contributor-image').value = c.image_url || '';
    
    if (c.image_url) {
        document.getElementById('contributor-image-preview').src = c.image_url;
        document.getElementById('contributor-image-preview-container').classList.remove('hidden');
    } else {
        document.getElementById('contributor-image-preview-container').classList.add('hidden');
    }
    
    document.getElementById('modal-contributor-title').innerText = 'Editar Contribuidor';
    document.getElementById('contributor-modal').classList.remove('hidden');
}

function removeContributorImage() {
    document.getElementById('contributor-image').value = '';
    document.getElementById('contributor-image-preview-container').classList.add('hidden');
}

let contributorWidget = null;
function initContributorCloudinary() {
    const contributorUploadBtn = document.getElementById('contributor_upload_widget');
    if (window.cloudinary && contributorUploadBtn && !contributorWidget) {
        contributorWidget = cloudinary.createUploadWidget({
            cloudName: CLOUDINARY_CLOUD_NAME,
            uploadPreset: CLOUDINARY_PRESET,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            language: 'es'
        }, (error, result) => {
            if (error) {
                console.error('Cloudinary Error (Contributor):', error);
                showPremiumAlert('Error de Subida', 'No se pudo subir la foto del contribuidor.', 'error');
                return;
            }
            if (result && result.event === "success") {
                const url = result.info.secure_url;
                document.getElementById('contributor-image').value = url;
                document.getElementById('contributor-image-preview').src = url;
                document.getElementById('contributor-image-preview-container').classList.remove('hidden');
                showPremiumAlert('¡Éxito!', 'Foto de perfil subida correctamente.', 'success');
            }
        });
        contributorUploadBtn.addEventListener('click', () => contributorWidget.open(), false);
    }
}

const contributorForm = document.getElementById('contributor-form');
if (contributorForm) {
    contributorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('contributor-id').value;
        const body = {
            name: document.getElementById('contributor-name').value,
            role: document.getElementById('contributor-role').value,
            category: document.getElementById('contributor-category').value,
            order: parseInt(document.getElementById('contributor-order').value) || 0,
            image_url: document.getElementById('contributor-image').value || null
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/contributors/${id}` : `${API_URL}/contributors`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Error saving contributor');
            
            Swal.fire({
                title: '¡Éxito!',
                text: id ? 'Contribuidor actualizado.' : 'Contribuidor creado con éxito.',
                icon: 'success',
                background: '#0a0f1e',
                color: '#fff'
            });
            
            closeContributorModal();
            loadAdminData();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudo guardar el contribuidor.', 'error');
        }
    });
}

async function deleteContributor(id) {
    if (confirm('¿Seguro que deseas eliminar este contribuidor?')) {
        try {
            await fetch(`${API_URL}/contributors/${id}`, { method: 'DELETE' });
            loadAdminData();
        } catch (err) {
            console.error(err);
        }
    }
}

// ==========================================
// PUBLIC ABOUT PAGE RENDERING
// ==========================================

async function loadAboutPage() {
    try {
        console.log('Fetching contributors...');
        const res = await fetch('/api/contributors');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const contributors = await res.json();
        console.log('Contributors received:', contributors);
        
        const aboutContainer = document.getElementById('view-about');
        if (!aboutContainer) {
            console.error('view-about container not found');
            return;
        }

        // Cabecera de Contribuidores
        let html = `
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="text-center mb-16">
                    <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-6">Nuestros <span class="text-emerald-400">Contribuidores</span></h1>
                </div>
        `;

        if (!Array.isArray(contributors) || contributors.length === 0) {
            console.log('No contributors found in API response');
            html += `
                <div class="text-center py-12">
                    <p class="text-white/40 italic">Todavía no se han agregado contribuidores.</p>
                </div>
            `;
        } else {
            const categories = [...new Set(contributors.map(c => c.category))];
            
            categories.forEach(cat => {
                const catContributors = contributors.filter(c => c.category === cat);
                html += `
                    <div class="mb-20">
                        <h2 class="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <span class="w-8 h-1 bg-emerald-500 rounded-full"></span>
                            ${cat || 'Colaboradores'}
                        </h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                `;

                catContributors.forEach(c => {
                    html += `
                        <div class="glass-card p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group">
                            <div class="flex flex-col items-center text-center">
                                <div class="relative mb-6">
                                    <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-10 group-hover:opacity-30 transition-all duration-500"></div>
                                    <img src="${c.image_url || 'https://via.placeholder.com/150'}" class="relative w-24 h-24 rounded-full object-cover border-2 border-white/10" alt="${c.name}">
                                </div>
                                <h3 class="text-lg font-bold text-white mb-1">${c.name}</h3>
                                <p class="text-emerald-400 text-sm font-medium mb-4 uppercase tracking-wider">${c.role}</p>
                            </div>
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        aboutContainer.innerHTML = html;
        console.log('About page rendered successfully');

    } catch (err) {
        console.error('Error loading about page:', err);
        const aboutContainer = document.getElementById('view-about');
        if (aboutContainer) {
            aboutContainer.innerHTML = `
                <div class="max-w-4xl mx-auto px-4 py-12 text-center">
                    <p class="text-red-400 font-bold">Error al cargar la información</p>
                    <p class="text-white/30 text-xs mt-2">${err.message}</p>
                </div>
            `;
        }
    }
}

// ==========================================
// INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        checkAuth();
        initParticles();
        
        if (window.location.pathname.includes('admin')) {
            loadAdminData().catch(err => console.error('Failed to load admin data:', err));
        } else {
            // Redirigir admin/editor a panel de admin si está en index.html
            if (currentUser && (currentUser.role === 'Rol_Administradores' || currentUser.role === 'Rol_Editores')) {
                window.location.href = '/admin';
            }
            // Cargar actividades para la vista pública y el Hero
            if (typeof fetchActivities === 'function') fetchActivities();
        }

        // Forzar la eliminación de cualquier Service Worker previo (Limpiar "caché" de PWA)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                    console.log('Service Worker desinstalado para limpiar caché.');
                }
            });
        }
    } catch (err) {
        console.error('Critical initialization error:', err);
    }
});

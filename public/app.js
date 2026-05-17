const API_BASE = 'http://localhost:3000/api';

let currentUser = null;
let currentRole = null;

// Override showPage to fetch data
const originalShowPage = typeof showPage !== 'undefined' ? showPage : function(){};
showPage = function(id) {
    originalShowPage(id);
    
    if (id === 'dashboard') loadDashboard();
    if (id === 'results') loadDashboard(); // Results page needs same data
    if (id === 'recommendations') loadRecommendations();
    if (id === 'admin-dashboard') loadAdminDashboard();
    if (id === 'user-mgmt') loadAdminUsers();
    if (id === 'activity-monitor') loadAdminActivities();
    if (id === 'profile') loadProfile();
};

async function doRegister() {
    const name = document.getElementById('reg-name').value;
    const age = document.getElementById('reg-age').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const location = document.getElementById('reg-location').value;

    const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, email, password, location })
    });
    const data = await res.json();
    if (data.success) {
        alert('Registration successful! Please login.');
        showPage('login');
    } else {
        alert(data.error);
    }
}

async function doLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
        currentUser = data.user;
        currentRole = 'user';
        showPage('dashboard');
    } else {
        alert(data.error);
    }
}

async function doAdminLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    const res = await fetch(`${API_BASE}/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
        currentUser = data.user;
        currentRole = 'admin';
        showPage('admin-dashboard');
    } else {
        alert(data.error);
    }
}

async function doLogout() {
    await fetch(`${API_BASE}/logout`, { method: 'POST' });
    currentUser = null;
    currentRole = null;
    showPage('home');
}

async function loadProfile() {
    const res = await fetch(`${API_BASE}/me`);
    const data = await res.json();
    if (data.success) {
        document.querySelector('.profile-name').innerText = data.user.name;
        document.querySelector('.profile-email').innerText = data.user.email;
        const spans = document.querySelectorAll('.profile-header span');
        if(spans.length >= 2) {
            spans[0].innerText = data.user.location;
            spans[1].innerText = 'Age: ' + data.user.age;
        }
        document.querySelector('.profile-avatar-lg').innerText = data.user.name.substring(0,2).toUpperCase();
    }
}

async function loadDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`);
    const data = await res.json();
    if (!data.success) return;

    // Update greeting
    const userRes = await fetch(`${API_BASE}/me`);
    const userData = await userRes.json();
    if (userData.success) {
        document.querySelector('.welcome-text h3').innerText = `Hello, ${userData.user.name} 👋`;
        document.querySelector('.dash-subtitle').innerText = `Welcome back, ${userData.user.name}! Here's your carbon summary.`;
    }

    // Dash totals
    document.getElementById('dash-total-co2').innerText = data.totalCo2.toFixed(1);
    document.getElementById('dash-elec-kwh').innerText = data.byType.electricity.toFixed(1);
    document.getElementById('dash-trans-km').innerText = data.byType.transport.toFixed(1);
    document.getElementById('dash-waste-kg').innerText = data.byType.waste.toFixed(1);

    // Results page totals
    const emissionsResultEls = document.querySelectorAll('.emission-val');
    if(emissionsResultEls.length > 0) emissionsResultEls[0].innerHTML = `${data.totalCo2.toFixed(1)} <span class="emission-unit">kg CO₂ / month</span>`;
    const meterVal = document.querySelector('.meter-val');
    if(meterVal) meterVal.innerHTML = `${data.totalCo2.toFixed(1)} <span class="emission-unit">kg CO₂</span>`;

    const recentActBody = document.getElementById('recent-activities-body');
    if (recentActBody) {
        recentActBody.innerHTML = '';
        if (data.activities.length === 0) {
            recentActBody.innerHTML = '<tr><td colspan="4" style="text-align:center">No activities added yet. Start tracking!</td></tr>';
        }
        data.activities.slice(0, 5).forEach(act => {
            const co2 = data.emissions.find(e => e.activity_id === act.id)?.co2_amount || 0;
            let icon = ''; let color = '';
            if(act.type==='electricity') { icon = 'fa-bolt'; color = '#f59e0b'; }
            if(act.type==='transport') { icon = 'fa-car'; color = '#3b82f6'; }
            if(act.type==='waste') { icon = 'fa-trash'; color = '#22c55e'; }
            if(act.type==='fuel') { icon = 'fa-gas-pump'; color = '#ef4444'; }
            
            recentActBody.innerHTML += `<tr>
                <td><i class="fa-solid ${icon}" style="color:${color}"></i> ${act.type}</td>
                <td><span class="badge" style="background:${color}22;color:${color}">${act.type}</span></td>
                <td style="font-weight:700">${co2.toFixed(1)}</td>
                <td>${new Date(act.date).toLocaleDateString()}</td>
            </tr>`;
        });
    }

    // Update charts dynamically
    updateChartsWithData(data);
}

function updateChartsWithData(data) {
    if (chartInstances.pc) {
        chartInstances.pc.data.datasets[0].data = [
            data.typeEmissions.electricity,
            data.typeEmissions.transport,
            data.typeEmissions.fuel,
            data.typeEmissions.waste
        ];
        chartInstances.pc.update();
    }
    if (chartInstances.bc) {
        chartInstances.bc.data.datasets[0].data = [
            data.typeEmissions.electricity,
            data.typeEmissions.transport,
            data.typeEmissions.fuel,
            data.typeEmissions.waste
        ];
        chartInstances.bc.update();
    }
}

async function doAddActivity() {
    const typeMap = { '🚗 Transport': 'transport', '⚡ Electricity': 'electricity', '⛽ Fuel': 'fuel', '🗑️ Waste': 'waste' };
    const typeSelect = document.getElementById('act-type').value;
    const type = typeMap[typeSelect] || 'transport';
    
    // We get the value depending on type. Since UI has sliders and inputs, let's just use the sliders for electricity/fuel/waste, and distance input for transport
    let value = 0;
    if (type === 'transport') {
        value = parseFloat(document.getElementById('act-dist').value || 0);
    } else if (type === 'electricity') {
        value = parseFloat(document.getElementById('elecSlider').value || 0);
    } else if (type === 'fuel') {
        value = parseFloat(document.getElementById('fuelSlider').value || 0);
    } else if (type === 'waste') {
        value = parseFloat(document.getElementById('wasteSlider').value || 0);
    }

    let unit = 'km';
    if (type === 'electricity') unit = 'kWh';
    if (type === 'fuel') unit = 'L';
    if (type === 'waste') unit = 'kg';

    const res = await fetch(`${API_BASE}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, unit })
    });
    const data = await res.json();
    if (data.success) {
        alert('Activity recorded! CO2 generated: ' + data.co2_amount.toFixed(2) + ' kg');
        showPage('dashboard');
    } else {
        alert('Failed to add activity');
    }
}

async function loadRecommendations() {
    const res = await fetch(`${API_BASE}/recommendations`);
    const data = await res.json();
    const container = document.getElementById('recs-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (!data.success || data.recommendations.length === 0) {
        container.innerHTML = '<p>No recommendations generated yet. Add more activities.</p>';
        return;
    }

    data.recommendations.forEach(r => {
        container.innerHTML += `
            <div class="rec-card">
                <div class="rec-icon" style="background:#dbeafe;color:#2563eb"><i class="fa-solid fa-leaf"></i></div>
                <h4>${r.impact}</h4>
                <p>${r.content}</p>
                <div class="rec-impact"><i class="fa-solid fa-arrow-down"></i> Level: ${r.level}</div>
            </div>
        `;
    });
}

// Admin Functions
async function loadAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`);
    const data = await res.json();
    const tbody = document.getElementById('admin-users-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (data.success) {
        data.users.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td style="color:var(--text-3);font-family:monospace">USR-${u.id}</td>
                    <td><div style="display:flex;align-items:center;gap:8px"><div class="user-avatar">${u.name.substring(0,2).toUpperCase()}</div>${u.name}</div></td>
                    <td>${u.email}</td>
                    <td>${u.location}</td>
                    <td><span class="badge badge-green">Active</span></td>
                    <td>${new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
            `;
        });
    }
}

async function loadAdminActivities() {
    const res = await fetch(`${API_BASE}/admin/activities`);
    const data = await res.json();
    const tbody = document.getElementById('admin-activities-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.success) {
        data.activities.forEach(a => {
            tbody.innerHTML += `
                <tr>
                    <td style="color:var(--text-3);font-family:monospace">ACT-${a.id}</td>
                    <td>${a.name}</td>
                    <td><span class="badge badge-blue">${a.type}</span></td>
                    <td>${a.value} ${a.unit}</td>
                    <td style="font-weight:700">${a.co2_amount.toFixed(1)}</td>
                    <td>${new Date(a.date).toLocaleDateString()}</td>
                </tr>
            `;
        });
    }
}

async function loadAdminDashboard() {
    // Basic reload of users and activities to get counts
    const usersRes = await fetch(`${API_BASE}/admin/users`);
    const usersData = await usersRes.json();
    
    const actRes = await fetch(`${API_BASE}/admin/activities`);
    const actData = await actRes.json();

    if(usersData.success && actData.success) {
        const metrics = document.querySelectorAll('#page-admin-dashboard .metric-value');
        if(metrics.length >= 2) {
            metrics[0].innerText = usersData.users.length;
            const totalCo2 = actData.activities.reduce((sum, a) => sum + a.co2_amount, 0);
            metrics[1].innerHTML = `${totalCo2.toFixed(1)}<span style="font-size:1rem"> kg</span>`;
            metrics[2].innerText = usersData.users.length; // Active users approx
            metrics[3].innerText = actData.activities.length;
        }

        const logBody = document.getElementById('admin-logs-body');
        if (logBody) {
            logBody.innerHTML = '';
            actData.activities.slice(0, 5).forEach(a => {
                logBody.innerHTML += `
                    <tr>
                        <td><div style="display:flex;align-items:center;gap:8px"><div class="user-avatar">${a.name.substring(0,2).toUpperCase()}</div>${a.name}</div></td>
                        <td>INSERT</td>
                        <td><span class="badge badge-green">carbon_activity</span></td>
                        <td>${new Date(a.date).toLocaleTimeString()}</td>
                    </tr>
                `;
            });
        }
    }
}

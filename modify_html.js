const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('public/index.html', 'utf8');
const $ = cheerio.load(html);

// Remove default dashboard stats / placeholder text
$('.metric-value').text('0');
$('.welcome-score-val').text('0');
$('.meter-val').html('0 <span class="emission-unit">kg CO₂</span>');

// Register
$('#page-register input[type="text"]').eq(0).attr('id', 'reg-name').val('');
$('#page-register input[type="number"]').eq(0).attr('id', 'reg-age').val('');
$('#page-register input[type="email"]').eq(0).attr('id', 'reg-email').val('');
$('#page-register input[type="password"]').eq(0).attr('id', 'reg-password').val('');
$('#page-register input[type="text"]').eq(1).attr('id', 'reg-location').val('');
$('#page-register button.btn-primary').attr('onclick', 'doRegister()');

// Login
$('#page-login input[type="email"]').eq(0).attr('id', 'login-email').val('');
$('#page-login input[type="password"]').eq(0).attr('id', 'login-password').val('');
$('#page-login button.btn-primary').attr('onclick', 'doLogin()');

// Admin Login
$('#page-admin-login input[type="email"]').eq(0).attr('id', 'admin-email').val('');
$('#page-admin-login input[type="password"]').eq(0).attr('id', 'admin-password').val('');
$('#page-admin-login button.btn-full').attr('onclick', 'doAdminLogin()');

// Add Activity
$('#page-add-activity select').eq(0).attr('id', 'act-type');
$('#page-add-activity select').eq(1).attr('id', 'act-mode');
$('#page-add-activity input[type="date"]').eq(0).attr('id', 'act-date');
$('#page-add-activity input[type="number"]').eq(0).attr('id', 'act-dist');
$('#page-add-activity button.btn-primary').attr('onclick', 'doAddActivity()');

// Assign IDs for Dashboards
$('.metric-card').eq(0).find('.metric-value').attr('id', 'dash-total-co2');
$('.metric-card').eq(1).find('.metric-value').attr('id', 'dash-elec-kwh');
$('.metric-card').eq(2).find('.metric-value').attr('id', 'dash-trans-km');
$('.metric-card').eq(3).find('.metric-value').attr('id', 'dash-waste-kg');

// Add IDs for tables and clear dummy data
$('.data-table tbody').empty();
$('.data-table').eq(0).find('tbody').attr('id', 'recent-activities-body'); // Dashboard
$('.data-table').eq(1).find('tbody').attr('id', 'report-breakdown-body'); // Report Breakdown
$('.data-table').eq(2).find('tbody').attr('id', 'admin-logs-body'); // Admin DB
$('.data-table').eq(3).find('tbody').attr('id', 'admin-users-body'); // Admin Users
$('.data-table').eq(4).find('tbody').attr('id', 'admin-activities-body'); // Admin Activities
$('.data-table').eq(5).find('tbody').attr('id', 'admin-reports-body'); // Admin Reports
$('.data-table').eq(6).find('tbody').attr('id', 'admin-recs-body'); // Admin Recs

// Clear dummy lists
$('.lb-item').remove();
$('.rec-grid').empty();
$('.rec-grid').attr('id', 'recs-container');
$('.notif-item').remove();

// Map Logout
$('.sidebar-item:contains("Logout")').attr('onclick', 'doLogout()');

// Append script
$('body').append('<script src="app.js"></script>');

fs.writeFileSync('public/index.html', $.html());
console.log('Modified index.html');

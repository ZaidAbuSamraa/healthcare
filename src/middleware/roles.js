const pool = require('../config/database');

// Available roles in the system
const ROLES = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    DONOR: 'donor',
    VOLUNTEER: 'volunteer',
    NGO: 'ngo'
};

// Role permissions mapping
const PERMISSIONS = {
    admin: ['all'],
    doctor: ['view_patients', 'manage_consultations', 'write_prescriptions', 'view_medical_history'],
    patient: ['view_own_data', 'book_consultations', 'request_medications', 'join_support_groups'],
    donor: ['make_donations', 'view_cases', 'view_donation_history'],
    volunteer: ['accept_deliveries', 'view_medication_requests', 'update_delivery_status'],
    ngo: ['create_missions', 'manage_camps', 'register_volunteers']
};

// Middleware to check role
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role'] || req.body.role;
        
        if (!userRole) {
            return res.status(401).json({ 
                success: false, 
                error: 'Role not provided. Include x-user-role header.' 
            });
        }
        
        if (allowedRoles.includes('all') || allowedRoles.includes(userRole) || userRole === 'admin') {
            req.userRole = userRole;
            next();
        } else {
            res.status(403).json({ 
                success: false, 
                error: 'Access denied. Insufficient permissions.',
                required_roles: allowedRoles
            });
        }
    };
};

// Check if user has specific permission
const hasPermission = (role, permission) => {
    const rolePermissions = PERMISSIONS[role] || [];
    return rolePermissions.includes('all') || rolePermissions.includes(permission);
};

// Get role permissions
const getRolePermissions = (role) => {
    return PERMISSIONS[role] || [];
};

module.exports = {
    ROLES,
    PERMISSIONS,
    checkRole,
    hasPermission,
    getRolePermissions
};

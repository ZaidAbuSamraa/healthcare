const express = require('express');
const router = express.Router();
const { ROLES, PERMISSIONS, getRolePermissions, checkRole } = require('../middleware/roles');

// Get all available roles
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            roles: Object.values(ROLES),
            descriptions: {
                admin: 'مدير النظام - Full system access',
                doctor: 'طبيب - Medical consultations and prescriptions',
                patient: 'مريض - Access to healthcare services',
                donor: 'متبرع - Donation and sponsorship',
                volunteer: 'متطوع - Medication delivery',
                ngo: 'منظمة - Medical missions and camps'
            }
        }
    });
});

// Get permissions for a specific role
router.get('/:role/permissions', (req, res) => {
    const role = req.params.role.toLowerCase();
    
    if (!ROLES[role.toUpperCase()]) {
        return res.status(404).json({
            success: false,
            error: 'Role not found',
            available_roles: Object.values(ROLES)
        });
    }
    
    res.json({
        success: true,
        data: {
            role: role,
            permissions: getRolePermissions(role)
        }
    });
});

// Get all permissions mapping
router.get('/permissions/all', (req, res) => {
    res.json({
        success: true,
        data: PERMISSIONS
    });
});

// Validate user role (for testing)
router.post('/validate', (req, res) => {
    const { role, required_permission } = req.body;
    
    if (!role) {
        return res.status(400).json({
            success: false,
            error: 'Role is required'
        });
    }
    
    const permissions = getRolePermissions(role);
    const hasAccess = permissions.includes('all') || permissions.includes(required_permission);
    
    res.json({
        success: true,
        data: {
            role: role,
            required_permission: required_permission,
            has_access: hasAccess,
            user_permissions: permissions
        }
    });
});

// Example protected route (admin only)
router.get('/admin-only', checkRole('admin'), (req, res) => {
    res.json({
        success: true,
        message: 'Welcome Admin!',
        user_role: req.userRole
    });
});

// Example protected route (doctors and admin)
router.get('/medical-staff', checkRole('admin', 'doctor'), (req, res) => {
    res.json({
        success: true,
        message: 'Welcome Medical Staff!',
        user_role: req.userRole
    });
});

module.exports = router;

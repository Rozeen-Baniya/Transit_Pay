const router = require("express").Router();
const userController = require("../controllers/user.controller");
const { auth } = require("../middlewares/auth.middleware");

// Create initial admin (protected by secret)
router.post("/create-admin", userController.createAdmin);

// Create a new user
router.post("/create", userController.createUser);

// Login
router.post("/login", userController.login);

// Profile
router.get("/me/:userId", userController.me);

// Temporary route to list users (remove in production)
router.get("/list-all", userController.listAllUsers);

// Password reset flow
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);

// Admin unlock user (requires auth + admin role check in controller)
router.post('/unlock/:userId', auth, userController.unlockUser);
// Refresh token and session management
router.post('/refresh-token', userController.refreshToken);
router.post('/logout', userController.logout);

module.exports = router;

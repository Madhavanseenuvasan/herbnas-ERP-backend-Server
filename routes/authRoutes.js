const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { register, login, getUsers, updateUser, forgotPassword, resetPassword, deactivateUser, updateRole, deleteUser, getUserByName, toggleWebAccess, superAdminSetPassword } = require('../controllers/authController');

//  Authentication
router.route("/register").post(register);
router.route("/login").post(login);

//  User Management

router.route("/")
  .get(authenticate, authorizeRoles("super_admin", "branch_manager"), getUsers);



// Only one .put route for /:id, handle updateUser and updateRole in controller
router.route("/:id")
  .put(authenticate, authorizeRoles("super_admin", "admin", "branch_manager"), updateUser);

router.route("/:id/deactivate")
  .put(authenticate, authorizeRoles("super_admin"), deactivateUser);


// router.route('/forgot-password').post(forgotPassword);

// router.route('/reset-password/:token').post(resetPassword);


router.route('/reset-password/:userId')
  .put(authenticate,authorizeRoles("super_admin"), superAdminSetPassword)


router.route('/:id')
  .delete(authenticate, authorizeRoles("super_admin"), deleteUser);

router.route('/:id/web-acess')
  .patch(authenticate, authorizeRoles("super_admin", "admin"), toggleWebAccess);

router.route('/search/:name')
  .get(getUserByName)


module.exports = router;
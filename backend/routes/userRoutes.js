const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  editUser,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");
require("dotenv").config("../config.env");
const router = express.Router();

router.route("/").get(protect, allUsers);
router.route("/").post(registerUser);
router.post("/login", authUser);
router.post("/edit", editUser);
// router.get("/login/federated/google", passport.authenticate("google"));
module.exports = router;

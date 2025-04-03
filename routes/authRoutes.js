const express = require("express");
const { register, validateEmail, login, updatePersonalData, updateCompanyData, uploadLogo, getMe, deleteMe, forgotPassword, resetPassword, inviteUser } = require("../controllers/authController");
const verifyToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

/**
 * @openapi
 * /api/user/register:
 *  post:
 *      tags:
 *      - User
 *      summary: "Register a new user"
 *      description: "This endpoint registers a new user with email and password."
 *      requestBody:
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: "#/components/schemas/user"
 *      responses:
 *          '201':
 *              description: Successfully created user
 *          '400':
 *              description: Validation error (invalid email or password)
 *          '409':
 *              description: Conflict (email already registered)
 */
router.post("/register", register);

/**
 * @openapi
 * /api/user/validate:
 *  put:
 *      tags:
 *      - User
 *      summary: "Validate user email"
 *      description: "This endpoint validates the user's email with a code sent via email."
 *      requestBody:
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: "#/components/schemas/validationCode"
 *      responses:
 *          '200':
 *              description: Email validated successfully
 *          '400':
 *              description: Validation error
 *          '404':
 *              description: User not found
 */
router.put("/validate", verifyToken, validateEmail);

/**
 * @openapi
 * /api/user/login:
 *  post:
 *      tags:
 *      - User
 *      summary: "User login"
 *      description: "This endpoint logs in a user and provides a JWT token."
 *      requestBody:
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: "#/components/schemas/login"
 *      responses:
 *          '200':
 *              description: Successfully logged in, returns user data and token
 *          '401':
 *              description: Invalid credentials
 */
router.post("/login", login);

/**
 * @openapi
 * /api/user/personal:
 *  put:
 *      tags:
 *      - User
 *      summary: "Update personal user data"
 *      description: "This endpoint updates personal data of the logged-in user."
 *      responses:
 *          '200':
 *              description: Personal data updated successfully
 *          '400':
 *              description: Validation error
 *          '401':
 *              description: Unauthorized access (invalid token)
 */
router.put("/personal", verifyToken, updatePersonalData);

/**
 * @openapi
 * /api/user/company:
 *  patch:
 *      tags:
 *      - User
 *      summary: "Update company data"
 *      description: "This endpoint updates company data for the logged-in user."
 *      responses:
 *          '200':
 *              description: Company data updated successfully
 *          '400':
 *              description: Validation error
 *          '401':
 *              description: Unauthorized access (invalid token)
 */
router.patch("/company", verifyToken, updateCompanyData);

/**
 * @openapi
 * /api/user/logo:
 *  patch:
 *      tags:
 *      - User
 *      summary: "Upload company logo"
 *      description: "This endpoint uploads a company logo for the logged-in user."
 *      requestBody:
 *          content:
 *              multipart/form-data:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          logo:
 *                              type: string
 *                              format: binary
 *      responses:
 *          '200':
 *              description: Logo uploaded successfully
 *          '400':
 *              description: Validation error
 */
router.patch("/logo", verifyToken, upload.single("logo"), uploadLogo);

/**
 * @openapi
 * /api/user/me:
 *  get:
 *      tags:
 *      - User
 *      summary: "Get logged-in user data"
 *      description: "This endpoint retrieves the data of the logged-in user."
 *      responses:
 *          '200':
 *              description: Successfully retrieved user data
 *          '401':
 *              description: Unauthorized access (invalid token)
 */
router.get("/me", verifyToken, getMe);

/**
 * @openapi
 * /api/user/delete:
 *  delete:
 *      tags:
 *      - User
 *      summary: "Delete logged-in user"
 *      description: "This endpoint deletes the logged-in user's account."
 *      responses:
 *          '200':
 *              description: User account deleted successfully
 *          '401':
 *              description: Unauthorized access (invalid token)
 */
router.delete("/delete", verifyToken, deleteMe);

/**
 * @openapi
 * /api/user/forgot-password:
 *  post:
 *      tags:
 *      - User
 *      summary: "Request password reset"
 *      description: "This endpoint requests a password reset email for the user."
 *      requestBody:
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                              example: "user@example.com"
 *      responses:
 *          '200':
 *              description: Password reset email sent
 *          '400':
 *              description: Validation error
 */
router.post("/forgot-password", forgotPassword);

/**
 * @openapi
 * /api/user/reset-password:
 *  post:
 *      tags:
 *      - User
 *      summary: "Reset user password"
 *      description: "This endpoint resets the user's password using a token received via email."
 *      requestBody:
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          token:
 *                              type: string
 *                          newPassword:
 *                              type: string
 *                              example: "NewPassword123!"
 *      responses:
 *          '200':
 *              description: Password reset successfully
 *          '400':
 *              description: Validation error
 */
router.post("/reset-password", resetPassword);

/**
 * @openapi
 * /api/user/invite:
 *  post:
 *      tags:
 *      - User
 *      summary: "Invite another user to your company"
 *      description: "This endpoint sends an invitation to another user to join the company."
 *      responses:
 *          '200':
 *              description: Invitation sent successfully
 *          '401':
 *              description: Unauthorized access (invalid token)
 */
router.post("/invite", verifyToken, inviteUser);

module.exports = router;

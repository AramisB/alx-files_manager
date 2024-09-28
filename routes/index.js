import express from "express";
import AppController from "../controllers/AppController.js";
import AuthController from "../controllers/AuthController.js";
import UsersController from "../controllers/UsersController.js";


const router = express.Router();
// GET /status => AppController.getStatus
router.get('/status', AppController.getStatus);
// GET /stats => AppController.getStats
router.get('/stats', AppController.getStats);

// add a new endpoint: POST /users => UsersController.postNew
router.post('/users', UsersController.postNew);
// GET /connect => AuthController.getConnect
router.get('/connect', AuthController.getConnect);
// GET /disconnect => AuthController.getDisconnect
router.get('/disconnect', AuthController.getDisconnect);
// GET /users/me => UserController.getMe
router.get('/users/me', UsersController.getMe);

export default router;

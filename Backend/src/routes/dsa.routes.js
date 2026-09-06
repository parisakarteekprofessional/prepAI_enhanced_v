const { Router } = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const dsaController = require("../controllers/dsa.controller")

const dsaRouter = Router()

dsaRouter.get("/dashboard", authMiddleware.authUser, dsaController.getDsaDashboardController)
dsaRouter.get("/progress", authMiddleware.authUser, dsaController.getDsaProgressController)
dsaRouter.patch("/progress", authMiddleware.authUser, dsaController.updateDsaProgressController)
dsaRouter.post("/notes", authMiddleware.authUser, dsaController.saveDsaNoteController)

module.exports = dsaRouter

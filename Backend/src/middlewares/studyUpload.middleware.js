const multer = require("multer")
const path = require("path")
const fs = require("fs")

const UPLOAD_DIR = path.resolve(__dirname, "../../uploads/documents")
osDirs = [ UPLOAD_DIR ]
osDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `doc-${uniqueSuffix}${ext}`)
    }
})

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "")
    const allowedExtensions = [ "pdf", "docx", "txt", "md" ]

    if (allowedExtensions.includes(ext)) {
        cb(null, true)
    } else {
        cb(new Error(`Unsupported file extension: .${ext}. Only PDF, DOCX, TXT, and MD are allowed.`), false)
    }
}

const studyUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB MVP limit
    },
    fileFilter
})

module.exports = studyUpload

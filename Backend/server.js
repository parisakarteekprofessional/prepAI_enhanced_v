const express = require("express")
const path = require("path")
require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")
connectToDB()

const publicPath = path.resolve(__dirname, "public")

app.use(express.static(publicPath))

app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"))
})


app.listen(3000, () => {
    console.log("Server is running on port 3000")
})

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

let app = express()

let corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}

app.use(cors(corsOptions))

app.use(express.json({
  limit: '16kb'
}))

app.use(express.urlencoded({
  extended: true,
  limit: '16kb'
}))

app.use(express.static('public'))

app.use(cookieParser())

export default app

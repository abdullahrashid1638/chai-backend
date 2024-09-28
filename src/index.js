// require('dotenv').config({ path: './env' })
import dotenv from 'dotenv'
import connectDB from './db/index.js'
import app from './app.js'

dotenv.config({ path: './env' })

connectDB()
  .then(() => {
    app.on('error', err => {
      console.log(`Unable to connect !! ${err}`)
      throw err
    })
    
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT || 8000}`)
    })
  })
  .catch(err => {
    console.log(`MongoDB connection failed !! ${err}`)
  })

/*
import mongoose from 'mongoose'
import { DB_NAME } from './constants.js'
import express from 'express'

const app = express()

;(async () => {
  try {
    const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on('error', (error) => {
      console.log('Unable to connect', error)
      throw error
    })
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on ${process.env.PORT}`)
    })
    console.log(`Database connected !! Database Host: ${connection.connection.host}`)
  } catch (error) {
    console.error(error)
    throw error
  }
})()
*/

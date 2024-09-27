import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

let connectDB = async () => {
  try {
    const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`\n MongoDB connected !! DB HOST: ${connection.connection.host}`)
  } catch (error) {
    console.log('MONGODB connection FAILED', error)
    process.exit(1)
  }
}

export default connectDB

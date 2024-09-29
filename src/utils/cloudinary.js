import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
})

let uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return
    // Upload the file on Cloudinary
    let response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    })
    // File has been uploaded successfully
    // console.log(`File is uploaded on Cloudinary`)
    // console.log(response.url)
    fs.unlinkSync(localFilePath)
    // console.log(response)
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath)  // Remove the local saved temp file as the upload operation got failed
    return null
  }
}

export { uploadOnCloudinary }

import multer from 'multer'
import path from 'path'

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)  // Get the file extension
    cb(null, file.fieldname + '-' + uniqueSuffix + extension)  // Append the extension
  },
})

export const upload = multer({ storage })

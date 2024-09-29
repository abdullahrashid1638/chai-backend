import asyncHandler from '../utils/asyncHandler.js'

let registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: 'chai aur code',
  })
})

export default registerUser

import APIError from '../utils/APIError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import APIResponse from '../utils/APIResponse.js'

let registerUser = asyncHandler(async (req, res) => {
  // Get user data
  // Processing on user data (eg. validation for data feild)
  // Check if user already exists
  // Check the images files
  // Upload to cloudinary, avatar
  // Create objects and create entry in DB
  // Remove password and refresh token field from response
  // Check for user creation
  // return response

  let { username, email, fullname, password } = req.body

  if (
    [fullname, email, username, password].some((field) => field?.trim() === '')
  ) {
    throw new APIError(400, 'All fields are required')
  }

  let existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) throw new APIError(409, 'User already exits or email already exists')

  let avatarLocalPath = req.files?.avatar[0]?.path
  // let coverImageLocalPath = req.files?.coverImage[0]?.path
  let coverImageLocalPath;
  if (
    req.files
    && Array.isArray(req.files.coverImage)
    && req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath) throw new APIError(400, 'Avatar is required')

  let avatar = await uploadOnCloudinary(avatarLocalPath)
  let coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) throw new APIError(400, 'Avatar is required')

  let user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  })

  let createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  )

  if (!createdUser) throw new APIError(500, 'Something went wrong while registering a user')

  return res.status(201).json(
    new APIResponse(200, createdUser, 'User registered successfully')
  )
})

export default registerUser

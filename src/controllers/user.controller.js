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

let loginUser = asyncHandler(async (req, res) => {
  // Get user information
  // Find the user in the database
  // If user exist verify the username or email and password
  // Generate and send cookies Access and Refresh tokens to the User

  let { email, username, password } = req.body

  if (!username && !email) throw new APIError(400, 'Username or Email is required')

  let user = await User.findOne({
    $or: [{ username }, { email }],
  })

  if (!user) throw new APIError(404, 'User does not exist')

  let isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) throw new APIError(404, 'Password is incorrect')

  let { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  let loggedInUser = await User.findById(user._id).select('-password -refreshToken')

  let options = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new APIResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        'User logged in successfully'
      )
    )
})

let logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  )

  let options = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new APIResponse(
      200,
      {},
      'User Logged our'
    ))
})

let generateAccessAndRefreshTokens = async (userId) => {
  try {
    let user = await User.findById(userId)

    let accessToken = user.generateAccessToken()
    let refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    throw new APIError(500, 'Something went wrong while generating tokens')
  }
}

export { registerUser, loginUser, logoutUser }

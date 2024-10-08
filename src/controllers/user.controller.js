import APIError from '../utils/APIError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js'
import APIResponse from '../utils/APIResponse.js'
import jwt from 'jsonwebtoken'
import { cookieOptions } from '../constants.js'
import mongoose from 'mongoose'

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
    avatar: {
      url: avatar.url,
      public_id: avatar.public_id,
    },
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

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
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
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  )

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new APIResponse(
      200,
      {},
      'User Logged our'
    ))
})

let refreshAccessToken = asyncHandler(async (req, res) => {
  let incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) throw new APIError(400, 'Unauthorized request')

  try {
    let decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    let user = await User.findById(decodedRefreshToken?._id)

    if (!user) throw new APIError(401, 'Invalid refresh token')
  
    if (incomingRefreshToken !== user?.refreshToken) throw new APIError(401, 'Invalid refresh token: Token mismatch or reused.')
  
    let { accessToken, refreshToken  } = await generateAccessAndRefreshTokens(user._id)

    return res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json(
        new APIResponse(
          200,
          {
            accessToken,
            refreshToken: refreshToken,
          },
          'Access token refreshed'
        )
      )
  } catch (error) {
    throw new APIError(401, error?.message || 'Invalid refresh token')
  }
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

let changeCurrentPassword = asyncHandler(async (req, res) => {
  let { oldPassword, newPassword } = req.body

  let user = await User.findById(req.user?._id)

  let isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) throw new APIError(400, 'Invalid old password')

  user.password = newPassword

  await user.save({ validateBeforeSave: true })

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        {},
        'Password changed successfully'
      )
    )
})

let getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        req.user,
        'Current user fetched successfully'
      )
    )
})

let updateUserInfo = asyncHandler(async (req, res) => {
  let { fullname, email } = req.body

  if (!fullname || !email) throw new APIError(400, 'All fields are required')

  let updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    {
      new: true
    }
  ).select('-password')

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        updatedUser,
        'Account details are updated'
      )
    )
})

let updateUserAvatar = asyncHandler(async (req, res) => {
  let avatarLocalPath = req.file?.path
  let oldAvatarPublicId = req.user?.avatar?.public_id
  
  if (!avatarLocalPath) throw new APIError(400, 'Avatar file is missing')

  // TODO: Delete old avatar

  await deleteFromCloudinary(oldAvatarPublicId)

  let avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) throw new APIError(400, 'Error while uploading on avatar')

  let updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: {
          url: avatar.url,
          public_id: avatar.public_id,
        },
      },
    },
    {
      new: true
    }
  ).select('-password')

  console.log(updatedUser)  

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        updatedUser,
        'Avatar updated successfully'
      )
    )
})

let updateUserCoverImage = asyncHandler(async (req, res) => {
  let coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) throw new APIError(400, 'Cover image file is missing')

  let coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) throw new APIError(400, 'Error while uploading on cover image')

  let updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true
    }
  ).select('-password')

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        updatedUser,
        'Cover Image updated successfully'
      )
    )
})

let getUserChannelProfile = asyncHandler(async (req, res) => {
  let { username } = req.params

  if (!username?.trim()) throw new APIError(400, 'Username is missing')

  let channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },   
    },
    {
      $lookup: {
        from: 'Subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'Subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscibersCount: {
          $size: '$subscribers',
        },
        channelsSubscribedToCount: {
          $size: '$subscribedTo',
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, '$subscribers.subscriber'] },
            then: true,
            else: false,
          },
        }
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscibersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ])

  console.log(channel)

  if (!channel?.length) throw new APIError(404, 'Channel does not exist')

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        channel[0],
        'User channel fetched successfully'
      )
    )  
})

let getWatchHistory = asyncHandler(async (req, res) => {
  let user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
                {
                  $addFields: {
                    owner: {
                      $first: '$owner',
                    },
                  },
                }
              ],
            },
          },
        ],
      },
    }
  ])

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        user[0].watchHistory,
        'Watch history fetched successfully'
      )
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserInfo,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
}

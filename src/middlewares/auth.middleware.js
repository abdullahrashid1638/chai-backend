import { User } from '../models/user.model.js'
import APIError from '../utils/APIError.js'
import asyncHandler from '../utils/asyncHandler.js'
import jwt from 'jsonwebtoken'

export let verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    let token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearar ', '')
  
    if (!token) throw new APIError(401, 'Unauthorized request')
  
    let decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
    let user = await User.findById(decodedToken?._id).select('-password -refershToken')
  
    // TODO: Discuss about frontend
    if (!user) throw new APIError(401, 'Invalid Access Token')
  
    req.user = user
  
    next()
  } catch (error) {
    throw new APIError(401, error?.message || 'Invalid access token')
  }
})
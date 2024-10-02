import { Router } from 'express'
import { registerUser, loginUser, logoutUser, refreshAccessToken, updateUserInfo, updateUserAvatar, getUserChannelProfile } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

let router = Router()

router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    }
  ]),
  registerUser
)

router.route('/login').post(
  // upload.none(),  // For using multipart/form-data
  loginUser
)

// Secured routes

router.route('/logout').post(
  verifyJWT,
  logoutUser
)

router.route('/refresh-token').post(
  refreshAccessToken
)

router.route('/update-user').post(
  verifyJWT,
  updateUserInfo
)

router.route('/update-avatar').post(
  verifyJWT,
  upload.single('avatar'),
  updateUserAvatar
)

router.route('/channel').post(
  verifyJWT,
  getUserChannelProfile,
)

export default router

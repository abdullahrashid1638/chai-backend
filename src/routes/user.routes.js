import { Router } from 'express'
import { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUserInfo,
  updateUserAvatar,
  getUserChannelProfile,
  changeCurrentPassword,
  getCurrentUser,
  getWatchHistory
} from '../controllers/user.controller.js'
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

router.route('/update-user').patch(
  verifyJWT,
  updateUserInfo
)

router.route('/update-avatar').patch(
  verifyJWT,
  upload.single('avatar'),
  updateUserAvatar
)

router.route('/channel').post(
  verifyJWT,
  getUserChannelProfile,
)

router.route('/change-password').post(
  verifyJWT,
  changeCurrentPassword,
)

router.route('/c/:username').get(
  verifyJWT,
  getCurrentUser,
)

router.route('/history').get(
  verifyJWT,
  getWatchHistory,
)

export default router

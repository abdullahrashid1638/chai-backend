import mongoose, { Schema } from 'mongoose'

let supscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,  // One who is subscribing
      ref: 'User',
    },
    channel: {
      type: Schema.Types.ObjectId,  // One whom is subscribed
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

export const Subscription = mongoose.model('Subscription', supscriptionSchema)

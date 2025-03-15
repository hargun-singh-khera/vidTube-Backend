import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if(!content) {
        throw new ApiError(400, "Please add content to your post or tweet.")
    }
    const generateTweet = await Tweet.create({
        content,
        owner: req.user?._id
    })
    if(!generateTweet) {
        throw new ApiError(500, "Something went wrong while creating your tweet.")
    }
    const tweet = await Tweet.findById(generateTweet._id)
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!userId) {
        throw new ApiError(400, "User ID is required")
    }
    const tweets = await Tweet.find({owner: userId})
    if(!tweets) {
        throw new ApiError(404, "No tweets found for this user")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "All tweets fetched successfully for this user"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId) {
        throw new ApiError(400, "Tweet ID is required")
    }
    const {content} = req.body
    if(!content) {
        throw new ApiError(400, "Please add content to your post or tweet.")
    }
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {content}
        },
        {new: true}
    )
    if(!tweet) {
        throw new ApiError(404, "Unable to update since Tweet is not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId) {
        throw new ApiError(400, "Tweet ID is required")
    }
    const tweet = await Tweet.findByIdAndDelete(tweetId)
    if(!tweet) {
        throw new ApiError(404, "Failed to delete tweet, tweet not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
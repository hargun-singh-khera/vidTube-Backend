import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId) {
        throw new ApiError(400, "Video ID is required")
    }
    const videoExists = await Video.findById(videoId)
    if(!videoExists) {
        throw new ApiError(404, "Video not found")
    }
    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if(isLiked) {
        await Like.deleteOne(isLiked._id)
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video unliked successfully"))
    }

    const like = await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })
    
    return res
        .status(200)
        .json(new ApiResponse(200, like, "Video liked successfully"))
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId) {
        throw new ApiError(400, "Comment ID is required")
    }
    const commentExists = await Comment.findById(commentId)
    if(!commentExists) {
        throw new ApiError(404, "Comment not found")
    }
    const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if(isLiked) {
        await Like.deleteOne(isLiked._id)
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment unliked successfully"))
    }
    const liked = await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })
    return res
        .status(200)
        .json(new ApiResponse(200, liked, "Comment liked successfully")) 
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId) {
        throw new ApiError(400, "Tweet ID is required")
    }
    const tweetExists = await Tweet.findById(tweetId)
    if(!tweetExists) {
        throw new ApiError(404, "Tweet not found")
    }
    const isLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })    
    if(isLiked) {
        await Like.deleteOne(isLiked._id)
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet unliked successfully"))
    }
    const liked = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })
    
    return res
        .status(200)
        .json(new ApiResponse(200, liked, "Tweet liked successfully"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
import mongoose, { connect } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const comment = await Comment.find({})
    return res
        .status(200)
        .json(new ApiResponse(200, comment, "All comments fetched successfully for this video"))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    if(!content) {
        throw new ApiError(400, "Please add a comment to submit")
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    const generatedComment = await Comment.findById(comment._id)
    if(!generatedComment) {
        throw new ApiError(500, "Something went wrong while adding your comment.")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, generatedComment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body
    if(!content) {
        throw new ApiError(400, "Please add a comment to submit")
    }
    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {content}
        },
        {new: true}
    )
    if(!comment) {
        throw new ApiError(404, "Comment not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const comment = await Comment.findByIdAndDelete(commentId)
    if(!comment) {
        throw new ApiError(404, "Comment not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}